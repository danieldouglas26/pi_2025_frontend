import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { CollectionPointResponse } from '../../../core/models/collection-point.model';
import { CollectionPointService } from '../../../services/collection-point.service';
import { NotificationService } from '../../../services/notification.service';
// IMPORTANTE: ApiResponse agora é usado apenas para tipar a resposta de ERRO, não o Observable principal
import { ApiResponse } from '../../../core/models/api-response.model';
// A interface Page já está importada
import { Page } from '../../../core/models/page.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-collection-point-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './collection-point-list.component.html',
  styleUrls: ['./collection-point-list.component.scss']
})
export class CollectionPointListComponent implements OnInit {
  private collectionPointService = inject(CollectionPointService);
  private notificationService = inject(NotificationService);

  // AGORA: O observable espera uma Page<CollectionPointResponse> DIRETAMENTE
  collectionPoints$!: Observable<Page<CollectionPointResponse>>;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadCollectionPoints();
  }

  loadCollectionPoints(): void {
    this.isLoading = true;
    this.hasError = false;
    this.collectionPoints$ = this.collectionPointService.getAllCollectionPoints().pipe(
      // Não há mais 'response.success' ou 'response.message' aqui no tap para respostas de sucesso
      tap(page => {
        // Você pode adicionar uma lógica aqui se a página estiver vazia ou para debug.
        // console.log('Dados da página de pontos de coleta:', page);
      }),
      catchError(error => {
        this.hasError = true;
        this.errorMessage = error.message || 'Ocorreu um erro inesperado ao carregar os pontos de coleta.';
        // Retorna uma Page vazia em caso de erro HTTP para manter a tipagem do Observable
        const emptyPage: Page<CollectionPointResponse> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
        return of(emptyPage); // Retorna a Page vazia diretamente!
      }),
      finalize(() => this.isLoading = false)
    );
  }

  deleteCollectionPoint(pointId: string | undefined): void {
    if (!pointId) {
      this.notificationService.error('ID do Ponto de Coleta inválido. Não é possível excluir.');
      return;
    }

    const confirmDelete = confirm(`Você tem certeza que deseja excluir este ponto de coleta (ID: ${pointId})?`);
    if (confirmDelete) {
      this.isLoading = true;
      this.collectionPointService.deleteCollectionPoint(pointId).subscribe({
        // AGORA: não há mais response.success
        next: () => { // Delete retorna void
          this.notificationService.success('Ponto de coleta excluído com sucesso!');
          this.loadCollectionPoints();
        },
        error: (err: HttpErrorResponse) => { // Ainda pode haver erro HTTP com ApiResponse
          const apiResponse = err.error as ApiResponse<null>;
          if (apiResponse?.message) {
            this.notificationService.error(apiResponse.message);
          } else {
            this.notificationService.error('Ocorreu um erro ao excluir o ponto de coleta.', err.message);
          }
          console.error("Erro ao excluir ponto de coleta:", err);
        },
        complete: () => this.isLoading = false
      });
    }
  }
}
