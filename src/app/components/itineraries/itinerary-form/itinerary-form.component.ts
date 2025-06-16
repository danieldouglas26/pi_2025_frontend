// src/app/components/itineraries/itinerary-form/itinerary-form.component.ts

import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ItineraryRequest, ItineraryResponse } from '../../../core/models/itinerary.model';
import { RouteResponse } from '../../../core/models/route.model';
import { TruckResponse } from '../../../core/models/truck.model';
import { ItineraryService } from '../../../services/itinerary.service';
import { NotificationService } from '../../../services/notification.service';
import { RouteService } from '../../../services/route.service';
import { TruckService } from '../../../services/truck.service';

@Component({
  selector: 'app-itinerary-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './itinerary-form.component.html',
  styleUrls: ['./itinerary-form.component.scss']
})
export class ItineraryFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private itineraryService = inject(ItineraryService);
  private routeService = inject(RouteService);
  private truckService = inject(TruckService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private subscriptions = new Subscription();

  itineraryForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Agendar Novo Roteiro';
  editId: number | null = null; // -> CORREÇÃO: ID é um número

  availableRoutes: RouteResponse[] = [];
  availableTrucks: TruckResponse[] = [];

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam) {
      this.editId = +idParam; // -> CORREÇÃO: Converte para número
      this.isEditMode = true;
      this.pageTitle = 'Editar Agendamento';
    }
    this.loadPrerequisites();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.itineraryForm = this.fb.group({
      rotaId: [null, Validators.required],
      caminhaoId: [null, Validators.required],
      data: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  loadPrerequisites(): void {
    this.isLoading = true;
    const sub = forkJoin({
      routes: this.routeService.getAllRoutes(), // Retorna array
      trucks: this.truckService.getAllTrucks()  // Retorna Page
    }).subscribe({
      next: (results) => {
        // -> CORREÇÃO: Acessar os dados corretamente (array e page.content)
        this.availableRoutes = results.routes || [];
        this.availableTrucks = results.trucks.content || [];

        if (this.isEditMode && this.editId) {
          this.loadItineraryData(this.editId);
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.notificationService.error('Erro ao carregar dados para o formulário.', err.message);
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  loadItineraryData(id: number): void { // -> CORREÇÃO: ID é um número
    const sub = this.itineraryService.getItineraryById(id).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        this.itineraryForm.patchValue({
          rotaId: response.rotaId,
          caminhaoId: response.caminhaoId,
          data: response.data
        });
      },
      error: (err: HttpErrorResponse) => {
        this.notificationService.error('Agendamento não encontrado.');
        this.router.navigate(['/itineraries']);
      }
    });
    this.subscriptions.add(sub);
  }

  onSubmit(): void {
    if (this.itineraryForm.invalid) {
      this.itineraryForm.markAllAsTouched();
      this.notificationService.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    this.isLoading = true;
    const itineraryData: ItineraryRequest = this.itineraryForm.value;
    let operation$: Observable<ItineraryResponse>;

    if (this.isEditMode && this.editId) {
      operation$ = this.itineraryService.updateItinerary(this.editId, itineraryData);
    } else {
      operation$ = this.itineraryService.createItinerary(itineraryData);
    }

    operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: () => {
        this.notificationService.success(`Agendamento ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        this.router.navigate(['/itineraries']);
      },
      error: (err: HttpErrorResponse) => {
        const message = err.error?.message || `Ocorreu um erro ao ${this.isEditMode ? 'atualizar' : 'criar'} o agendamento.`;
        this.notificationService.error(message);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/itineraries']);
  }
}
