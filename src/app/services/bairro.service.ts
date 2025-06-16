import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BairroRequest, BairroResponse } from '../core/models/bairro.model';
import { Page } from '../core/models/page.model'; // Certifique-se de que Page está corretamente definido
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class BairroService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bairros`;

  /**
   * Busca todos os bairros de forma paginada.
   * O backend retorna um objeto Page<BairroResponseDTO>.
   *
   * @param page O número da página (base 0). Padrão: 0.
   * @param size O tamanho da página. Padrão: 10.
   * @returns Um Observable que emite um objeto Page<BairroResponse>.
   */
 getAllBairros(page: number = 0, size: number = 100): Observable<Page<BairroResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'id,asc');

    return this.http.get<Page<BairroResponse>>(this.apiUrl, { params });
  }


  /**
   * Busca um bairro pelo seu ID.
   *
   * @param id O ID numérico do bairro.
   * @returns Um Observable que emite o objeto BairroResponse correspondente.
   */
  getBairroById(id: number): Observable<BairroResponse> {
    return this.http.get<BairroResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cria um novo bairro.
   *
   * @param bairroData Um objeto BairroRequest contendo os dados do novo bairro.
   * @returns Um Observable que emite o objeto BairroResponse do bairro criado.
   */
  createBairro(bairroData: BairroRequest): Observable<BairroResponse> {
    return this.http.post<BairroResponse>(this.apiUrl, bairroData);
  }

  /**
   * Atualiza um bairro existente.
   *
   * @param id O ID numérico do bairro a ser atualizado.
   * @param bairroData Um objeto BairroRequest contendo os dados atualizados do bairro.
   * @returns Um Observable que emite o objeto BairroResponse do bairro atualizado.
   */
  updateBairro(id: number, bairroData: BairroRequest): Observable<BairroResponse> {
    // Envia os dados atualizados do bairro no corpo da requisição PUT para o ID específico.
    return this.http.put<BairroResponse>(`${this.apiUrl}/${id}`, bairroData);
  }

  /**
   * Exclui um bairro pelo seu ID.
   *
   * @param id O ID numérico do bairro a ser excluído.
   * @returns Um Observable que emite 'void' (vazio) após a exclusão bem-sucedida (Status 204 No Content).
   */
  deleteBairro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
