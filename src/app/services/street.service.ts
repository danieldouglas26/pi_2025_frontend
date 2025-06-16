import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StreetRequest, StreetResponse } from '../core/models/street.model';
import { Page } from '../core/models/page.model';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class StreetService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ruas`; // Nome da API é 'ruas'

  getAllStreets(page: number = 0, size: number = 10): Observable<Page<StreetResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Page<StreetResponse>>(this.apiUrl, { params });
  }

  // -> CORREÇÃO: ID é um número
  getStreetById(id: number): Observable<StreetResponse> {
    return this.http.get<StreetResponse>(`${this.apiUrl}/${id}`);
  }

  createStreet(streetData: StreetRequest): Observable<StreetResponse> {
    return this.http.post<StreetResponse>(this.apiUrl, streetData);
  }

  // -> CORREÇÃO: ID é um número
  updateStreet(id: number, streetData: Partial<StreetRequest>): Observable<StreetResponse> {
    return this.http.put<StreetResponse>(`${this.apiUrl}/${id}`, streetData);
  }

  // -> CORREÇÃO: ID é um número
  deleteStreet(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
