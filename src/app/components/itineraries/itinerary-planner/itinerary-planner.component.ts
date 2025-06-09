import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ItineraryResponse } from '../../../core/models/itinerary.model';
import { ItineraryService } from '../../../services/itinerary.service';
import { NotificationService } from '../../../services/notification.service';
import { ApiResponse } from '../../../core/models/api-response.model';
// ATUALIZADO: Importar a interface Page
import { Page } from '../../../core/models/page.model';

@Component({
  selector: 'app-itinerary-planner',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe],
  templateUrl: './itinerary-planner.component.html',
  styleUrls: ['./itinerary-planner.component.scss']
})
export class ItineraryPlannerComponent implements OnInit {
  private itineraryService = inject(ItineraryService);
  private notificationService = inject(NotificationService);

  selectedDate: string = new Date().toISOString().split('T')[0];
  
  // ATUALIZADO: O observable espera uma página de itinerários
  itineraries$!: Observable<ApiResponse<Page<ItineraryResponse>>>;
  isLoading = false;
  hasError = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadItineraries();
  }

  loadItineraries(): void {
    this.isLoading = true;
    this.hasError = false;
    this.itineraries$ = this.itineraryService.getAllItineraries({ date: this.selectedDate }).pipe(
      tap(response => {
        if (!response.success) {
          this.hasError = true;
          this.errorMessage = response.message || 'Falha ao carregar o agendamento.';
        }
      }),
      catchError(error => {
        this.hasError = true;
        this.errorMessage = error.message || 'Ocorreu um erro inesperado.';
        // ATUALIZADO: O retorno do erro simula uma página vazia
        const emptyPage: Page<ItineraryResponse> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
        return of({ success: false, message: this.errorMessage, data: emptyPage });
      }),
      finalize(() => this.isLoading = false)
    );
  }
 
  onDateChange(newDate: string): void {
    if (newDate) {
      this.selectedDate = newDate;
      this.loadItineraries();
    }
  }

  deleteItinerary(itineraryId: string | undefined): void {
    if (!itineraryId) {
      this.notificationService.error("ID do itinerário inválido.");
      return;
    }
    
    const confirmDelete = confirm(`Tem certeza que deseja excluir o agendamento ID: ${itineraryId}?`);
    if (confirmDelete) {
      this.isLoading = true;
      this.itineraryService.deleteItinerary(itineraryId).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('Agendamento excluído com sucesso!');
            this.loadItineraries(); // Recarrega a lista
          } else {
            this.notificationService.error(response.message || 'Falha ao excluir o agendamento.');
          }
        },
        error: (err) => this.notificationService.error('Erro ao excluir o agendamento.', err.message),
      });
    }
  }
}