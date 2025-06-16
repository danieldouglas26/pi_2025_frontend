import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RouteRequest, RouteResponse } from '../core/models/route.model';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/rotas`;


   getAllRoutes(): Observable<RouteResponse[]> {
    return this.http.get<RouteResponse[]>(this.apiUrl);
  }

  getRouteById(id: number): Observable<RouteResponse> {
    return this.http.get<RouteResponse>(`${this.apiUrl}/${id}`);
  }

  createRoute(routeData: RouteRequest): Observable<RouteResponse> {
    return this.http.post<RouteResponse>(this.apiUrl, routeData);
  }

  updateRoute(id: number, routeData: Partial<RouteRequest>): Observable<RouteResponse> {
    return this.http.put<RouteResponse>(`${this.apiUrl}/${id}`, routeData);
  }

  deleteRoute(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarRotasPorCaminhao(caminhaoId: number): Observable<RouteResponse[]> {
    return this.http.get<RouteResponse[]>(`${this.apiUrl}/caminhao/${caminhaoId}`);
  }

  recalcularRota(id: number): Observable<RouteResponse> {
    return this.http.post<RouteResponse>(`${this.apiUrl}/${id}/recalcular`, {});
  }
}
