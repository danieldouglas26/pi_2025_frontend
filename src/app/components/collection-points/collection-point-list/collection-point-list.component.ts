import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { CollectionPointResponse } from '../../../core/models/collection-point.model';
import { CollectionPointService } from '../../../services/collection-point.service';
import { NotificationService } from '../../../services/notification.service';
import { ApiResponse } from '../../../core/models/api-response.model';
// Importar a interface Page é crucial
import { Page } from '../../../core/models/page.model';

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

  // ATUALIZADO: A tipagem do observable deve esperar uma Page, não um array.
  collectionPoints$!: Observable<ApiResponse<Page<CollectionPointResponse>>>;
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
      tap(response => {
        if (!response.success) {
          this.hasError = true;
          this.errorMessage = response.message || 'Falha ao carregar os pontos de coleta.';
        }
      }),
      catchError(error => {
        this.hasError = true;
        this.errorMessage = error.message || 'Ocorreu um erro inesperado.';
        // ATUALIZADO: O retorno do erro simula uma página vazia para corresponder ao tipo.
        const emptyPage: Page<CollectionPointResponse> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
        return of({ success: false, message: this.errorMessage, data: emptyPage });
      }),
      finalize(() => this.isLoading = false)
    );
  }

  // O método deleteCollectionPoint não precisa de alterações
  deleteCollectionPoint(pointId: string | undefined): void {
    if (!pointId) {
      this.notificationService.error('ID do Ponto de Coleta inválido. Não é possível excluir.');
      return;
    }

    const confirmDelete = confirm(`Você tem certeza que deseja excluir este ponto de coleta (ID: ${pointId})?`);
    if (confirmDelete) {
      this.isLoading = true;
      this.collectionPointService.deleteCollectionPoint(pointId).subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('Ponto de coleta excluído com sucesso!');
            this.loadCollectionPoints();
          } else {
            this.notificationService.error(response.message || 'Falha ao excluir o ponto de coleta.');
          }
        },
        error: (err) => {
          this.notificationService.error('Ocorreu um erro ao excluir o ponto de coleta.', err.message);
        },
        complete: () => this.isLoading = false
      });
    }
  }
}