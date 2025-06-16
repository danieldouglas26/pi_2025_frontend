import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginCredentials } from '../core/models/user.model';
import { ApiResponse } from '../core/models/api-response.model';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private apiUrlBase = environment.apiUrl;
  private apiUrl = `${this.apiUrlBase}/auth`;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    } else {
      this.currentUserSubject = new BehaviorSubject<User | null>(null);
    }
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private getUserFromStorage(): User | null {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  login(credentials: LoginCredentials): Observable<ApiResponse<{ token: string, user: User }>> {
    return this.http.post<ApiResponse<{ token: string, user: User }>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (isPlatformBrowser(this.platformId) && response.success && response.data) {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
        } else if (!response.success && isPlatformBrowser(this.platformId)) {
        }
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      this.router.navigate(['/login']);
    }
  }

  isAuthenticated(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('authToken');
    }
    return false;
  }

  public getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('authToken');
    }
    return null;
  }
}
