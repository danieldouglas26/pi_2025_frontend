import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Importe ActivatedRoute
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Models
import { ApiResponse } from '../../../core/models/api-response.model';
import { ItineraryRequest, ItineraryResponse } from '../../../core/models/itinerary.model';
import { RouteResponse } from '../../../core/models/route.model';
import { TruckResponse } from '../../../core/models/truck.model';
import { Page } from '../../../core/models/page.model';

// Services
import { ItineraryService } from '../../../services/itinerary.service';
import { NotificationService } from '../../../services/notification.service';
import { RouteService } from '../../../services/route.service';
import { TruckService } from '../../../services/truck.service';

// Objeto de fallback para paginação em caso de erro.
const EMPTY_PAGE: Page<any> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };

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
  private activatedRoute = inject(ActivatedRoute); // Injeção do ActivatedRoute
  private notificationService = inject(NotificationService);
  private subscriptions = new Subscription();

  itineraryForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Agendar Novo Roteiro';
  editId: string | null = null; // Mantenha, mas o valor será definido no ngOnInit via ActivatedRoute

  availableRoutes: RouteResponse[] = [];
  availableTrucks: TruckResponse[] = [];

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Agora, usamos ActivatedRoute para obter o ID da rota
    const routeId = this.activatedRoute.snapshot.paramMap.get('id');
    console.log('ID do itinerário (ActivatedRoute):', routeId); // Log para depuração

    if (routeId) { // Use routeId aqui
      this.editId = routeId; // Atribua ao editId
      this.isEditMode = true;
      this.pageTitle = 'Editar Agendamento';
      this.loadPrerequisites(); // loadPrerequisites já chamará loadItineraryData se for modo de edição
    } else {
      this.pageTitle = 'Agendar Novo Roteiro';
      this.loadPrerequisites(); // Também precisa carregar pré-requisitos para o modo de criação
    }
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
      routes: this.routeService.getAllRoutes().pipe(
        catchError(err => {
          this.notificationService.error('Erro ao carregar rotas: ' + (err.message || 'Erro desconhecido.'));
          return of(EMPTY_PAGE as Page<RouteResponse>);
        })
      ),
      trucks: this.truckService.getAllTrucks().pipe(
        catchError(err => {
          this.notificationService.error('Erro ao carregar caminhões: ' + (err.message || 'Erro desconhecido.'));
          return of(EMPTY_PAGE as Page<TruckResponse>);
        })
      )
    }).subscribe({
      next: (results) => {
        this.availableRoutes = results.routes.content || [];
        this.availableTrucks = results.trucks.content || [];

        // Se está no modo de edição e o ID foi obtido, carrega os dados do itinerário
        if (this.isEditMode && this.editId) {
          this.loadItineraryData(this.editId);
        } else {
          this.isLoading = false; // Finaliza o loading se for modo de criação
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
    const sub = this.itineraryService.getItineraryById(id).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response: ItineraryResponse) => {
        this.itineraryForm.patchValue({
          rotaId: response.rotaId,
          caminhaoId: response.caminhaoId,
          data: response.data // Já é string "yyyy-MM-dd"
        });
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 404) {
          this.notificationService.error('Agendamento não encontrado.');
        } else if (err.status === 400 && apiResponse?.errors && typeof apiResponse.errors === 'object') {
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
          this.notificationService.error('Ocorreu um erro inesperado ao buscar os dados do agendamento.');
        }
        console.error('Erro detalhado:', err);
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
      operation$ = this.itineraryService.createItinerary(itineraryData); // Chamada para 'createItinerario'
    }

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response: ItineraryResponse) => {
        this.notificationService.success(`Agendamento ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        this.router.navigate(['/itineraries']);
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 400 && apiResponse?.errors && typeof apiResponse.errors === 'object') {
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
