// src/app/services/bairro.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BairroRequest, BairroResponse } from '../core/models/bairro.model';
import { Page } from '../core/models/page.model';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class BairroService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bairros`;

  /**
   * Busca bairros de forma paginada.
   * O backend retorna um objeto Page.
   */
  getAllBairros(page: number = 0, size: number = 10): Observable<Page<BairroResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<BairroResponse>>(this.apiUrl, { params });
  }

  getBairroById(id: number): Observable<BairroResponse> {
    return this.http.get<BairroResponse>(`${this.apiUrl}/${id}`);
  }

  createBairro(bairroData: BairroRequest): Observable<BairroResponse> {
    return this.http.post<BairroResponse>(this.apiUrl, bairroData);
  }

  updateBairro(id: number, bairroData: BairroRequest): Observable<BairroResponse> {
    return this.http.put<BairroResponse>(`${this.apiUrl}/${id}`, bairroData);
  }

  deleteBairro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
