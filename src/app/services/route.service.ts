import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Adicionado HttpParams
import { Observable } from 'rxjs';
// IMPORTANTE: Não precisamos mais de ApiResponse aqui, pois o controller retorna diretamente o DTO/List/Page
// import { ApiResponse } from '../core/models/api-response.model';
import { RouteRequest, RouteResponse } from '../core/models/route.model';
import { Page } from '../core/models/page.model';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class RouteService {
  private http = inject(HttpClient);
  // ALINHAR COM O MAPPING DO CONTROLLER: @RequestMapping("/api/rotas")
  private apiUrl = `${environment.apiUrl}/rotas`;

  /**
   * Este método assume que você adicionou um @GetMapping no RotaController
   * que retorna Page<RotaResponseDTO>. Se não, ajuste a tipagem para List<RouteResponse>
   * e adapte a chamada no componente de lista.
   */
  getAllRoutes(pageable?: { page?: number, size?: number, sort?: string }): Observable<Page<RouteResponse>> {
    let params = new HttpParams();
    if (pageable?.page != null) {
      params = params.set('page', pageable.page.toString());
    }
    if (pageable?.size != null) {
      params = params.set('size', pageable.size.toString());
    }
    if (pageable?.sort) {
      params = params.set('sort', pageable.sort);
    }
    // Assumindo que o @GetMapping("/") no RotaController agora retorna Page<RotaResponseDTO>
    return this.http.get<Page<RouteResponse>>(this.apiUrl, { params });
  }

  getRouteById(id: string): Observable<RouteResponse> {
    // Alinhado com @GetMapping("/{id}")
    return this.http.get<RouteResponse>(`${this.apiUrl}/${id}`);
  }

  createRoute(routeData: RouteRequest): Observable<RouteResponse> {
    // Alinhado com @PostMapping do controller
    return this.http.post<RouteResponse>(this.apiUrl, routeData);
  }

  updateRoute(id: string, routeData: Partial<RouteRequest>): Observable<RouteResponse> {
    // Alinhado com @PutMapping("/{id}")
    return this.http.put<RouteResponse>(`${this.apiUrl}/${id}`, routeData);
  }

  deleteRoute(id: string): Observable<void> { // Retorna 'void' para NoContent
    // Alinhado com @DeleteMapping("/{id}")
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarRotasPorCaminhao(caminhaoId: string): Observable<RouteResponse[]> {
    // Alinhado com @GetMapping("/caminhao/{caminhaoId}")
    return this.http.get<RouteResponse[]>(`${this.apiUrl}/caminhao/${caminhaoId}`);
  }

  recalcularRota(id: string): Observable<RouteResponse> {
    // Alinhado com @PostMapping("/{id}/recalcular")
    return this.http.post<RouteResponse>(`${this.apiUrl}/${id}/recalcular`, {});
  }
}
