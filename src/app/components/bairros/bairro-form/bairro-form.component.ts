import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { BairroRequest } from '../../../core/models/bairro.model';
import { BairroService } from '../../../services/bairro.service';
import { NotificationService } from '../../../services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-bairro-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bairro-form.component.html',
  styleUrls: ['./bairro-form.component.scss']
})
export class BairroFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bairroService = inject(BairroService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private activatedRoute = inject(ActivatedRoute);

  form!: FormGroup;
  isEditMode = false;
  isLoading = false;
  pageTitle = 'Adicionar Novo Bairro';
  private bairroId: number | null = null;

  ngOnInit(): void {
    this.initializeForm();
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.bairroId = +idParam;
      this.pageTitle = 'Editar Bairro';
      this.loadBairroData(this.bairroId);
    }
  }

  initializeForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  loadBairroData(id: number): void {
    this.isLoading = true;
    this.bairroService.getBairroById(id).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (bairro) => this.form.patchValue(bairro),
      error: () => {
        this.notificationService.error('Bairro não encontrado.');
        this.router.navigate(['/bairros']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error('Por favor, preencha o campo corretamente.');
      return;
    }
    this.isLoading = true;
    const bairroData: BairroRequest = this.form.value;
    const operation = this.isEditMode && this.bairroId
      ? this.bairroService.updateBairro(this.bairroId, bairroData)
      : this.bairroService.createBairro(bairroData);

    operation.pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.notificationService.success(`Bairro ${this.isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        this.router.navigate(['/bairros']);
      },
      error: (err: HttpErrorResponse) => {
        const message = err.error?.message || `Ocorreu um erro ao ${this.isEditMode ? 'atualizar' : 'criar'} o bairro.`;
        this.notificationService.error(message);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/bairros']);
  }
}
