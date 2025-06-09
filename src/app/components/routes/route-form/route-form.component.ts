import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

// Models
import { ApiResponse } from '../../../core/models/api-response.model';
import { RouteRequest, RouteResponse } from '../../../core/models/route.model';
import { TruckResponse } from '../../../core/models/truck.model';
import { CollectionPointResponse } from '../../../core/models/collection-point.model';
import { Page } from '../../../core/models/page.model';

// Services
import { RouteService } from '../../../services/route.service';
import { NotificationService } from '../../../services/notification.service';
import { TruckService } from '../../../services/truck.service';
import { CollectionPointService } from '../../../services/collection-point.service';
import { HttpErrorResponse } from '@angular/common/http';

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

  routeForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Definir Nova Rota';

  availableTrucks: TruckResponse[] = [];
  availableCollectionPoints: CollectionPointResponse[] = [];
  currentRouteDetails?: RouteResponse;

  @Input() id?: string;

 
onSubmit(): void {
    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      this.notificationService.error('Por favor, corrija os erros no formulário.');
      return;
    }

    this.isLoading = true;

    const routeDataPayload: RouteRequest = {
      name: this.routeForm.value.name,
      truckId: this.routeForm.value.truckId,
      collectionPointIds: this.getSelectedCollectionPointIdsFromForm()
    };

    let operation$: Observable<ApiResponse<RouteResponse>>;

    if (this.isEditMode && this.id) {
      operation$ = this.routeService.updateRoute(this.id, routeDataPayload);
    } else {
      operation$ = this.routeService.createRoute(routeDataPayload);
    }

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(`Rota ${this.isEditMode ? 'atualizada' : 'definida'} com sucesso!`);
          this.router.navigate(['/routes']);
        } else {
          this.notificationService.error(response.message || 'A operação falhou.');
        }
      },
      // ATUALIZADO: Lógica de tratamento de erro aprimorada, igual à do formulário de caminhão.
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;

        // Cenário 1: Erro de validação com detalhes por campo (Status 400)
        if (err.status === 400 && apiResponse.errors && typeof apiResponse.errors === 'object') {
          this.notificationService.error('Foram encontrados erros de validação.');
          Object.keys(apiResponse.errors).forEach(fieldName => {
            const control = this.routeForm.get(fieldName);
            if (control) {
              control.setErrors({ serverError: (apiResponse.errors as any)[fieldName] });
            }
          });
        }
        // Cenário 2: Erros de negócio ou outros erros com uma mensagem clara
        else if (apiResponse?.message) {
          this.notificationService.error(apiResponse.message);
        }
        // Cenário 3: Fallback para erros inesperados
        else {
          this.notificationService.error('Ocorreu um erro inesperado na operação.');
        }
        console.error('Erro detalhado:', err);
      }
    });
    this.subscriptions.add(sub);
  }
  
  // Incluindo os outros métodos para que a classe fique completa
  constructor() { this.initializeForm(); }
  ngOnInit(): void {
    if (this.id) {
      this.isEditMode = true;
      this.pageTitle = 'Editar Rota';
    }
    this.loadPrerequisites();
  }
  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }
  private initializeForm(): void {
    this.routeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      truckId: [null, Validators.required],
      collectionPointIds: this.fb.array([], [Validators.required, Validators.minLength(2)])
    });
  }
  get collectionPointIdsArray(): FormArray { return this.routeForm.get('collectionPointIds') as FormArray; }
  private buildCollectionPointCheckboxes(selectedPointIds: string[] = []): void {
    this.collectionPointIdsArray.clear();
    this.availableCollectionPoints.forEach(point => {
      const isSelected = selectedPointIds.some(id => id === point.id);
      this.collectionPointIdsArray.push(this.fb.control(isSelected));
    });
  }
  private getSelectedCollectionPointIdsFromForm(): string[] {
    return this.routeForm.value.collectionPointIds
      .map((checked: boolean, i: number) => checked ? this.availableCollectionPoints[i].id : null)
      .filter((id: string | null): id is string => !!id);
  }
  loadPrerequisites(): void {
    this.isLoading = true;
    const sub = forkJoin({
      trucks: this.truckService.getAllTrucks(),
      collectionPoints: this.collectionPointService.getAllCollectionPoints()
    }).subscribe({
      next: (results) => {
        if (results.trucks.success && results.trucks.data) { this.availableTrucks = results.trucks.data.content; }
        else { this.notificationService.error(results.trucks.message || 'Falha ao carregar os caminhões.'); }
        if (results.collectionPoints.success && results.collectionPoints.data) {
          this.availableCollectionPoints = results.collectionPoints.data.content;
          if (this.isEditMode && this.id) { this.loadRouteData(this.id); }
          else { this.isLoading = false; this.buildCollectionPointCheckboxes(); }
        } else { this.notificationService.error(results.collectionPoints.message || 'Falha ao carregar os pontos de coleta.'); this.isLoading = false; }
      },
      error: (err) => { this.notificationService.error('Erro ao carregar dados para o formulário.', err.message); this.isLoading = false; }
    });
    this.subscriptions.add(sub);
  }
  loadRouteData(routeId: string): void {
    const sub = this.routeService.getRouteById(routeId).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const route = response.data;
          this.currentRouteDetails = route; this.routeForm.patchValue(route);
          const selectedIds = route.orderedPoints.map(p => p.id);
          this.buildCollectionPointCheckboxes(selectedIds);
        } else { this.notificationService.error(response.message || 'Falha ao carregar os dados da rota.'); this.router.navigate(['/routes']); }
      },
      error: (err) => { this.notificationService.error('Erro ao buscar os dados da rota.', err.message); this.router.navigate(['/routes']); }
    });
    this.subscriptions.add(sub);
  }
  cancel(): void { this.router.navigate(['/routes']); }
}