import { Injectable, inject, PLATFORM_ID } from '@angular/core'; // Import PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // Import isPlatformBrowser
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, tap } from 'rxjs'; // 'of' might be needed for SSR return
import { Router } from '@angular/router';
import { User, LoginCredentials } from '../core/models/user.model';
import { ApiResponse } from '../core/models/api-response.model';
import { environment } from '../../environments/environment.development';
// import { environment } from '../../../environments/environment'; // If you use environment for apiUrl

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID); // Inject PLATFORM_ID
  private apiUrlBase = environment.apiUrl;
  private apiUrl = `${this.apiUrlBase}/auth`;
  //private apiUrl = 'http://localhost:5001/api/auth'; // Replace with your actual backend URL or use environment.apiUrl + '/auth'
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor() {
    // Initialize currentUserSubject based on platform
    if (isPlatformBrowser(this.platformId)) {
      this.currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    } else {
      // On the server, initialize with null or a default non-authenticated user
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
    return null; // Not in browser, no localStorage
  }

  login(credentials: LoginCredentials): Observable<ApiResponse<{ token: string, user: User }>> {
    return this.http.post<ApiResponse<{ token: string, user: User }>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (isPlatformBrowser(this.platformId) && response.success && response.data) {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
        } else if (!response.success && isPlatformBrowser(this.platformId)) {
          // Handle login failure if needed, e.g., clear any partial session info
        }
        // If not in browser but login is somehow called, user subject won't update from storage
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    // Navigate only if in browser, or handle server-side navigation differently if needed
    if (isPlatformBrowser(this.platformId)) {
      this.router.navigate(['/login']);
    }
  }

  isAuthenticated(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('authToken');
      // Or more robustly, check token expiry if your token has an expiry
    }
    return false; // Not in browser, assume not authenticated for client-side checks
  }

  // Helper to safely get token, useful for interceptors if they also run on server
  public getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('authToken');
    }
    return null;
  }
}