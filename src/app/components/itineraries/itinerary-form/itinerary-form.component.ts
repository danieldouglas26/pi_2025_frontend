import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Models
import { ApiResponse } from '../../../core/models/api-response.model';
import { ItineraryRequest, ItineraryResponse } from '../../../core/models/itinerary.model';
import { RouteResponse } from '../../../core/models/route.model';
import { TruckResponse } from '../../../core/models/truck.model';

// Services
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
  editId: string | null = null;

  availableRoutes: RouteResponse[] = [];
  availableTrucks: TruckResponse[] = [];

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    const subQuery = this.activatedRoute.paramMap.subscribe(params => {
      this.editId = params.get('id');
      if (this.editId) {
        this.isEditMode = true;
        this.pageTitle = 'Editar Agendamento';
      }
    });
    this.subscriptions.add(subQuery);

    this.loadPrerequisites();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.itineraryForm = this.fb.group({
      routeId: [null, Validators.required],
      truckId: [null, Validators.required],
      collectionDate: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  loadPrerequisites(): void {
    this.isLoading = true;
    const sub = forkJoin({
      routes: this.routeService.getAllRoutes(),
      trucks: this.truckService.getAllTrucks()
    }).subscribe({
      next: (results) => {
        if (results.routes.success && results.routes.data) {
          this.availableRoutes = results.routes.data.content || [];
        } else {
           this.notificationService.error(results.routes.message || 'Falha ao carregar as rotas.');
        }
        if (results.trucks.success && results.trucks.data) {
          this.availableTrucks = results.trucks.data.content || [];
        } else {
           this.notificationService.error(results.trucks.message || 'Falha ao carregar os caminhões.');
        }
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

  loadItineraryData(id: string): void {
    // A flag isLoading já foi definida em loadPrerequisites
    const sub = this.itineraryService.getItineraryById(id).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.itineraryForm.patchValue(response.data);
        } else {
          this.notificationService.error(response.message || 'Falha ao carregar os dados do agendamento.');
          this.router.navigate(['/itineraries']);
        }
      },
      error: (err) => {
        this.notificationService.error('Erro ao buscar os dados do agendamento.', err.message);
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
    let operation$: Observable<ApiResponse<ItineraryResponse>>;

    if (this.isEditMode && this.editId) {
      operation$ = this.itineraryService.updateItinerary(this.editId, itineraryData);
    } else {
      operation$ = this.itineraryService.createItinerary(itineraryData);
    }

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(`Agendamento ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
          this.router.navigate(['/itineraries']);
        } else {
          this.notificationService.error(response.message || 'A operação falhou. Verifique se há conflitos.');
        }
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 400 && apiResponse.errors && typeof apiResponse.errors === 'object') {
          this.notificationService.error('Foram encontrados erros de validação.');
          Object.keys(apiResponse.errors).forEach(fieldName => {
            const control = this.itineraryForm.get(fieldName);
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
    this.router.navigate(['/itineraries']);
  }
}
