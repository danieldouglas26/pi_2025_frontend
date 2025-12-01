import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Models
import { RouteResponse } from '../../../core/models/route.model';
import { ApiResponse } from '../../../core/models/api-response.model';

// Services
import { RouteService } from '../../../services/route.service';
import { NotificationService } from '../../../services/notification.service';

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

  public routes$!: Observable<RouteResponse[]>;
  public isLoading = false;
  public hasError = false;
  public errorMessage = '';

  public isDeleting = false;

  ngOnInit(): void {
    this.loadRoutes();
  }

  loadRoutes(): void {
    this.isLoading = true;
    this.hasError = false;
    this.routes$ = this.routeService.getAllRoutes().pipe(
      catchError((error) => {
        this.hasError = true;
        this.errorMessage = 'Falha ao carregar as rotas. Tente novamente.';
        console.error(error);
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    );
  }

  deleteRoute(routeId: number | undefined): void {
    if (typeof routeId !== 'number') {
      this.notificationService.error("ID da Rota inválido.");
      return;
    }
    const confirmDelete = confirm(`Você tem certeza que deseja excluir a rota ID: ${routeId}?`);
    if (confirmDelete) {
      this.isDeleting = true;
      this.routeService.deleteRoute(routeId).pipe(
        finalize(() => this.isDeleting = false)
      ).subscribe({
        next: () => {
          this.notificationService.success('Rota excluída com sucesso!');
          this.loadRoutes();
        },
        error: (err: HttpErrorResponse) => {
          const apiResponse = err.error as ApiResponse<null>;
          if (apiResponse?.message) {
            this.notificationService.error(apiResponse.message);
          } else {
            this.notificationService.error('Erro ao excluir rota.', err.message);
          }
        }
      });
    }
  }
}
