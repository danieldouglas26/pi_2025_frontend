import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { TruckResponse } from '../../../core/models/truck.model';
import { TruckService } from '../../../services/truck.service';
import { NotificationService } from '../../../services/notification.service';
import { ApiResponse } from '../../../core/models/api-response.model';
// ATUALIZADO: Importar a nova interface Page
import { Page } from '../../../core/models/page.model';

@Component({
  selector: 'app-truck-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './truck-list.component.html',
  styleUrls: ['./truck-list.component.scss']
})
export class TruckListComponent implements OnInit {
  private truckService = inject(TruckService);
  private notificationService = inject(NotificationService);

  // ATUALIZADO: O Observable agora espera uma Page<TruckResponse>
  trucks$: Observable<ApiResponse<Page<TruckResponse>>> | undefined;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadTrucks();
  }

    loadTrucks(): void {
    this.isLoading = true;
    this.hasError = false;
    this.trucks$ = this.truckService.getAllTrucks().pipe(
      tap(response => {
        // ADICIONE ESTA LINHA PARA DEBUGAR
        console.log('DADOS RECEBIDOS NO COMPONENTE:', response);
        
        if (!response.success) {
            this.hasError = true;
            this.errorMessage = response.message || 'Falha ao carregar os caminhões.';
        }
      }),
      catchError(error => {
        this.hasError = true;
        this.errorMessage = error.message || 'Ocorreu um erro inesperado.';
        // ATUALIZADO: O retorno do erro deve simular a estrutura de paginação vazia
        const emptyPage: Page<TruckResponse> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
        return of({ success: false, message: this.errorMessage, data: emptyPage });
      }),
      finalize(() => this.isLoading = false)
    );
  }

  deleteTruck(truckId: string | undefined): void {
    if (!truckId) {
        this.notificationService.error('Truck ID is undefined. Cannot delete.');
        return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete truck with ID: ${truckId}? This action cannot be undone.`);
    if (confirmDelete) {
      this.isLoading = true;
      this.truckService.deleteTruck(truckId).subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('Truck deleted successfully!');
            this.loadTrucks(); // Refresh the list
          } else {
            this.notificationService.error(response.message || 'Failed to delete truck.');
          }
        },
        error: (err) => {
          this.notificationService.error('An error occurred while deleting the truck.', err.message);
          console.error("Delete truck error:", err);
        },
        complete: () => this.isLoading = false
      });
    }
  }
}