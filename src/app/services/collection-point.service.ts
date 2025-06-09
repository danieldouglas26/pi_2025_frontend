import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CollectionPointRequest, CollectionPointResponse } from '../core/models/collection-point.model';
import { ApiResponse } from '../core/models/api-response.model';
import { environment } from '../../environments/environment.development';
// ATUALIZADO: Importar a interface de paginação
import { Page } from '../core/models/page.model';

@Injectable({ providedIn: 'root' })
export class CollectionPointService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/collection-points`;

  // ATUALIZADO: O método de busca geral agora espera uma página de pontos de coleta
  getAllCollectionPoints(): Observable<ApiResponse<Page<CollectionPointResponse>>> {
    return this.http.get<ApiResponse<Page<CollectionPointResponse>>>(this.apiUrl);
  }

  // Métodos para itens únicos não mudam
  getCollectionPointById(id: string): Observable<ApiResponse<CollectionPointResponse>> {
    return this.http.get<ApiResponse<CollectionPointResponse>>(`${this.apiUrl}/${id}`);
  }

  createCollectionPoint(pointData: CollectionPointRequest): Observable<ApiResponse<CollectionPointResponse>> {
    return this.http.post<ApiResponse<CollectionPointResponse>>(this.apiUrl, pointData);
  }

  updateCollectionPoint(id: string, pointData: Partial<CollectionPointRequest>): Observable<ApiResponse<CollectionPointResponse>> {
    return this.http.put<ApiResponse<CollectionPointResponse>>(`${this.apiUrl}/${id}`, pointData);
  }

  deleteCollectionPoint(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}