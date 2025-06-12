import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StreetRequest, StreetResponse } from '../core/models/street.model'; // Suas interfaces para Rua
import { Page } from '../core/models/page.model'; // Para paginação
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class StreetService {
  private http = inject(HttpClient);
  // ALINHAR COM O MAPPING DO CONTROLLER: @RequestMapping("/api/ruas")
  private apiUrl = `${environment.apiUrl}/ruas`;

  getAllStreets(pageable?: { page?: number, size?: number, sort?: string }): Observable<Page<StreetResponse>> {
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
    // Alinhado com @GetMapping do controller
    return this.http.get<Page<StreetResponse>>(this.apiUrl, { params });
  }

  getStreetById(id: string): Observable<StreetResponse> {
    // Alinhado com @GetMapping("/{id}")
    return this.http.get<StreetResponse>(`${this.apiUrl}/${id}`);
  }

  createStreet(streetData: StreetRequest): Observable<StreetResponse> {
    // Alinhado com @PostMapping do controller
    return this.http.post<StreetResponse>(this.apiUrl, streetData);
  }

  updateStreet(id: string, streetData: Partial<StreetRequest>): Observable<StreetResponse> {
    // Alinhado com @PutMapping("/{id}")
    return this.http.put<StreetResponse>(`${this.apiUrl}/${id}`, streetData);
  }

  deleteStreet(id: string): Observable<void> { // Retorna 'void' para NoContent
    // Alinhado com @DeleteMapping("/{id}")
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarPorOrigem(pontoColetaId: string): Observable<StreetResponse[]> {
    // Alinhado com @GetMapping("/origem/{pontoColetaId}")
    return this.http.get<StreetResponse[]>(`${this.apiUrl}/origem/${pontoColetaId}`);
  }

  listarPorDestino(pontoColetaId: string): Observable<StreetResponse[]> {
    // Alinhado com @GetMapping("/destino/{pontoColetaId}")
    return this.http.get<StreetResponse[]>(`${this.apiUrl}/destino/${pontoColetaId}`);
  }

  listarConexoes(pontoColetaId: string): Observable<StreetResponse[]> {
    // Alinhado com @GetMapping("/conexoes/{pontoColetaId}")
    return this.http.get<StreetResponse[]>(`${this.apiUrl}/conexoes/${pontoColetaId}`);
  }
}
