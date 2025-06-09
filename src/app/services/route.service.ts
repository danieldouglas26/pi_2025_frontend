import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RouteRequest, RouteResponse } from '../core/models/route.model';
import { ApiResponse } from '../core/models/api-response.model';
import { environment } from '../../environments/environment.development';
// ATUALIZADO: Importar a interface de paginação
import { Page } from '../core/models/page.model';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/routes`;

  // ATUALIZADO: O método de busca geral agora espera uma página de rotas
  getAllRoutes(): Observable<ApiResponse<Page<RouteResponse>>> {
    return this.http.get<ApiResponse<Page<RouteResponse>>>(this.apiUrl);
  }

  // Métodos para itens únicos não mudam
  getRouteById(id: string): Observable<ApiResponse<RouteResponse>> {
    return this.http.get<ApiResponse<RouteResponse>>(`${this.apiUrl}/${id}`);
  }

  createRoute(routeData: RouteRequest): Observable<ApiResponse<RouteResponse>> {
    return this.http.post<ApiResponse<RouteResponse>>(this.apiUrl, routeData);
  }

  updateRoute(id: string, routeData: Partial<RouteRequest>): Observable<ApiResponse<RouteResponse>> {
    return this.http.put<ApiResponse<RouteResponse>>(`${this.apiUrl}/${id}`, routeData);
  }

  deleteRoute(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}