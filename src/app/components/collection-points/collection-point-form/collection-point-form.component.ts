import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, of } from 'rxjs';
import { finalize, catchError, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { CollectionPointService } from '../../../services/collection-point.service';
import { NotificationService } from '../../../services/notification.service';
import { BairroService } from '../../../services/bairro.service';
import { CollectionPointRequest, CollectionPointResponse } from '../../../core/models/collection-point.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ResidueType } from '../../../core/models/enums';
import { BairroResponse } from '../../../core/models/bairro.model';

@Component({
  selector: 'app-collection-point-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './collection-point-form.component.html',
  styleUrls: ['./collection-point-form.component.scss']
})
export class CollectionPointFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private collectionPointService = inject(CollectionPointService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private subscriptions = new Subscription();
  private activatedRoute = inject(ActivatedRoute);
  private bairroService = inject(BairroService);
  pointForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Adicionar Novo Ponto de Coleta';
  bairros$!: Observable<BairroResponse[]>;

  readonly availableResidueTypes: string[] = Object.values(ResidueType);

  @Input() id?: number;

  constructor() {

    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadBairros();

    const routeId = this.activatedRoute.snapshot.paramMap.get('id');
    const numericId = routeId ? parseInt(routeId, 10) : undefined;

    if (numericId) {
      this.id = numericId;
      this.isEditMode = true;
      this.pageTitle = 'Editar Ponto de Coleta';
      this.loadPointData(this.id);
    } else {
      this.pageTitle = 'Adicionar Novo Ponto de Coleta';

      this.buildResidueTypesCheckboxes();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }



  private initializeForm(): void {
    this.pointForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      idBairro: [null, [Validators.required]],
      nomeResponsavel: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s()-]{10,}$/)]],
      endereco: ['', Validators.required],
      tiposDeResiduo: this.fb.array(
        this.availableResidueTypes.map(() => this.fb.control(false)),
        [Validators.required, Validators.minLength(1)]
      )
    });
  }

  get tiposDeResiduoFormArray(): FormArray {
    return this.pointForm.get('tiposDeResiduo') as FormArray;
  }

  private buildResidueTypesCheckboxes(selectedTypes: string[] = []): void {
    this.tiposDeResiduoFormArray.clear();

    this.availableResidueTypes.forEach(type => {
      const isChecked = (selectedTypes ?? []).includes(type);
      this.tiposDeResiduoFormArray.push(this.fb.control(isChecked));
    });

    if (this.isEditMode && selectedTypes.length > 0) {
      this.tiposDeResiduoFormArray.markAsTouched();
    }
  }

  private getSelectedResidueTypesFromForm(): string[] {
    return this.tiposDeResiduoFormArray.value
      .map((checked: boolean, i: number) => {
        if (checked) {
          const originalType = this.availableResidueTypes[i];
          return originalType;
        }
        return null;
      })
      .filter((value: string | null): value is string => value !== null);
  }
  private loadBairros(): void {
    this.bairros$ = this.bairroService.getAllBairros(0, 1000).pipe(
      map(page => page.content),
      catchError(error => {
        this.notificationService.error('Erro ao carregar bairros. Tente novamente mais tarde.');
        console.error('Erro ao carregar bairros:', error);
        return of([]);
      })
    );
  }

  loadPointData(pointId: number): void {
    this.isLoading = true;
    const sub = this.collectionPointService.getCollectionPointById(pointId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response: CollectionPointResponse) => {
        console.log('Dados do ponto recebidos para edição:', response);

        this.pointForm.patchValue({
          nome: response.nome,
          idBairro: response.idBairro,
          nomeResponsavel: response.responsavel,
          email: response.email,
          telefone: response.telefone,
          endereco: response.endereco
        });

        this.buildResidueTypesCheckboxes(response.tiposResiduo);
        this.pointForm.markAsPristine();
        this.pointForm.markAsUntouched();

      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 404) {
          this.notificationService.error('Ponto de coleta não encontrado.');
        } else if (apiResponse?.message) {
          this.notificationService.error(apiResponse.message);
        } else {
          this.notificationService.error('Ocorreu um erro inesperado ao buscar os dados do ponto.');
        }
        console.error('Erro detalhado ao carregar ponto:', err);
        this.router.navigate(['/collection-points']);
      }
    });
    this.subscriptions.add(sub);
  }

  onSubmit(): void {
    console.log('Dados do formulário antes de enviar:', this.pointForm.value);
    console.log('Tipos de resíduo a serem enviados:', this.getSelectedResidueTypesFromForm());

    if (this.pointForm.invalid) {
      this.pointForm.markAllAsTouched();
      this.notificationService.error('Por favor, corrija os erros no formulário.');
      return;
    }

    this.isLoading = true;

    const pointData: CollectionPointRequest = {
      nome: this.pointForm.value.nome,
      idBairro: this.pointForm.value.idBairro,
      nomeResponsavel: this.pointForm.value.nomeResponsavel,
      email: this.pointForm.value.email,
      telefone: this.pointForm.value.telefone,
      endereco: this.pointForm.value.endereco,
      tiposDeResiduo: this.getSelectedResidueTypesFromForm()
    };

    let operation$: Observable<CollectionPointResponse>;

    if (this.isEditMode && this.id) {
      operation$ = this.collectionPointService.updateCollectionPoint(this.id, pointData);
    } else {
      operation$ = this.collectionPointService.createCollectionPoint(pointData);
    }

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response: CollectionPointResponse) => {
        this.notificationService.success(`Ponto de coleta ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        this.router.navigate(['/collection-points']);
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 400 && apiResponse?.errors && typeof apiResponse.errors === 'object') {
          this.notificationService.error('Foram encontrados erros de validação.');
          Object.keys(apiResponse.errors).forEach(fieldName => {
            const control = this.pointForm.get(fieldName);
            if (control) {
              control.setErrors({ serverError: (apiResponse.errors as any)[fieldName] });
            }
          });
        } else if (apiResponse?.message) {
          this.notificationService.error(apiResponse.message);
        } else {
          this.notificationService.error('Ocorreu um erro inesperado na operação.');
        }
        console.error('Erro detalhado na operação de salvar/atualizar:', err);
      }
    });
    this.subscriptions.add(sub);
  }

  cancel(): void {
    this.router.navigate(['/collection-points']);
  }
}
