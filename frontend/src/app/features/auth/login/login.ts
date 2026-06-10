import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <span class="auth-brand-26">26</span>
          <span class="auth-brand-text">MUNDIAL</span>
        </div>
        <h2 class="auth-title">Iniciar Sesión</h2>
        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" [(ngModel)]="password" name="password" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>
        <div class="auth-footer">
          ¿No tenés cuenta? <a routerLink="/auth/registro">Registrarse</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-brand {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .auth-brand-26 {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 2.8rem;
      font-weight: 900;
      background: linear-gradient(135deg, #D4001A, #6B21D6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }
    .auth-brand-text {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.4rem;
      font-weight: 800;
      color: white;
      letter-spacing: .1em;
    }
  `]
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.error.set(err.error?.message ?? 'Email o contraseña incorrectos');
        this.loading.set(false);
      }
    });
  }
}
