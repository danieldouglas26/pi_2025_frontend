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
// REMOVIDO: ApiResponse não é mais usado para as respostas de sucesso
// import { ApiResponse } from '../../core/models/api-response.model';
// A interface Page já está importada
import { Page } from '../../core/models/page.model';
import { TruckResponse } from '../../core/models/truck.model'; // Para tipar EMPTY_PAGE
import { CollectionPointResponse } from '../../core/models/collection-point.model'; // Para tipar EMPTY_PAGE
import { RouteResponse } from '../../core/models/route.model'; // Para tipar EMPTY_PAGE
import { ItineraryResponse } from '../../core/models/itinerary.model'; // Para tipar EMPTY_PAGE


// Interface para os dados do resumo do dashboard
interface DashboardSummary {
  totalTrucks: number;
  totalCollectionPoints: number;
  totalRoutes: number;
  totalItinerariesToday: number;
}

// ATUALIZADO: Objeto de fallback para paginação em caso de erro. Agora retorna o tipo Page<any> diretamente.
const EMPTY_PAGE: Page<any> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
// Para itinerários, que agora retorna List:
const EMPTY_LIST: any[] = [];

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
      // O catchError agora retorna o tipo de dado esperado (Page ou List)
      trucksResponse: this.truckService.getAllTrucks().pipe(
        catchError(err => {
          console.error('Erro ao carregar caminhões para o dashboard:', err);
          return of(EMPTY_PAGE as Page<TruckResponse>); // Retorna Page vazia
        })
      ),
      collectionPointsResponse: this.collectionPointService.getAllCollectionPoints().pipe(
        catchError(err => {
          console.error('Erro ao carregar pontos de coleta para o dashboard:', err);
          return of(EMPTY_PAGE as Page<CollectionPointResponse>); // Retorna Page vazia
        })
      ),
      routesResponse: this.routeService.getAllRoutes().pipe(
        catchError(err => {
          console.error('Erro ao carregar rotas para o dashboard:', err);
          return of(EMPTY_PAGE as Page<RouteResponse>); // Retorna Page vazia
        })
      ),
      // ItinerariesService retorna List<ItineraryResponse>
      itinerariesResponse: this.itineraryService.getAllItineraries({ date: today }).pipe(
        catchError(err => {
          console.error('Erro ao carregar itinerários de hoje para o dashboard:', err);
          return of(EMPTY_LIST as ItineraryResponse[]); // Retorna List vazia
        })
      )
    }).pipe(
      map(results => {
        this.isLoadingSummary = false;

        // Lógica para verificar se alguma das chamadas falhou individualmente
        // Agora baseada na *existência* de dados, não em 'success'
        const hasAnyError =
          !results.trucksResponse.content || // Se content for nulo ou undefined
          !results.collectionPointsResponse.content ||
          !results.routesResponse.content ||
          !results.itinerariesResponse; // Para listas, apenas verifica se é nulo/undefined/vazio

        if (hasAnyError) {
          this.summaryError = "Não foi possível carregar alguns dados do resumo.";
          // Você pode refinar as mensagens de erro aqui se quiser indicar qual falhou
        }

        // AGORA: Usar 'totalElements' da Page ou 'length' da List para obter os totais
        return {
          totalTrucks: results.trucksResponse.totalElements || 0,
          totalCollectionPoints: results.collectionPointsResponse.totalElements || 0,
          totalRoutes: results.routesResponse.totalElements || 0,
          totalItinerariesToday: results.itinerariesResponse.length || 0, // Para List, use .length
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
