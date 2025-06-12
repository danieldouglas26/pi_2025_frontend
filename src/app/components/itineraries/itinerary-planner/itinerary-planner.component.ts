import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ItineraryResponse } from '../../../core/models/itinerary.model';
import { ItineraryService } from '../../../services/itinerary.service';
import { NotificationService } from '../../../services/notification.service';
// IMPORTANTE: ApiResponse agora é usado apenas para tipar a resposta de ERRO
import { ApiResponse } from '../../../core/models/api-response.model';
// REMOVIDO: Page não é mais necessário aqui se getAllItineraries retorna List
// import { Page } from '../../../core/models/page.model';
import { HttpErrorResponse } from '@angular/common/http';


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

  // AGORA: O observable espera uma List<ItineraryResponse> DIRETAMENTE
  itineraries$!: Observable<ItineraryResponse[]>;
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
      // Não há mais 'response.success' ou 'response.message' aqui no tap para respostas de sucesso
      tap(list => {
        // console.log('Dados da lista de itinerários:', list);
      }),
      catchError(error => {
        this.hasError = true;
        this.errorMessage = error.message || 'Ocorreu um erro inesperado ao carregar os roteiros.';
        // Retorna uma lista vazia em caso de erro HTTP para manter a tipagem do Observable
        return of([]); // Retorna a lista vazia diretamente!
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
        // AGORA: não há mais response.success (delete retorna void)
        next: () => {
          this.notificationService.success('Agendamento excluído com sucesso!');
          this.loadItineraries(); // Recarrega a lista
        },
        error: (err: HttpErrorResponse) => { // Ainda pode haver erro HTTP com ApiResponse
          const apiResponse = err.error as ApiResponse<null>;
          if (apiResponse?.message) {
            this.notificationService.error(apiResponse.message);
          } else {
            this.notificationService.error('Erro ao excluir o agendamento.', err.message);
          }
          console.error("Erro ao excluir itinerário:", err);
        },
      });
    }
  }
}
