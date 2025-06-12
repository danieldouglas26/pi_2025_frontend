import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { RouteResponse } from '../../../core/models/route.model';
import { RouteService } from '../../../services/route.service';
import { NotificationService } from '../../../services/notification.service';
// IMPORTANTE: ApiResponse agora é usado apenas para tipar a resposta de ERRO
import { ApiResponse } from '../../../core/models/api-response.model';
// A interface Page já está importada
import { Page } from '../../../core/models/page.model';
import { HttpErrorResponse } from '@angular/common/http';


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

  // AGORA: O observable espera uma Page<RouteResponse> DIRETAMENTE
  routes$!: Observable<Page<RouteResponse>>;
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
      // Não há mais 'response.success' ou 'response.message' aqui no tap para respostas de sucesso
      tap(page => {
          console.log('DADOS COMPLETOS RECEBIDOS NO COMPONENTE - Página Rotas:', page);

        // console.log('Dados da página de rotas:', page);
      }),
      catchError(error => {
        this.hasError = true;
        this.errorMessage = error.message || 'Ocorreu um erro inesperado ao carregar as rotas.';
        // Retorna uma Page vazia em caso de erro HTTP para manter a tipagem do Observable
        const emptyPage: Page<RouteResponse> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
        return of(emptyPage); // Retorna a Page vazia diretamente!
      }),
      finalize(() => this.isLoading = false)
    );
  }

  deleteRoute(routeId: string | undefined): void {
    if (!routeId) {
      this.notificationService.error("ID da Rota inválido.");
      return;
    }
    const confirmDelete = confirm(`Você tem certeza que deseja excluir a rota ID: ${routeId}?`);
    if (confirmDelete) {
      this.isLoading = true;
      this.routeService.deleteRoute(routeId).subscribe({
        // AGORA: não há mais response.success (delete retorna void)
        next: () => {
          this.notificationService.success('Rota excluída!');
          this.loadRoutes();
        },
        error: (err: HttpErrorResponse) => { // Ainda pode haver erro HTTP com ApiResponse
          const apiResponse = err.error as ApiResponse<null>;
          if (apiResponse?.message) {
            this.notificationService.error(apiResponse.message);
          } else {
            this.notificationService.error('Erro ao excluir rota.', err.message);
          }
          console.error("Erro ao excluir rota:", err);
        },
        complete: () => this.isLoading = false
      });
    }
  }
}
