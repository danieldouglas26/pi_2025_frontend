import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Importe ActivatedRoute
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { TruckService } from '../../../services/truck.service';
import { NotificationService } from '../../../services/notification.service';

// Models & Enums
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
  private activatedRoute = inject(ActivatedRoute); // Injeção do ActivatedRoute

  truckForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Adicionar Novo Caminhão';

  readonly availableResidueTypes = Object.values(ResidueType);

  @Input() id?: string; // Mantemos o @Input por compatibilidade, mas o ActiveRoute é mais robusto aqui

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Obtenha o ID da rota no início
    const routeId = this.activatedRoute.snapshot.paramMap.get('id');
    console.log('ID do caminhão (ActivatedRoute):', routeId); // Log para depuração

    // SEMPRE construa os checkboxes primeiro, mesmo que vazios.
    // Isso garante que o FormArray esteja com os controles prontos para o patchValue.
    this.buildResidueTypesCheckboxes();

    if (routeId) { // Use routeId aqui
      this.id = routeId; // Atribua ao @Input id, se ainda o usar
      this.isEditMode = true;
      this.pageTitle = 'Editar Caminhão';
      this.loadTruckData(this.id);
    } else {
      this.pageTitle = 'Adicionar Novo Caminhão';
      // No modo de criação, os checkboxes já foram construídos acima.
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
    this.tipoResiduosFormArray.clear(); // Limpa quaisquer controles existentes
    this.availableResidueTypes.forEach(type => {
      // Garante que `selectedTypes` é um array, mesmo se o backend retornar null/undefined
      const isChecked = (selectedTypes ?? []).includes(type);
      this.tipoResiduosFormArray.push(this.fb.control(isChecked));
    });
  }

  private getSelectedResidueTypesFromForm(): string[] {
    return this.truckForm.value.tipoResiduos
      .map((checked: boolean, i: number) => checked ? this.availableResidueTypes[i] : null)
      .filter((value: string | null): value is string => value !== null);
  }

  loadTruckData(truckId: string): void {
    this.isLoading = true;
    const sub = this.truckService.getTruckById(truckId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response: TruckResponse) => {
        // Preenche os campos do formulário principal primeiro
        this.truckForm.patchValue({
          placa: response.placa,
          nomeMotorista: response.nomeMotorista,
          capacidade: response.capacidade,
        });
        // SÓ DEPOIS de patchValue dos campos principais, atualiza o FormArray
        this.buildResidueTypesCheckboxes(response.tipoResiduos);
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 404) {
          this.notificationService.error('Caminhão não encontrado.');
        } else if (err.status === 400 && apiResponse?.errors && typeof apiResponse.errors === 'object') {
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
          this.notificationService.error('Ocorreu um erro inesperado ao buscar os dados do caminhão.');
        }
        console.error('Erro detalhado:', err);
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

    if (this.isEditMode && this.id) {
      operation$ = this.truckService.updateTruck(this.id, truckData);
    } else {
      operation$ = this.truckService.createTruck(truckData);
    }

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response: TruckResponse) => {
        this.notificationService.success(`Caminhão ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        this.router.navigate(['/trucks']);
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 400 && apiResponse?.errors && typeof apiResponse.errors === 'object') {
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
