import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Models
import { ApiResponse } from '../../../core/models/api-response.model';
import { RouteRequest, RouteResponse } from '../../../core/models/route.model';
import { TruckResponse } from '../../../core/models/truck.model';
import { BairroResponse } from '../../../core/models/bairro.model';
import { Page } from '../../../core/models/page.model';
import { ResidueType } from '../../../core/models/enums';

// Services
import { RouteService } from '../../../services/route.service';
import { TruckService } from '../../../services/truck.service';
import { BairroService } from '../../../services/bairro.service';
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
  private bairroService = inject(BairroService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private subscriptions = new Subscription();
  private activatedRoute = inject(ActivatedRoute);

  routeForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Definir Nova Rota';

  availableTrucks: TruckResponse[] = [];
  availableBairros: BairroResponse[] = [];
  readonly availableResidueTypes = Object.values(ResidueType);

  currentRouteDetails?: RouteResponse;

  @Input() id?: number;

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    const routeIdStr = this.activatedRoute.snapshot.paramMap.get('id');
    const routeId = routeIdStr ? +routeIdStr : null;

    if (routeId) {
      this.id = routeId;
      this.isEditMode = true;
      this.pageTitle = 'Editar Rota';
    } else {
      this.pageTitle = 'Definir Nova Rota';
    }
    this.loadPrerequisites();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.routeForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      caminhaoId: [null, Validators.required],
      origemBairroId: [null, Validators.required],
      destinoBairroId: [null, Validators.required],
      tipoResiduo: [null, Validators.required]
    });
  }

   loadPrerequisites(): void {
    this.isLoading = true;
    const sub = forkJoin({
      trucks: this.truckService.getAllTrucks(),
      // -> AJUSTE: Peça uma página grande para garantir que todos os bairros venham no dropdown.
      // O ideal é ter um endpoint específico para isso no backend.
      bairros: this.bairroService.getAllBairros(0, 1000)
    }).subscribe({
      next: (results) => {
        this.availableTrucks = results.trucks.content || [];
        // -> AJUSTE: Acesse a propriedade 'content' da página de bairros
        this.availableBairros = results.bairros.content || [];

        if (this.isEditMode && this.id) {
          this.loadRouteData(this.id);
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

  loadRouteData(routeId: number): void {
    const sub = this.routeService.getRouteById(routeId).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (route: RouteResponse) => {
        this.currentRouteDetails = route;
        this.routeForm.patchValue({
          nome: route.nome,
          caminhaoId: route.caminhaoId,
          origemBairroId: route.paradas?.[0]?.bairroId || null,
          destinoBairroId: route.paradas?.[route.paradas.length - 1]?.bairroId || null,
          tipoResiduo: route.tipoResiduo
        });
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.notificationService.error('Rota não encontrada.');
        } else {
          this.notificationService.error('Ocorreu um erro inesperado ao buscar os dados da rota.');
        }
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

    const formValue = this.routeForm.value;
    const routeDataPayload: RouteRequest = {
      nome: formValue.nome,
      caminhaoId: formValue.caminhaoId,
      origemId: formValue.origemBairroId,
      destinoId: formValue.destinoBairroId,
      tipoResiduo: formValue.tipoResiduo
    };

    let operation$: Observable<RouteResponse>;

    if (this.isEditMode && this.id) {
      operation$ = this.routeService.updateRoute(this.id, routeDataPayload);
    } else {
      operation$ = this.routeService.createRoute(routeDataPayload);
    }

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: () => {
        this.notificationService.success(`Rota ${this.isEditMode ? 'atualizada' : 'definida'} com sucesso!`);
        this.router.navigate(['/routes']);
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (apiResponse?.message) {
          this.notificationService.error(apiResponse.message);
        } else {
          this.notificationService.error('Ocorreu um erro inesperado na operação.');
        }
      }
    });
    this.subscriptions.add(sub);
  }

  cancel(): void {
    this.router.navigate(['/routes']);
  }
}
