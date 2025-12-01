import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { CollectionPointResponse } from '../../../core/models/collection-point.model';
import { CollectionPointService } from '../../../services/collection-point.service';
import { NotificationService } from '../../../services/notification.service';
import { ApiResponse } from '../../../core/models/api-response.model';
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
      tap(page => {
      }),
      catchError(error => {
        this.hasError = true;
        this.errorMessage = error.message || 'Ocorreu um erro inesperado ao carregar os pontos de coleta.';
        const emptyPage: Page<CollectionPointResponse> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
        return of(emptyPage);
      }),
      finalize(() => this.isLoading = false)
    );
  }

  deleteCollectionPoint(pointId: number | undefined): void {
    if (typeof pointId !== 'number') {
      this.notificationService.error('ID do Ponto de Coleta inválido. Não é possível excluir.');
      return;
    }

    const confirmDelete = confirm(`Você tem certeza que deseja excluir este ponto de coleta (ID: ${pointId})?`);
    if (confirmDelete) {
      this.isLoading = true;
      this.collectionPointService.deleteCollectionPoint(pointId).subscribe({
        next: () => {
          this.notificationService.success('Ponto de coleta excluído com sucesso!');
          this.loadCollectionPoints();
        },
        error: (err: HttpErrorResponse) => {
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
