import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// IMPORTANTE: Não precisamos mais de ApiResponse aqui, pois o controller retorna diretamente o DTO/Page
// import { ApiResponse } from '../core/models/api-response.model';
import { TruckRequest, TruckResponse } from '../core/models/truck.model';
import { Page } from '../core/models/page.model';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class TruckService {
  private http = inject(HttpClient);
  // ALINHAR COM O MAPPING DO CONTROLLER: @RequestMapping("/api/caminhoes")
  private apiUrl = `${environment.apiUrl}/caminhoes`;

  /**
   * Este método agora espera DIRETAMENTE um Page<TruckResponse> como corpo da resposta.
   * O controller retorna ResponseEntity<Page<CaminhaoResponseDTO>>.
   */
  getAllTrucks(): Observable<Page<TruckResponse>> {
    // Alinhado com @GetMapping do controller
    return this.http.get<Page<TruckResponse>>(this.apiUrl);
  }

  getTruckById(id: string): Observable<TruckResponse> {
    // Alinhado com @GetMapping("/{id}")
    return this.http.get<TruckResponse>(`${this.apiUrl}/${id}`);
  }

  createTruck(truckData: TruckRequest): Observable<TruckResponse> {
    // Alinhado com @PostMapping do controller
    return this.http.post<TruckResponse>(this.apiUrl, truckData);
  }

  updateTruck(id: string, truckData: Partial<TruckRequest>): Observable<TruckResponse> {
    // Alinhado com @PutMapping("/{id}")
    return this.http.put<TruckResponse>(`${this.apiUrl}/${id}`, truckData);
  }

  deleteTruck(id: string): Observable<void> { // Retorna 'void' para NoContent ou sucesso sem corpo
    // Alinhado com @DeleteMapping("/{id}")
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
