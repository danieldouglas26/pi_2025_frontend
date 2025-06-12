import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Adicionado HttpParams para filtros
import { Observable } from 'rxjs';
// IMPORTANTE: Não precisamos mais de ApiResponse aqui, pois o controller retorna diretamente o DTO/Page
// import { ApiResponse } from '../core/models/api-response.model';
import { CollectionPointRequest, CollectionPointResponse } from '../core/models/collection-point.model';
import { Page } from '../core/models/page.model';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class CollectionPointService {
  private http = inject(HttpClient);
  // ALINHAR COM O MAPPING DO CONTROLLER: @RequestMapping("/api/pontos-coleta")
  private apiUrl = `${environment.apiUrl}/pontos-coleta`;

  /**
   * Este método agora espera DIRETAMENTE um Page<CollectionPointResponse> como corpo da resposta.
   * O controller retorna ResponseEntity<Page<PontoColetaResponseDTO>>.
   */
  getAllCollectionPoints(pageable?: { page?: number, size?: number, sort?: string }): Observable<Page<CollectionPointResponse>> {
    // Ajustado para receber parâmetros de paginação/ordenação
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
    return this.http.get<Page<CollectionPointResponse>>(this.apiUrl, { params });
  }

  getCollectionPointById(id: string): Observable<CollectionPointResponse> {
    // Alinhado com @GetMapping("/{id}")
    return this.http.get<CollectionPointResponse>(`${this.apiUrl}/${id}`);
  }

  createCollectionPoint(pointData: CollectionPointRequest): Observable<CollectionPointResponse> {
    // Alinhado com @PostMapping do controller
    return this.http.post<CollectionPointResponse>(this.apiUrl, pointData);
  }

  updateCollectionPoint(id: string, pointData: Partial<CollectionPointRequest>): Observable<CollectionPointResponse> {
    // Alinhado com @PutMapping("/{id}")
    return this.http.put<CollectionPointResponse>(`${this.apiUrl}/${id}`, pointData);
  }

  deleteCollectionPoint(id: string): Observable<void> { // Retorna 'void' para NoContent
    // Alinhado com @DeleteMapping("/{id}")
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Novos métodos para os endpoints adicionais
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
