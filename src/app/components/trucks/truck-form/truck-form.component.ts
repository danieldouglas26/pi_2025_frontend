import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { TruckService } from '../../../services/truck.service';
import { NotificationService } from '../../../services/notification.service';

// Models & Enums
import { TruckRequest, TruckResponse } from '../../../core/models/truck.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ResidueType, CapacityUnit } from '../../../core/models/enums';

@Component({
  selector: 'app-truck-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './truck-form.component.html',
  styleUrls: ['./truck-form.component.scss']
})
export class TruckFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private truckService = inject(TruckService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private subscriptions = new Subscription();

  truckForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Adicionar Novo Caminhão';

  readonly availableResidueTypes = Object.values(ResidueType);
  readonly availableCapacityUnits = Object.values(CapacityUnit);

  @Input() id?: string;

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    if (this.id) {
      this.isEditMode = true;
      this.pageTitle = 'Editar Caminhão';
      this.loadTruckData(this.id);
    } else {
      this.pageTitle = 'Adicionar Novo Caminhão';
      this.buildResidueTypesCheckboxes();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.truckForm = this.fb.group({
      licensePlate: ['', [Validators.required, Validators.pattern('^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$')]],
      driverName: ['', [Validators.required, Validators.minLength(3)]],
      capacity: [null, [Validators.required, Validators.min(1)]],
      capacityUnit: [CapacityUnit.KG, Validators.required],
      allowedResidueTypes: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  get allowedResidueTypesFormArray(): FormArray {
    return this.truckForm.get('allowedResidueTypes') as FormArray;
  }

  private buildResidueTypesCheckboxes(selectedTypes: string[] = []): void {
    this.allowedResidueTypesFormArray.clear();
    this.availableResidueTypes.forEach(type => {
      this.allowedResidueTypesFormArray.push(this.fb.control(selectedTypes.includes(type)));
    });
  }

  private getSelectedResidueTypesFromForm(): string[] {
    return this.truckForm.value.allowedResidueTypes
      .map((checked: boolean, i: number) => checked ? this.availableResidueTypes[i] : null)
      .filter((value: string | null): value is string => value !== null);
  }

  loadTruckData(truckId: string): void {
    this.isLoading = true;
    const sub = this.truckService.getTruckById(truckId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.truckForm.patchValue(response.data);
          this.buildResidueTypesCheckboxes(response.data.allowedResidueTypes);
        } else {
          this.notificationService.error(response.message || 'Falha ao carregar os dados do caminhão.');
          this.router.navigate(['/trucks']);
        }
      },
      error: (err) => {
        this.notificationService.error('Erro ao buscar os dados do caminhão.', err.message);
        this.router.navigate(['/trucks']);
      }
    });
    this.subscriptions.add(sub);
  }

  onSubmit(): void {
    if (this.truckForm.invalid) {
      this.truckForm.markAllAsTouched();
      this.notificationService.error('Por favor, corrija os erros no formulário.');
      return;
    }

    this.isLoading = true;

    const formValue = this.truckForm.value;
    const truckData: TruckRequest = {
      licensePlate: formValue.licensePlate,
      driverName: formValue.driverName,
      capacity: formValue.capacity,
      capacityUnit: formValue.capacityUnit,
      allowedResidueTypes: this.getSelectedResidueTypesFromForm()
    };

    let operation$: Observable<ApiResponse<TruckResponse>>;

    if (this.isEditMode && this.id) {
      operation$ = this.truckService.updateTruck(this.id, truckData);
    } else {
      operation$ = this.truckService.createTruck(truckData);
    }

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(`Caminhão ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
          this.router.navigate(['/trucks']);
        } else {
          this.notificationService.error(response.message || 'A operação falhou.');
        }
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 400 && apiResponse.errors && typeof apiResponse.errors === 'object') {
          this.notificationService.error('Foram encontrados erros de validação.');
          Object.keys(apiResponse.errors).forEach(fieldName => {
            const control = this.truckForm.get(fieldName);
            if (control) {
              control.setErrors({ serverError: (apiResponse.errors as any)[fieldName] });
            }
          });
        } else if (apiResponse?.message) {
          this.notificationService.error(apiResponse.message);
        } else {
          this.notificationService.error('Ocorreu um erro inesperado. Tente novamente.');
        }
        console.error('Erro detalhado:', err);
      },
    });
    this.subscriptions.add(sub);
  }

  cancel(): void {
    this.router.navigate(['/trucks']);
  }
}
