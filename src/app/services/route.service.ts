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

  // -> CORREÇÃO: O ID é um número
  getRouteById(id: number): Observable<RouteResponse> {
    return this.http.get<RouteResponse>(`${this.apiUrl}/${id}`);
  }

  createRoute(routeData: RouteRequest): Observable<RouteResponse> {
    return this.http.post<RouteResponse>(this.apiUrl, routeData);
  }

  // -> CORREÇÃO: O ID é um número
  updateRoute(id: number, routeData: Partial<RouteRequest>): Observable<RouteResponse> {
    return this.http.put<RouteResponse>(`${this.apiUrl}/${id}`, routeData);
  }

  // -> CORREÇÃO: O ID é um número
  deleteRoute(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // -> CORREÇÃO: O ID é um número
  listarRotasPorCaminhao(caminhaoId: number): Observable<RouteResponse[]> {
    return this.http.get<RouteResponse[]>(`${this.apiUrl}/caminhao/${caminhaoId}`);
  }

  // -> CORREÇÃO: O ID é um número
  recalcularRota(id: number): Observable<RouteResponse> {
    return this.http.post<RouteResponse>(`${this.apiUrl}/${id}/recalcular`, {});
  }
}
