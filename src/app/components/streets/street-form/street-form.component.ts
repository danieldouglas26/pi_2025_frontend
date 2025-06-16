import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { StreetService } from '../../../services/street.service';
import { BairroService } from '../../../services/bairro.service'; // -> CORREÇÃO: Usar BairroService
import { NotificationService } from '../../../services/notification.service';

// Models
import { StreetRequest, StreetResponse } from '../../../core/models/street.model';
import { BairroResponse } from '../../../core/models/bairro.model'; // -> CORREÇÃO: Usar BairroResponse
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
  private bairroService = inject(BairroService); // -> CORREÇÃO: Injetar BairroService
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private subscriptions = new Subscription();

  streetForm!: FormGroup;
  isEditMode = false;
  isLoading = true; // Inicia como true para cobrir o carregamento inicial
  pageTitle = 'Adicionar Nova Rua';

  availableBairros: BairroResponse[] = []; // -> CORREÇÃO: Usar um array de Bairros

  private streetId: number | null = null; // -> CORREÇÃO: ID é numérico

  ngOnInit(): void {
    this.initializeForm();
    this.loadPrerequisites(); // Carrega os bairros para os seletores

    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.pageTitle = 'Editar Rua';
      this.streetId = +idParam; // Converte para número
      this.loadStreetData(this.streetId);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.streetForm = this.fb.group({
      origemId: [null, Validators.required],
      destinoId: [null, Validators.required],
      distancia: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  private loadPrerequisites(): void {
    this.isLoading = true;
    // Para um dropdown, precisamos de todos os bairros, então pedimos uma página grande.
    const sub = this.bairroService.getAllBairros(0, 1000).pipe(
      finalize(() => {
        // Se não estivermos no modo de edição, podemos parar o loading aqui.
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
    // isLoading já deve ser true vindo do loadPrerequisites
    const sub = this.streetService.getStreetById(id).pipe(
      finalize(() => this.isLoading = false) // Finaliza o loading geral aqui
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
    if (this.streetForm.invalid) {
      this.streetForm.markAllAsTouched();
      this.notificationService.error('Por favor, corrija os erros no formulário.');
      return;
    }

    if (this.streetForm.value.origemId === this.streetForm.value.destinoId) {
        this.notificationService.error('A origem e o destino não podem ser o mesmo bairro.');
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
