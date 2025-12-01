import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor, AsyncPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { StreetService } from '../../../services/street.service';
import { NotificationService } from '../../../services/notification.service';
import { StreetResponse } from '../../../core/models/street.model';
import { Page } from '../../../core/models/page.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-street-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf, NgFor, AsyncPipe],
  templateUrl: './street-list.component.html',
  styleUrls: ['./street-list.component.scss']
})
export class StreetListComponent implements OnInit {
  private streetService = inject(StreetService);
  private notificationService = inject(NotificationService);

  streets$!: Observable<Page<StreetResponse>>;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadStreets();
  }

  loadStreets(): void {
    this.isLoading = true;
    this.hasError = false;
    this.streets$ = this.streetService.getAllStreets().pipe(
      tap(page => {
        console.log('DADOS COMPLETOS RECEBIDOS NO COMPONENTE - Página Ruas:', page);
        if (page && page.content) {
          page.content.forEach(street => {
            console.log(`Rua: Origem=${street.origemNome}, Destino=${street.destinoNome}, Distância=${street.distancia}, ID=${street.id}`);
          });
        }
      }),
      catchError(error => {
        this.hasError = true;
        this.errorMessage = error.message || 'Ocorreu um erro inesperado ao carregar as ruas.';
        const emptyPage: Page<StreetResponse> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
        return of(emptyPage);
      }),
      finalize(() => this.isLoading = false)
    );
  }

  deleteStreet(streetId: number | undefined): void {
    if (typeof streetId !== 'number') {
      this.notificationService.error("ID da Rua inválido. Não é possível excluir.");
      return;
    }

    const confirmDelete = confirm(`Você tem certeza que deseja excluir a rua (ID: ${streetId})? Esta ação não pode ser desfeita.`);
    if (confirmDelete) {
      this.isLoading = true;
      this.streetService.deleteStreet(streetId).subscribe({
        next: () => {
          this.notificationService.success('Rua excluída com sucesso!');
          this.loadStreets();
        },
        error: (err: HttpErrorResponse) => {
          const apiResponse = err.error as ApiResponse<null>;
          if (apiResponse?.message) {
            this.notificationService.error(apiResponse.message);
          } else {
            this.notificationService.error('Ocorreu um erro ao excluir a rua.', err.message);
          }
          console.error("Erro ao excluir rua:", err);
        },
        complete: () => this.isLoading = false
      });
    }
  }
}
