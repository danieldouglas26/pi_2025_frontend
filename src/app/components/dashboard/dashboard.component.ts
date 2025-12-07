import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { TruckService } from '../../services/truck.service';
import { CollectionPointService } from '../../services/collection-point.service';
import { RouteService } from '../../services/route.service';
import { ItineraryService } from '../../services/itinerary.service';
import { BairroService } from '../../services/bairro.service';
import { StreetService } from '../../services/street.service';
import { User } from '../../core/models/user.model';
import { Page } from '../../core/models/page.model';
import { GraphData, GraphNode, GraphEdge } from '../../core/models/graph.model';
import { TruckResponse } from '../../core/models/truck.model';
import { CollectionPointResponse } from '../../core/models/collection-point.model';
import { RouteResponse } from '../../core/models/route.model';
import { ItineraryResponse } from '../../core/models/itinerary.model';
import { NetworkGraphComponent } from '../shared/network-graph/network-graph.component';

interface DashboardSummary {
  totalTrucks: number;
  totalCollectionPoints: number;
  totalRoutes: number;
  totalItinerariesToday: number;
}

const EMPTY_PAGE: Page<any> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
const EMPTY_LIST: any[] = [];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NetworkGraphComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  truckService = inject(TruckService);
  collectionPointService = inject(CollectionPointService);
  routeService = inject(RouteService);
  itineraryService = inject(ItineraryService);
  bairroService = inject(BairroService);
  streetService = inject(StreetService);

  currentUser$: Observable<User | null> = this.authService.currentUser$;
  summaryData$!: Observable<DashboardSummary | null>;
  isLoadingSummary = false;
  summaryError: string | null = null;

  graphData$!: Observable<GraphData | null>;
  isLoadingGraph = false;
  graphError: string | null = null;

  ngOnInit(): void {
    this.loadSummaryData();
    this.loadGraphData();
  }

  loadSummaryData(): void {
    this.isLoadingSummary = true;
    this.summaryError = null;
    const today = new Date().toISOString().split('T')[0];

    this.summaryData$ = forkJoin({
      trucksResponse: this.truckService.getAllTrucks().pipe(catchError(() => of(EMPTY_PAGE as Page<TruckResponse>))),
      collectionPointsResponse: this.collectionPointService.getAllCollectionPoints().pipe(catchError(() => of(EMPTY_PAGE as Page<CollectionPointResponse>))),
      routesResponse: this.routeService.getAllRoutes().pipe(catchError(() => of(EMPTY_LIST as RouteResponse[]))),
      itinerariesResponse: this.itineraryService.getItinerariesByDate(today).pipe(catchError(() => of(EMPTY_LIST as ItineraryResponse[])))
    }).pipe(
      map(results => {
        return {
          totalTrucks: results.trucksResponse.totalElements,
          totalCollectionPoints: results.collectionPointsResponse.totalElements,
          totalRoutes: results.routesResponse.length,
          totalItinerariesToday: results.itinerariesResponse.length,
        };
      }),
      catchError(error => {
        this.summaryError = "Ocorreu um erro inesperado ao carregar o resumo.";
        console.error(this.summaryError, error);
        return of(null);
      }),
      finalize(() => this.isLoadingSummary = false)
    );
  }

  loadGraphData(): void {
    this.isLoadingGraph = true;
    this.graphError = null;
    const largePageSize = 1000;

    this.graphData$ = forkJoin({
      bairrosPage: this.bairroService.getAllBairros(0, largePageSize),
      ruasPage: this.streetService.getAllStreets(0, largePageSize)
    }).pipe(
      map(results => {
        const nodes: GraphNode[] = results.bairrosPage.content.map(bairro => ({
          id: String(bairro.id),
          label: bairro.nome
        }));

        const edges: GraphEdge[] = results.ruasPage.content.map(rua => ({
          id: `edge-${rua.id}`,
          source: String(rua.origemId),
          target: String(rua.destinoId),
          label: `${rua.distancia} km`
        }));

        return { nodes, edges };
      }),
      catchError(err => {
        this.graphError = "Não foi possível carregar o mapa de bairros.";
        console.error(err);
        return of(null);
      }),
      finalize(() => this.isLoadingGraph = false)
    );
  }
}
