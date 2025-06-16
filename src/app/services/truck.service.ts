// src/app/services/truck.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TruckRequest, TruckResponse } from '../core/models/truck.model';
import { Page } from '../core/models/page.model';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class TruckService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/caminhoes`;

  getAllTrucks(): Observable<Page<TruckResponse>> {
    return this.http.get<Page<TruckResponse>>(this.apiUrl);
  }

  // -> CORREÇÃO: O ID é um número.
  getTruckById(id: number): Observable<TruckResponse> {
    return this.http.get<TruckResponse>(`${this.apiUrl}/${id}`);
  }

  createTruck(truckData: TruckRequest): Observable<TruckResponse> {
    return this.http.post<TruckResponse>(this.apiUrl, truckData);
  }

  // -> CORREÇÃO: O ID é um número.
  updateTruck(id: number, truckData: Partial<TruckRequest>): Observable<TruckResponse> {
    return this.http.put<TruckResponse>(`${this.apiUrl}/${id}`, truckData);
  }

  // -> CORREÇÃO: O ID é um número.
  deleteTruck(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
