import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
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

  pointForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Adicionar Novo Ponto de Coleta';

  readonly availableResidueTypes = Object.values(ResidueType);

  @Input() id?: string;

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    if (this.id) {
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
      name: ['', [Validators.required, Validators.minLength(3)]],
      responsibleName: ['', Validators.required],
      contactInfo: [''],
      address: ['', Validators.required],
      acceptedResidueTypes: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  get acceptedResidueTypesFormArray(): FormArray {
    return this.pointForm.get('acceptedResidueTypes') as FormArray;
  }

  private buildResidueTypesCheckboxes(selectedTypes: string[] = []): void {
    this.acceptedResidueTypesFormArray.clear();
    this.availableResidueTypes.forEach(type => {
      this.acceptedResidueTypesFormArray.push(this.fb.control(selectedTypes.includes(type)));
    });
  }

  private getSelectedResidueTypesFromForm(): string[] {
    return this.pointForm.value.acceptedResidueTypes
      .map((checked: boolean, i: number) => checked ? this.availableResidueTypes[i] : null)
      .filter((value: string | null): value is string => value !== null);
  }

  loadPointData(pointId: string): void {
    this.isLoading = true;
    const sub = this.collectionPointService.getCollectionPointById(pointId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pointForm.patchValue(response.data);
          this.buildResidueTypesCheckboxes(response.data.acceptedResidueTypes);
        } else {
          this.notificationService.error(response.message || 'Falha ao carregar os dados do ponto.');
          this.router.navigate(['/collection-points']);
        }
      },
      error: (err) => {
        this.notificationService.error('Erro ao buscar os dados do ponto.', err.message);
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
      name: this.pointForm.value.name,
      responsibleName: this.pointForm.value.responsibleName,
      contactInfo: this.pointForm.value.contactInfo,
      address: this.pointForm.value.address,
      acceptedResidueTypes: this.getSelectedResidueTypesFromForm()
    };

    let operation$: Observable<ApiResponse<CollectionPointResponse>>;

    if (this.isEditMode && this.id) {
      operation$ = this.collectionPointService.updateCollectionPoint(this.id, pointData);
    } else {
      operation$ = this.collectionPointService.createCollectionPoint(pointData);
    }

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(`Ponto de coleta ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
          this.router.navigate(['/collection-points']);
        } else {
          this.notificationService.error(response.message || 'A operação falhou.');
        }
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 400 && apiResponse.errors && typeof apiResponse.errors === 'object') {
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
