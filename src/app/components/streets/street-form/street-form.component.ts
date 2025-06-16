import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import { CommonModule, NgIf, NgFor, AsyncPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { finalize, catchError, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Services
import { StreetService } from '../../../services/street.service';
import { CollectionPointService } from '../../../services/collection-point.service'; // Para carregar os pontos de coleta
import { NotificationService } from '../../../services/notification.service';

// Models
import { StreetRequest, StreetResponse } from '../../../core/models/street.model';
import { CollectionPointResponse } from '../../../core/models/collection-point.model';
import { Page } from '../../../core/models/page.model';
import { ApiResponse } from '../../../core/models/api-response.model'; // Para tratamento de erro HTTP

// Objeto de fallback para paginação em caso de erro.
const EMPTY_PAGE: Page<any> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };

@Component({
  selector: 'app-street-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor], // Verifique os imports aqui
  templateUrl: './street-form.component.html',
  styleUrls: ['./street-form.component.scss']
})
export class StreetFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private streetService = inject(StreetService);
  private collectionPointService = inject(CollectionPointService); // Injeta o serviço de pontos de coleta
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private subscriptions = new Subscription();

  streetForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Adicionar Nova Rua';

  hasError = false;

  availableCollectionPoints: CollectionPointResponse[] = []; // Para os seletores de origem/destino

  @Input() id?: string;

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    const routeId = this.activatedRoute.snapshot.paramMap.get('id');
    console.log('ID da rua (ActivatedRoute):', routeId);

    // Carrega pontos de coleta antes de qualquer coisa, pois são pré-requisitos para o formulário
    this.loadPrerequisites().subscribe(() => {
      if (routeId) {
        this.id = routeId;
        this.isEditMode = true;
        this.pageTitle = 'Editar Rua';
        this.loadStreetData(this.id);
      } else {
        this.isLoading = false; // Finaliza o loading se for modo de criação
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.streetForm = this.fb.group({
      origemId: [null, Validators.required],
      destinoId: [null, Validators.required],
      distancia: [null, [Validators.required, Validators.min(0.01)]] // Distância deve ser positiva
    });
  }

  loadPrerequisites(): Observable<any> {
    this.isLoading = true;
    return this.collectionPointService.getAllCollectionPoints().pipe(
      tap(page => {
        this.availableCollectionPoints = page.content || [];
        if (this.availableCollectionPoints.length < 2) {
          this.notificationService.error('É necessário cadastrar pelo menos dois pontos de coleta para criar ruas.');
        }
      }),
      catchError(err => {
        this.notificationService.error('Erro ao carregar pontos de coleta para o formulário de rua: ' + (err.message || 'Desconhecido.'));
        this.hasError = true; // Set an error flag for the template
        return of(EMPTY_PAGE as Page<CollectionPointResponse>); // Return an empty page on error
      }),
      finalize(() => {
        // isLoading será false apenas após a inicialização ou a carga dos dados da rua
        if (!this.isEditMode || !this.id) { // Se não for modo de edição, ou se não houver ID (new)
          this.isLoading = false;
        }
      })
    );
  }

  loadStreetData(streetId: string): void {
    // isLoading já é true de loadPrerequisites
    const sub = this.streetService.getStreetById(streetId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response: StreetResponse) => {
        this.streetForm.patchValue({
          origemId: response.origemId,
          destinoId: response.destinoId,
          distancia: response.distancia
        });
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 404) {
          this.notificationService.error('Rua não encontrada.');
        } else if (err.status === 400 && apiResponse?.errors && typeof apiResponse.errors === 'object') {
          this.notificationService.error('Foram encontrados erros de validação.');
          Object.keys(apiResponse.errors).forEach(fieldName => {
            const control = this.streetForm.get(fieldName);
            if (control) {
              control.setErrors({ serverError: (apiResponse.errors as any)[fieldName] });
            }
          });
        } else if (apiResponse?.message) {
          this.notificationService.error(apiResponse.message);
        } else {
          this.notificationService.error('Ocorreu um erro inesperado ao buscar os dados da rua.');
        }
        console.error('Erro detalhado:', err);
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

    this.isLoading = true;

    const streetData: StreetRequest = this.streetForm.value;

    let operation$: Observable<StreetResponse>;

    if (this.isEditMode && this.id) {
      operation$ = this.streetService.updateStreet(this.id, streetData);
    } else {
      operation$ = this.streetService.createStreet(streetData);
    }

    const sub = operation$.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response: StreetResponse) => {
        this.notificationService.success(`Rua ${this.isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
        this.router.navigate(['/streets']);
      },
      error: (err: HttpErrorResponse) => {
        const apiResponse = err.error as ApiResponse<null>;
        if (err.status === 400 && apiResponse?.errors && typeof apiResponse.errors === 'object') {
          this.notificationService.error('Foram encontrados erros de validação.');
          Object.keys(apiResponse.errors).forEach(fieldName => {
            const control = this.streetForm.get(fieldName);
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
    this.router.navigate(['/streets']);
  }
}
