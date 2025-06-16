// src/app/components/trucks/truck-form/truck-form.component.ts

import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
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

  // -> CORREÇÃO: O ID é um número.
  @Input() id?: number;

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    // -> CORREÇÃO: Obter o ID da rota e converter para número.
    const routeIdStr = this.activatedRoute.snapshot.paramMap.get('id');
    const routeId = routeIdStr ? +routeIdStr : null; // O '+' converte a string para número

    this.buildResidueTypesCheckboxes();

    if (routeId !== null && !isNaN(routeId)) { // Verifica se a conversão foi bem-sucedida
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

  private initializeForm(): void {
    this.truckForm = this.fb.group({
      placa: ['', [Validators.required, Validators.pattern('^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$')]],
      nomeMotorista: ['', [Validators.required, Validators.minLength(3)]],
      capacidade: [null, [Validators.required, Validators.min(1)]],
      tipoResiduos: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  get tipoResiduosFormArray(): FormArray {
    return this.truckForm.get('tipoResiduos') as FormArray;
  }

  private buildResidueTypesCheckboxes(selectedTypes: string[] = []): void {
    this.tipoResiduosFormArray.clear();
    this.availableResidueTypes.forEach(type => {
      const isChecked = (selectedTypes ?? []).includes(type);
      this.tipoResiduosFormArray.push(this.fb.control(isChecked));
    });
  }

  private getSelectedResidueTypesFromForm(): string[] {
    return this.truckForm.value.tipoResiduos
      .map((checked: boolean, i: number) => checked ? this.availableResidueTypes[i] : null)
      .filter((value: string | null): value is string => value !== null);
  }

  // -> CORREÇÃO: O ID é um número.
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
        this.buildResidueTypesCheckboxes(response.tipoResiduos);
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

    // -> CORREÇÃO: Garante que 'this.id' é um número antes de usar.
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
