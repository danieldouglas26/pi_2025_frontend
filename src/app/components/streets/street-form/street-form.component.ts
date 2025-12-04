import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { StreetService } from '../../../services/street.service';
import { BairroService } from '../../../services/bairro.service';
import { NotificationService } from '../../../services/notification.service';
import { StreetRequest, StreetResponse } from '../../../core/models/street.model';
import { BairroResponse } from '../../../core/models/bairro.model';
import { ApiResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-street-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './street-form.component.html',
  styleUrls: ['./street-form.component.scss']
})
export class StreetFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private streetService = inject(StreetService);
  private bairroService = inject(BairroService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private subscriptions = new Subscription();

  streetForm!: FormGroup;
  isEditMode = false;
  isLoading = true;
  pageTitle = 'Adicionar Nova Rua';


  isSubmitted = false;

  availableBairros: BairroResponse[] = [];

  private streetId: number | null = null;

  ngOnInit(): void {

    this.initializeForm();
    this.loadPrerequisites();

    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.pageTitle = 'Editar Rua';
      this.streetId = +idParam;
      this.loadStreetData(this.streetId);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  static originsAndDestinationsMustBeDifferent(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const origemIdControl = group.get('origemId');
      const destinoIdControl = group.get('destinoId');

      if (!origemIdControl || !destinoIdControl || origemIdControl.value === null || destinoIdControl.value === null) {

        return null;
      }

      if (origemIdControl.value === destinoIdControl.value) {

        return { sameOriginAndDestination: true };
      }

      return null;
    };
  }


  private initializeForm(): void {
    this.streetForm = this.fb.group({
      origemId: [null, Validators.required],
      destinoId: [null, Validators.required],
      distancia: [null, [Validators.required, Validators.min(0.01)]]
    }, {

      validators: StreetFormComponent.originsAndDestinationsMustBeDifferent()
    });
  }

  private loadPrerequisites(): void {
    this.isLoading = true;
    const sub = this.bairroService.getAllBairros(0, 1000).pipe(
      finalize(() => {
        if (!this.isEditMode) {
          this.isLoading = false;
        }
      })
    ).subscribe({
      next: (page) => {
        this.availableBairros = page.content || [];
      },
      error: (err) => {
        this.notificationService.error('Erro ao carregar bairros disponíveis.');
        console.error(err);
      }
    });
    this.subscriptions.add(sub);
  }

  private loadStreetData(id: number): void {
    const sub = this.streetService.getStreetById(id).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        this.streetForm.patchValue(response);
      },
      error: () => {
        this.notificationService.error('Rua não encontrada.');
        this.router.navigate(['/streets']);
      }
    });
    this.subscriptions.add(sub);
  }

  onSubmit(): void {

    this.isSubmitted = true;

    if (this.streetForm.invalid) {
      this.streetForm.markAllAsTouched();


      if (this.streetForm.errors?.['sameOriginAndDestination']) {
        this.notificationService.error('A origem e o destino não podem ser o mesmo bairro.');
      } else {
        this.notificationService.error('Por favor, corrija os erros no formulário.');
      }
      return;
    }

    this.isLoading = true;
    const streetData: StreetRequest = this.streetForm.value;
    const operation$ = (this.isEditMode && this.streetId)
      ? this.streetService.updateStreet(this.streetId, streetData)
      : this.streetService.createStreet(streetData);

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: () => {
        this.notificationService.success(`Rua ${this.isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
        this.router.navigate(['/streets']);
      },
      error: (err: HttpErrorResponse) => {
        const message = err.error?.message || `Ocorreu um erro ao ${this.isEditMode ? 'atualizar' : 'criar'} a rua.`;
        this.notificationService.error(message);
      }
    });
    this.subscriptions.add(sub);
  }

  cancel(): void {
    this.router.navigate(['/streets']);
  }
}
