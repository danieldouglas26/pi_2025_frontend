// src/app/components/itineraries/itinerary-planner/itinerary-planner.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ItineraryResponse } from '../../../core/models/itinerary.model';
import { ItineraryService } from '../../../services/itinerary.service';
import { NotificationService } from '../../../services/notification.service';
import { ApiResponse } from '../../../core/models/api-response.model';
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
    // -> CORREÇÃO: Chamando o método mais claro do serviço
    this.itineraries$ = this.itineraryService.getItinerariesByDate(this.selectedDate).pipe(
      catchError(error => {
        this.hasError = true;
        this.errorMessage = 'Ocorreu um erro ao carregar os roteiros.';
        console.error(error);
        return of([]);
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

  deleteItinerary(itineraryId: number | undefined): void { // -> CORREÇÃO: ID é um número
    if (typeof itineraryId !== 'number') {
      this.notificationService.error("ID do itinerário inválido.");
      return;
    }

    const confirmDelete = confirm(`Tem certeza que deseja excluir o agendamento ID: ${itineraryId}?`);
    if (confirmDelete) {
      // Usando uma flag separada para o botão de deletar
      const targetButton = event?.currentTarget as HTMLButtonElement;
      if(targetButton) targetButton.disabled = true;

      this.itineraryService.deleteItinerary(itineraryId).subscribe({
        next: () => {
          this.notificationService.success('Agendamento excluído com sucesso!');
          this.loadItineraries(); // Recarrega a lista
        },
        error: (err: HttpErrorResponse) => {
          const message = err.error?.message || 'Erro ao excluir o agendamento.';
          this.notificationService.error(message);
          if(targetButton) targetButton.disabled = false;
        },
      });
    }
  }
}
