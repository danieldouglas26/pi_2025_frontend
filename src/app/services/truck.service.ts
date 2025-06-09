// services/truck.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TruckRequest, TruckResponse } from '../core/models/truck.model';
import { ApiResponse } from '../core/models/api-response.model';
import { environment } from '../../environments/environment.development';
import { Page } from '../core/models/page.model';

@Injectable({ providedIn: 'root' })
export class TruckService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/trucks`;

  /**
   * Este método DEVE retornar o ApiResponse completo, para que o componente
   * possa verificar a propriedade 'success' e acessar 'data.content'.
   */
  getAllTrucks(): Observable<ApiResponse<Page<TruckResponse>>> {
    return this.http.get<ApiResponse<Page<TruckResponse>>>(this.apiUrl);
  }

  getTruckById(id: string): Observable<ApiResponse<TruckResponse>> {
    return this.http.get<ApiResponse<TruckResponse>>(`${this.apiUrl}/${id}`);
  }

  createTruck(truckData: TruckRequest): Observable<ApiResponse<TruckResponse>> {
    return this.http.post<ApiResponse<TruckResponse>>(this.apiUrl, truckData);
  }

  updateTruck(id: string, truckData: Partial<TruckRequest>): Observable<ApiResponse<TruckResponse>> {
    return this.http.put<ApiResponse<TruckResponse>>(`${this.apiUrl}/${id}`, truckData);
  }

  deleteTruck(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}