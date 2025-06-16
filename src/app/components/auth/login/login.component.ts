import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { LoginCredentials } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  loginForm: FormGroup;
  isLoading = false;
  returnUrl: string;

  constructor() {
    if (this.authService.isAuthenticated()) {
        this.router.navigate(['/dashboard']);
    }

    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.notificationService.error('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading = true;
    const credentials: LoginCredentials = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
                    this.router.navigateByUrl(this.returnUrl);
        } else {
          this.notificationService.error(response.message || 'Login failed. Please check your credentials.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        const errorMsg = err?.error?.message || err?.message || 'An unexpected error occurred during login.';
        this.notificationService.error(errorMsg);
        console.error("Login error:", err);
      }
    });
  }
}
