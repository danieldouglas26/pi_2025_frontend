// src/app/components/bairros/bairro-list/bairro-list.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { BairroResponse } from '../../../core/models/bairro.model';
import { Page } from '../../../core/models/page.model';
import { BairroService } from '../../../services/bairro.service';
import { NotificationService } from '../../../services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-bairro-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bairro-list.component.html',
  styleUrls: ['./bairro-list.component.scss']
})
export class BairroListComponent implements OnInit {
  private bairroService = inject(BairroService);
  private notificationService = inject(NotificationService);

  public bairros$!: Observable<Page<BairroResponse>>;
  public isLoading = false;
  public isDeleting = false;
  public hasError = false;
  public errorMessage = '';

  private currentPage = 0;
  private pageSize = 100;

  ngOnInit(): void {
    this.loadBairros();
  }

  loadBairros(): void {
    this.isLoading = true;
    this.hasError = false;
    this.bairros$ = this.bairroService.getAllBairros(this.currentPage, this.pageSize).pipe(
      catchError((err) => {
        this.hasError = true;
        this.errorMessage = 'Falha ao carregar bairros.';
        console.error(err);
        const emptyPage: Page<BairroResponse> = { content: [], pageNumber: 0, pageSize: 0, totalElements: 0, totalPages: 0, last: true };
        return of(emptyPage);
      }),
      finalize(() => this.isLoading = false)
    );
  }

  deleteBairro(id: number | undefined): void {
    if (typeof id !== 'number') {
      this.notificationService.error("ID do Bairro inválido.");
      return;
    }

    const confirmDelete = confirm(`Você tem certeza que deseja excluir o bairro ID ${id}? Esta ação não pode ser desfeita.`);
    if (confirmDelete) {
      this.isDeleting = true;
      this.bairroService.deleteBairro(id).pipe(
        finalize(() => this.isDeleting = false)
      ).subscribe({
        next: () => {
          this.notificationService.success('Bairro excluído com sucesso!');
          this.loadBairros();
        },
        error: (err: HttpErrorResponse) => {
          const defaultError = 'Ocorreu um erro ao excluir o bairro.';
          const message = err.error?.message || err.message || defaultError;
          this.notificationService.error(message);
        }
      });
    }
  }
}
