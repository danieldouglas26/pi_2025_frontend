import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormArray,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { TruckService } from '../../../services/truck.service';
import { NotificationService } from '../../../services/notification.service';
import { TruckRequest, TruckResponse } from '../../../core/models/truck.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ResidueType } from '../../../core/models/enums';

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
  private activatedRoute = inject(ActivatedRoute);

  truckForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Adicionar Novo Caminhão';

  readonly availableResidueTypes = Object.values(ResidueType);

  @Input() id?: number;

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    const routeIdStr = this.activatedRoute.snapshot.paramMap.get('id');
    const routeId = routeIdStr ? +routeIdStr : null;


    if (routeId !== null && !isNaN(routeId)) {
      this.id = routeId;
      this.isEditMode = true;
      this.pageTitle = 'Editar Caminhão';
      this.loadTruckData(this.id);
    } else {
      this.pageTitle = 'Adicionar Novo Caminhão';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private minSelectedCheckboxes(min = 1) {
    return (control: AbstractControl): ValidationErrors | null => {
      const formArray = control as FormArray;
      const totalSelected = formArray.controls
        .map(ctrl => ctrl.value)
        .reduce((sum, next) => next ? sum + 1 : sum, 0);
      return totalSelected >= min ? null : { required: true };
    };
  }

  private initializeForm(): void {
    this.truckForm = this.fb.group({
      placa: ['', [Validators.required, Validators.pattern('^[A-Z]{3}-?[0-9][A-Z][0-9]{2}$')]],
      nomeMotorista: ['', [Validators.required, Validators.minLength(3)]],
      capacidade: [null, [Validators.required, Validators.min(1)]],
      tipoResiduos: this.fb.array(
        this.availableResidueTypes.map(() => this.fb.control(false)),
        [this.minSelectedCheckboxes(1)]
      )
    });
  }

  get tipoResiduosFormArray(): FormArray {
    return this.truckForm.get('tipoResiduos') as FormArray;
  }

  private updateResidueTypesCheckboxes(selectedTypes: string[] = []): void {
    const normalizedSelectedTypes = (selectedTypes || []).map(type =>
      type?.toString().toUpperCase().trim()
    );

    const newValues = this.availableResidueTypes.map(type => {
      const typeStr = type.toString().toUpperCase().trim();
      return normalizedSelectedTypes.includes(typeStr);
    });

    this.tipoResiduosFormArray.setValue(newValues);
  }

  private getSelectedResidueTypesFromForm(): string[] {
    return this.truckForm.value.tipoResiduos
      .map((checked: boolean, i: number) => checked ? this.availableResidueTypes[i] : null)
      .filter((value: string | null): value is string => value !== null);
  }

  loadTruckData(truckId: number): void {
    this.isLoading = true;
    const sub = this.truckService.getTruckById(truckId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response: TruckResponse) => {
        this.truckForm.patchValue({
          placa: response.placa,
          nomeMotorista: response.nomeMotorista,
          capacidade: response.capacidade,
        });

        this.updateResidueTypesCheckboxes(response.tipoResiduos);
      },
      error: (err: HttpErrorResponse) => {
        this.notificationService.error('Erro ao carregar dados do caminhão.');
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
      placa: formValue.placa,
      nomeMotorista: formValue.nomeMotorista,
      capacidade: formValue.capacidade,
      tipoResiduos: this.getSelectedResidueTypesFromForm()
    };

    let operation$: Observable<TruckResponse>;

    if (this.isEditMode && typeof this.id === 'number') {
      operation$ = this.truckService.updateTruck(this.id, truckData);
    } else {
      operation$ = this.truckService.createTruck(truckData);
    }

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: () => {
        this.notificationService.success(`Caminhão ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        this.router.navigate(['/trucks']);
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (apiResponse?.message) {
          this.notificationService.error(apiResponse.message);
        } else {
          this.notificationService.error('Ocorreu um erro inesperado. Tente novamente.');
        }
      },
    });
    this.subscriptions.add(sub);
  }

  cancel(): void {
    this.router.navigate(['/trucks']);
  }
}
