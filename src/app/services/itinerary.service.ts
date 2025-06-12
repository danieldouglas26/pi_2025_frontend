import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
// IMPORTANTE: Não precisamos mais de ApiResponse aqui, pois o controller retorna diretamente o DTO/List/Page
// import { ApiResponse } from '../core/models/api-response.model';
import { ItineraryRequest, ItineraryResponse } from '../core/models/itinerary.model';
import { Page } from '../core/models/page.model'; // Apenas se o backend passar a retornar Page

import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ItineraryService {
  private http = inject(HttpClient);
  // ALINHAR COM O MAPPING DO CONTROLLER: @RequestMapping("/api/itinerarios")
  private apiUrl = `${environment.apiUrl}/itinerarios`;

  // **REVISÃO IMPORTANTE AQUI:**
  // Se o endpoint GET /api/itinerarios do backend realmente retornar uma PAGE, mantenha a tipagem Page<ItineraryResponse>.
  // SE SEUS ENDPOINTS GET DO BACKEND RETORNAM List<ItinerarioResponseDTO>, então o frontend deve esperar List<ItineraryResponse>.
  // O seu controller atual não tem um @GetMapping que retorna Page<ItinerarioResponseDTO> para /api/itinerarios.
  // Se o backend continua retornando List para os filtros de data/caminhao/periodo, o frontend deve esperar List<ItineraryResponse>.
  // Vou deixar o `getAllItineraries` esperando uma `List` por padrão, pois seus controllers `listarPor...` retornam `List`.
  // Se você implementar um `getAllItineraries` paginado no backend, então a tipagem do frontend deve ser `Page<ItineraryResponse>`.

  /**
   * ATENÇÃO: Baseado no seu controller, este método não retorna Page, mas sim List.
   * Se você adicionar paginação no backend para `/api/itinerarios`, ajuste a tipagem para Observable<Page<ItineraryResponse>>
   */
  getAllItineraries(filters?: { date?: string, truckId?: string, routeId?: string }): Observable<ItineraryResponse[]> {
    let params = new HttpParams();
    if (filters?.date) {
      // Usando o endpoint /data/{data} se a data for o filtro principal
      return this.http.get<ItineraryResponse[]>(`${this.apiUrl}/data/${filters.date}`);
    }
    // Se não houver data, e você quer buscar TUDO, seu backend precisa de um @GetMapping sem parâmetros
    // ou um endpoint específico para "todos os itinerários".
    // Por enquanto, vou retornar uma lista vazia se não houver data e nenhum endpoint geral de lista.
    // CONSIDERE IMPLEMENTAR UM ENDPOINT DE BACKEND @GetMapping("/api/itinerarios") QUE RETORNE UMA LISTA OU PAGE.
    // Ex: return this.http.get<ItineraryResponse[]>(this.apiUrl, { params }); // Se o endpoint principal retornar List
    // Ou: return this.http.get<Page<ItineraryResponse>>(this.apiUrl, { params }); // Se o endpoint principal retornar Page
    // Por enquanto, vou retornar uma lista vazia ou chamar o endpoint de data com a data atual.
    // Para simplificar, vou fazer ele chamar o endpoint de data com a data atual se não for passada data nos filtros.
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<ItineraryResponse[]>(`${this.apiUrl}/data/${today}`);
  }


  getItineraryById(id: string): Observable<ItineraryResponse> {
    // Alinhado com @GetMapping("/{id}")
    return this.http.get<ItineraryResponse>(`${this.apiUrl}/${id}`);
  }

  createItinerary(itineraryData: ItineraryRequest): Observable<ItineraryResponse> {
    // Alinhado com @PostMapping do controller
    return this.http.post<ItineraryResponse>(this.apiUrl, itineraryData);
  }

  updateItinerary(id: string, itineraryData: Partial<ItineraryRequest>): Observable<ItineraryResponse> {
    // Alinhado com @PutMapping("/{id}")
    return this.http.put<ItineraryResponse>(`${this.apiUrl}/${id}`, itineraryData);
  }

  deleteItinerary(id: string): Observable<void> { // Retorna 'void' para NoContent
    // Alinhado com @DeleteMapping("/{id}")
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  concluirItinerario(id: string): Observable<void> {
    // Alinhado com @PutMapping("/{id}/concluir")
    return this.http.put<void>(`${this.apiUrl}/${id}/concluir`, {});
  }

  listarItinerariosPorCaminhao(caminhaoId: string): Observable<ItineraryResponse[]> {
    return this.http.get<ItineraryResponse[]>(`${this.apiUrl}/caminhao/${caminhaoId}`);
  }

  listarItinerariosPorData(data: string): Observable<ItineraryResponse[]> {
    // Use data diretamente, pois o backend espera LocalDate como string no path
    return this.http.get<ItineraryResponse[]>(`${this.apiUrl}/data/${data}`);
  }

  listarItinerariosPorPeriodo(inicio: string, fim: string): Observable<ItineraryResponse[]> {
    // Use HttpParams para as RequestParams
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fim', fim);
    return this.http.get<ItineraryResponse[]>(`${this.apiUrl}/periodo`, { params });
  }

  listarItinerariosAtrasados(): Observable<ItineraryResponse[]> {
    return this.http.get<ItineraryResponse[]>(`${this.apiUrl}/atrasados`);
  }
}
