// src/app/services/itinerary.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ItineraryRequest, ItineraryResponse } from '../core/models/itinerary.model';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ItineraryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/itinerarios`;

  // -> CORREÇÃO: Método renomeado para maior clareza
  getItinerariesByDate(date: string): Observable<ItineraryResponse[]> {
    return this.http.get<ItineraryResponse[]>(`${this.apiUrl}/data/${date}`);
  }

  // -> CORREÇÃO: ID é um número
  getItineraryById(id: number): Observable<ItineraryResponse> {
    return this.http.get<ItineraryResponse>(`${this.apiUrl}/${id}`);
  }

  createItinerary(itineraryData: ItineraryRequest): Observable<ItineraryResponse> {
    return this.http.post<ItineraryResponse>(this.apiUrl, itineraryData);
  }

  // -> CORREÇÃO: ID é um número
  updateItinerary(id: number, itineraryData: Partial<ItineraryRequest>): Observable<ItineraryResponse> {
    return this.http.put<ItineraryResponse>(`${this.apiUrl}/${id}`, itineraryData);
  }

  // -> CORREÇÃO: ID é um número
  deleteItinerary(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // -> Adicionado método que estava faltando
  concluirItinerario(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/concluir`, {});
  }

  // Métodos de listagem adicionais
  listarItinerariosPorCaminhao(caminhaoId: number): Observable<ItineraryResponse[]> {
    return this.http.get<ItineraryResponse[]>(`${this.apiUrl}/caminhao/${caminhaoId}`);
  }

  listarItinerariosPorPeriodo(inicio: string, fim: string): Observable<ItineraryResponse[]> {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<ItineraryResponse[]>(`${this.apiUrl}/periodo`, { params });
  }
}
