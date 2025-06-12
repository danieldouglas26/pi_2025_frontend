import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Importe ActivatedRoute
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Models
import { ApiResponse } from '../../../core/models/api-response.model';
import { RouteRequest, RouteResponse, ParadaRotaResponse } from '../../../core/models/route.model';
import { TruckResponse } from '../../../core/models/truck.model';
import { CollectionPointResponse } from '../../../core/models/collection-point.model';
import { Page } from '../../../core/models/page.model';
import { ResidueType } from '../../../core/models/enums';
import { RouteService } from '../../../services/route.service';
import { TruckService } from '../../../services/truck.service';
import { CollectionPointService } from '../../../services/collection-point.service';
import { NotificationService } from '../../../services/notification.service';

// Objeto de fallback para paginação em caso de erro.
const EMPTY_PAGE: Page<any> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './route-form.component.html',
  styleUrls: ['./route-form.component.scss']
})
export class RouteFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private routeService = inject(RouteService);
  private truckService = inject(TruckService);
  private collectionPointService = inject(CollectionPointService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private subscriptions = new Subscription();
  private activatedRoute = inject(ActivatedRoute); // Injeção do ActivatedRoute

  routeForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Definir Nova Rota';

  availableTrucks: TruckResponse[] = [];
  availableCollectionPoints: CollectionPointResponse[] = [];
  readonly availableResidueTypes = Object.values(ResidueType);

  currentRouteDetails?: RouteResponse;

  @Input() id?: string; // Mantemos o @Input por compatibilidade, mas o ActiveRoute é mais robusto aqui

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Agora, usamos ActivatedRoute para obter o ID da rota
    const routeId = this.activatedRoute.snapshot.paramMap.get('id');
    console.log('ID da rota (ActivatedRoute):', routeId); // Log para depuração

    if (routeId) { // Use routeId aqui
      this.id = routeId; // Atribua ao @Input id, se ainda o usar
      this.isEditMode = true;
      this.pageTitle = 'Editar Rota';
      this.loadPrerequisites(); // loadPrerequisites já chamará loadRouteData se for modo de edição
    } else {
      this.pageTitle = 'Definir Nova Rota';
      this.loadPrerequisites(); // Também precisa carregar pré-requisitos para o modo de criação
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.routeForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      caminhaoId: [null, Validators.required],
      origemId: [null, Validators.required],
      destinoId: [null, Validators.required],
      tipoResiduo: [null, Validators.required]
    });
  }

  loadPrerequisites(): void {
    this.isLoading = true;
    const sub = forkJoin({
      trucks: this.truckService.getAllTrucks().pipe(
        catchError(err => {
          this.notificationService.error('Erro ao carregar caminhões: ' + (err.message || 'Erro desconhecido.'));
          return of(EMPTY_PAGE as Page<TruckResponse>);
        })
      ),
      collectionPoints: this.collectionPointService.getAllCollectionPoints().pipe(
        catchError(err => {
          this.notificationService.error('Erro ao carregar pontos de coleta: ' + (err.message || 'Erro desconhecido.'));
          return of(EMPTY_PAGE as Page<CollectionPointResponse>);
        })
      )
    }).subscribe({
      next: (results) => {
        this.availableTrucks = results.trucks.content || [];
        this.availableCollectionPoints = results.collectionPoints.content || [];

        // Se está no modo de edição e o ID foi obtido, carrega os dados da rota
        if (this.isEditMode && this.id) {
          this.loadRouteData(this.id);
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

  loadRouteData(routeId: string): void {
    const sub = this.routeService.getRouteById(routeId).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response: RouteResponse) => {
        const route = response;
        this.currentRouteDetails = route;
        this.routeForm.patchValue({
          nome: route.nome,
          caminhaoId: route.caminhaoId,
          origemId: route.paradas?.[0]?.pontoId || null,
          destinoId: route.paradas?.[route.paradas.length - 1]?.pontoId || null,
          tipoResiduo: route.tipoResiduo
        });
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 404) {
          this.notificationService.error('Rota não encontrada.');
        } else if (err.status === 400 && apiResponse?.errors && typeof apiResponse.errors === 'object') {
          this.notificationService.error('Foram encontrados erros de validação.');
          Object.keys(apiResponse.errors).forEach(fieldName => {
            const control = this.routeForm.get(fieldName);
            if (control) {
              control.setErrors({ serverError: (apiResponse.errors as any)[fieldName] });
            }
          });
        } else if (apiResponse?.message) {
          this.notificationService.error(apiResponse.message);
        } else {
          this.notificationService.error('Ocorreu um erro inesperado ao buscar os dados da rota.');
        }
        console.error('Erro detalhado:', err);
        this.router.navigate(['/routes']);
      }
    });
    this.subscriptions.add(sub);
  }

  onSubmit(): void {
    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      this.notificationService.error('Por favor, corrija os erros no formulário.');
      return;
    }

    this.isLoading = true;

    const routeDataPayload: RouteRequest = {
      nome: this.routeForm.value.nome,
      caminhaoId: this.routeForm.value.caminhaoId,
      origemId: this.routeForm.value.origemId,
      destinoId: this.routeForm.value.destinoId,
      tipoResiduo: this.routeForm.value.tipoResiduo
    };

    let operation$: Observable<RouteResponse>;

    if (this.isEditMode && this.id) {
      operation$ = this.routeService.updateRoute(this.id, routeDataPayload);
    } else {
      operation$ = this.routeService.createRoute(routeDataPayload);
    }

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response: RouteResponse) => {
        this.notificationService.success(`Rota ${this.isEditMode ? 'atualizada' : 'definida'} com sucesso!`);
        this.router.navigate(['/routes']);
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;

        if (err.status === 400 && apiResponse?.errors && typeof apiResponse.errors === 'object') {
          this.notificationService.error('Foram encontrados erros de validação.');
          Object.keys(apiResponse.errors).forEach(fieldName => {
            const control = this.routeForm.get(fieldName);
            if (control) {
              control.setErrors({ serverError: (apiResponse.errors as any)[fieldName] });
            }
          });
        }
        else if (apiResponse?.message) {
          this.notificationService.error(apiResponse.message);
        }
        else {
          this.notificationService.error('Ocorreu um erro inesperado na operação.');
        }
        console.error('Erro detalhado:', err);
      }
    });
    this.subscriptions.add(sub);
  }

  cancel(): void {
    this.router.navigate(['/routes']);
  }
}
