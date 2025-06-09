import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { RouteResponse } from '../../../core/models/route.model';
import { RouteService } from '../../../services/route.service';
import { NotificationService } from '../../../services/notification.service';
import { ApiResponse } from '../../../core/models/api-response.model';
// ATUALIZADO: Importar a interface Page
import { Page } from '../../../core/models/page.model';

@Component({
  selector: 'app-route-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './route-list.component.html',
  styleUrls: ['./route-list.component.scss']
})
export class RouteListComponent implements OnInit {
  private routeService = inject(RouteService);
  private notificationService = inject(NotificationService);

  // ATUALIZADO: O observable espera uma página de rotas
  routes$!: Observable<ApiResponse<Page<RouteResponse>>>;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadRoutes();
  }

  loadRoutes(): void {
    this.isLoading = true;
    this.hasError = false;
    this.routes$ = this.routeService.getAllRoutes().pipe(
      tap(response => {
        if (!response.success) {
          this.hasError = true;
          this.errorMessage = response.message || 'Falha ao carregar as rotas.';
        }
      }),
      catchError(error => {
        this.hasError = true;
        this.errorMessage = error.message || 'Ocorreu um erro inesperado.';
        // ATUALIZADO: O retorno do erro simula uma página vazia
        const emptyPage: Page<RouteResponse> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
        return of({ success: false, message: this.errorMessage, data: emptyPage });
      }),
      finalize(() => this.isLoading = false)
    );
  }

  
  deleteRoute(routeId: string | undefined): void {
    if (!routeId) return;
    const confirmDelete = confirm(`Are you sure you want to delete route ID: ${routeId}?`);
    if (confirmDelete) {
      this.isLoading = true;
      this.routeService.deleteRoute(routeId).subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('Route deleted!');
            this.loadRoutes();
          } else {
            this.notificationService.error(response.message || 'Failed to delete route.');
          }
        },
        error: (err) => this.notificationService.error('Error deleting route.', err.message),
        complete: () => this.isLoading = false
      });
    }
  }
}