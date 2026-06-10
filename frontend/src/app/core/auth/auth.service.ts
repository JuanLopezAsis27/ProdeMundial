import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  userId: string;
  username: string;
  token: string;
  isAdmin: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _user = signal<AuthUser | null>(this.loadUser());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.isAdmin === true);

  login(email: string, password: string) {
    return this.http.post<AuthUser>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(user => this.setUser(user))
    );
  }

  register(email: string, username: string, password: string) {
    return this.http.post<AuthUser>(`${environment.apiUrl}/auth/register`, { email, username, password }).pipe(
      tap(user => this.setUser(user))
    );
  }

  logout() {
    localStorage.removeItem('auth_user');
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string {
    return this._user()?.token ?? '';
  }

  private setUser(user: AuthUser) {
    localStorage.setItem('auth_user', JSON.stringify(user));
    this._user.set(user);
  }

  private loadUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
