import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CollectionPointRequest, CollectionPointResponse } from '../core/models/collection-point.model';
import { Page } from '../core/models/page.model';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class CollectionPointService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pontos-coleta`;

  getAllCollectionPoints(pageable?: { page?: number, size?: number, sort?: string }): Observable<Page<CollectionPointResponse>> {
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
    return this.http.get<Page<CollectionPointResponse>>(this.apiUrl, { params });
  }

  getCollectionPointById(id: number): Observable<CollectionPointResponse> {
    return this.http.get<CollectionPointResponse>(`${this.apiUrl}/${id}`);
  }

  createCollectionPoint(pointData: CollectionPointRequest): Observable<CollectionPointResponse> {
    return this.http.post<CollectionPointResponse>(this.apiUrl, pointData);
  }

  updateCollectionPoint(id: number, pointData: Partial<CollectionPointRequest>): Observable<CollectionPointResponse> {
    return this.http.put<CollectionPointResponse>(`${this.apiUrl}/${id}`, pointData);
  }

  deleteCollectionPoint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  findByTipoResiduo(tipoResiduo: string, pageable?: { page?: number, size?: number, sort?: string }): Observable<Page<CollectionPointResponse>> {
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
    return this.http.get<Page<CollectionPointResponse>>(`${this.apiUrl}/por-tipo/${tipoResiduo}`, { params });
  }

  findByBairro(bairro: string, pageable?: { page?: number, size?: number, sort?: string }): Observable<Page<CollectionPointResponse>> {
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
    return this.http.get<Page<CollectionPointResponse>>(`${this.apiUrl}/por-bairro/${bairro}`, { params });
  }
}
