// src/app/components/trucks/truck-list/truck-list.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { TruckResponse } from '../../../core/models/truck.model';
import { TruckService } from '../../../services/truck.service';
import { NotificationService } from '../../../services/notification.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Page } from '../../../core/models/page.model';
import { HttpErrorResponse } from '@angular/common/http';

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

  trucks$!: Observable<Page<TruckResponse>>;
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
      catchError(error => {
        this.hasError = true;
        this.errorMessage = error.message || 'Ocorreu um erro inesperado ao carregar os caminhões.';
        const emptyPage: Page<TruckResponse> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
        return of(emptyPage);
      }),
      finalize(() => this.isLoading = false)
    );
  }

  // -> CORREÇÃO: O ID é um número.
  deleteTruck(truckId: number | undefined): void {
    // -> CORREÇÃO: Melhorar a validação para o tipo 'number'.
    if (typeof truckId !== 'number') {
      this.notificationService.error('ID do Caminhão inválido. Não é possível excluir.');
      return;
    }

    const confirmDelete = confirm(`Você tem certeza que deseja excluir o caminhão (ID: ${truckId})? Esta ação não pode ser desfeita.`);
    if (confirmDelete) {
      this.isLoading = true;
      this.truckService.deleteTruck(truckId).subscribe({
        next: () => {
          this.notificationService.success('Caminhão excluído com sucesso!');
          this.loadTrucks(); // Recarrega a lista
        },
        error: (err: HttpErrorResponse) => {
          const apiResponse = err.error as ApiResponse<null>;
          if (apiResponse?.message) {
            this.notificationService.error(apiResponse.message);
          } else {
            this.notificationService.error('Ocorreu um erro ao excluir o caminhão.', err.message);
          }
          console.error("Erro ao excluir caminhão:", err);
        },
        complete: () => this.isLoading = false
      });
    }
  }
}
