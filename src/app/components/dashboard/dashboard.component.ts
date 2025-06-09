import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Services
import { AuthService } from '../../services/auth.service';
import { TruckService } from '../../services/truck.service';
import { CollectionPointService } from '../../services/collection-point.service';
import { RouteService } from '../../services/route.service';
import { ItineraryService } from '../../services/itinerary.service';

// Models
import { User } from '../../core/models/user.model';
import { ApiResponse } from '../../core/models/api-response.model';
// ATUALIZADO: Importar a interface de paginação
import { Page } from '../../core/models/page.model';

// Interface para os dados do resumo do dashboard
interface DashboardSummary {
  totalTrucks: number;
  totalCollectionPoints: number;
  totalRoutes: number;
  totalItinerariesToday: number;
}

// ATUALIZADO: Objeto de fallback para paginação em caso de erro
const EMPTY_PAGE: Page<any> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  truckService = inject(TruckService);
  collectionPointService = inject(CollectionPointService);
  routeService = inject(RouteService);
  itineraryService = inject(ItineraryService);

  currentUser$: Observable<User | null> = this.authService.currentUser$;
  summaryData$!: Observable<DashboardSummary | null>;
  isLoadingSummary = true;
  summaryError: string | null = null;

  constructor() {}

  ngOnInit(): void {
    this.isLoadingSummary = true;
    this.summaryError = null;
    const today = new Date().toISOString().split('T')[0];

    this.summaryData$ = forkJoin({
      // ATUALIZADO: O bloco catchError agora retorna um ApiResponse com uma Page vazia
      trucksResponse: this.truckService.getAllTrucks().pipe(
        catchError(err => of({ success: false, data: EMPTY_PAGE, message: 'Falha ao carregar caminhões' }))
      ),
      collectionPointsResponse: this.collectionPointService.getAllCollectionPoints().pipe(
        catchError(err => of({ success: false, data: EMPTY_PAGE, message: 'Falha ao carregar pontos de coleta' }))
      ),
      routesResponse: this.routeService.getAllRoutes().pipe(
        catchError(err => of({ success: false, data: EMPTY_PAGE, message: 'Falha ao carregar rotas' }))
      ),
      itinerariesResponse: this.itineraryService.getAllItineraries({ date: today }).pipe(
        catchError(err => of({ success: false, data: EMPTY_PAGE, message: 'Falha ao carregar itinerários de hoje' }))
      )
    }).pipe(
      map(results => {
        this.isLoadingSummary = false;
        
        // Opcional: Lógica para verificar se alguma das chamadas falhou individualmente
        const hasAnyError = !results.trucksResponse.success || !results.collectionPointsResponse.success || !results.routesResponse.success || !results.itinerariesResponse.success;
        if (hasAnyError) {
          this.summaryError = "Não foi possível carregar alguns dados do resumo.";
          console.error('Erros no dashboard:', {
              trucks: results.trucksResponse.message,
              points: results.collectionPointsResponse.message,
              routes: results.routesResponse.message,
              itineraries: results.itinerariesResponse.message
          });
        }

        // ATUALIZADO: Usar 'totalElements' da resposta paginada para obter os totais
        return {
          totalTrucks: results.trucksResponse.data?.totalElements || 0,
          totalCollectionPoints: results.collectionPointsResponse.data?.totalElements || 0,
          totalRoutes: results.routesResponse.data?.totalElements || 0,
          totalItinerariesToday: results.itinerariesResponse.data?.totalElements || 0,
        };
      }),
      catchError(error => {
        // Este catchError trata um erro fatal no próprio forkJoin (raro com os catchError internos)
        this.isLoadingSummary = false;
        this.summaryError = "Ocorreu um erro inesperado ao carregar o resumo do dashboard.";
        console.error(this.summaryError, error);
        return of(null);
      })
    );
  }
}