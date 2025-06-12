import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Importe ActivatedRoute
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { CollectionPointService } from '../../../services/collection-point.service';
import { NotificationService } from '../../../services/notification.service';

// Models & Enums
import { CollectionPointRequest, CollectionPointResponse } from '../../../core/models/collection-point.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ResidueType } from '../../../core/models/enums';

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
  private activatedRoute = inject(ActivatedRoute); // Injeção do ActivatedRoute

  pointForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Adicionar Novo Ponto de Coleta';

  readonly availableResidueTypes = Object.values(ResidueType);

  @Input() id?: string; // Mantemos o @Input por compatibilidade, mas o ActiveRoute é mais robusto aqui

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Obtenha o ID da rota no início
    const routeId = this.activatedRoute.snapshot.paramMap.get('id');
    console.log('ID do ponto de coleta (ActivatedRoute):', routeId);

    // Sempre construa os checkboxes primeiro, mesmo que vazios.
    // Isso garante que o FormArray esteja com os controles prontos para o patchValue.
    this.buildResidueTypesCheckboxes();

    if (routeId) {
      this.id = routeId;
      this.isEditMode = true;
      this.pageTitle = 'Editar Ponto de Coleta';
      this.loadPointData(this.id);
    } else {
      this.pageTitle = 'Adicionar Novo Ponto de Coleta';
      // No modo de criação, os checkboxes já foram construídos acima.
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.pointForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      nomeResponsavel: ['', Validators.required],
      informacaoContato: ['', Validators.required],
      endereco: ['', Validators.required],
      // Inicialize o FormArray, mas ele será limpo e preenchido em buildResidueTypesCheckboxes
      tiposDeResiduo: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  get tiposDeResiduoFormArray(): FormArray {
    return this.pointForm.get('tiposDeResiduo') as FormArray;
  }

  private buildResidueTypesCheckboxes(selectedTypes: string[] = []): void {
    // AQUI: a verificação de `selectedTypes` não deve ser null, pois o padrão é `[]`
    // No entanto, se `selectedTypes` vir de uma propriedade que pode ser null,
    // um operador nullish coalescing `?? []` seria mais seguro.
    // Mas o erro mais comum é o FormArray não estar inicializado corretamente no HTML/TS.

    this.tiposDeResiduoFormArray.clear(); // Limpa quaisquer controles existentes
    this.availableResidueTypes.forEach(type => {
      // Garante que `selectedTypes` é um array, mesmo se o backend retornar null/undefined
      const isChecked = (selectedTypes ?? []).includes(type); // Adicionado ?? [] para segurança
      this.tiposDeResiduoFormArray.push(this.fb.control(isChecked));
    });
  }

  private getSelectedResidueTypesFromForm(): string[] {
    return this.pointForm.value.tiposDeResiduo
      .map((checked: boolean, i: number) => checked ? this.availableResidueTypes[i] : null)
      .filter((value: string | null): value is string => value !== null);
  }

  loadPointData(pointId: string): void {
    this.isLoading = true;
    const sub = this.collectionPointService.getCollectionPointById(pointId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response: CollectionPointResponse) => {
        // Preenche os campos do formulário principal primeiro
        this.pointForm.patchValue({
          nome: response.nome,
          nomeResponsavel: response.nomeResponsavel,
          informacaoContato: response.informacaoContato,
          endereco: response.endereco
        });
        // SÓ DEPOIS de patchValue dos campos principais, atualiza o FormArray
        this.buildResidueTypesCheckboxes(response.tiposResiduo);
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 404) {
          this.notificationService.error('Ponto de coleta não encontrado.');
        } else if (err.status === 400 && apiResponse?.errors && typeof apiResponse.errors === 'object') {
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
          this.notificationService.error('Ocorreu um erro inesperado ao buscar os dados do ponto.');
        }
        console.error('Erro detalhado:', err);
        this.router.navigate(['/collection-points']);
      }
    });
    this.subscriptions.add(sub);
  }

  onSubmit(): void {
    if (this.pointForm.invalid) {
      this.pointForm.markAllAsTouched();
      this.notificationService.error('Por favor, corrija os erros no formulário.');
      return;
    }

    this.isLoading = true;

    const pointData: CollectionPointRequest = {
      nome: this.pointForm.value.nome,
      nomeResponsavel: this.pointForm.value.nomeResponsavel,
      informacaoContato: this.pointForm.value.informacaoContato,
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
        console.error('Erro detalhado:', err);
      }
    });
    this.subscriptions.add(sub);
  }

  cancel(): void {
    this.router.navigate(['/collection-points']);
  }
}
