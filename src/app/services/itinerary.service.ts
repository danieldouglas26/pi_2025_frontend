import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ItineraryRequest, ItineraryResponse } from '../core/models/itinerary.model';
import { ApiResponse } from '../core/models/api-response.model';
import { environment } from '../../environments/environment.development';
// ATUALIZADO: Importar a interface de paginação
import { Page } from '../core/models/page.model';

@Injectable({ providedIn: 'root' })
export class ItineraryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/itineraries`;

  // ATUALIZADO: O método de busca geral agora espera uma página de itinerários
  getAllItineraries(filters?: { date?: string, truckId?: string, routeId?: string }): Observable<ApiResponse<Page<ItineraryResponse>>> {
    let params = new HttpParams();
    if (filters?.date) {
      params = params.set('date', filters.date);
    }
    if (filters?.truckId) {
      params = params.set('truckId', filters.truckId);
    }
    if (filters?.routeId) {
      params = params.set('routeId', filters.routeId);
    }
    return this.http.get<ApiResponse<Page<ItineraryResponse>>>(this.apiUrl, { params });
  }

  // Métodos para itens únicos não mudam
  getItineraryById(id: string): Observable<ApiResponse<ItineraryResponse>> {
    return this.http.get<ApiResponse<ItineraryResponse>>(`${this.apiUrl}/${id}`);
  }

  createItinerary(itineraryData: ItineraryRequest): Observable<ApiResponse<ItineraryResponse>> {
    return this.http.post<ApiResponse<ItineraryResponse>>(this.apiUrl, itineraryData);
  }

  updateItinerary(id: string, itineraryData: Partial<ItineraryRequest>): Observable<ApiResponse<ItineraryResponse>> {
    return this.http.put<ApiResponse<ItineraryResponse>>(`${this.apiUrl}/${id}`, itineraryData);
  }

  deleteItinerary(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}