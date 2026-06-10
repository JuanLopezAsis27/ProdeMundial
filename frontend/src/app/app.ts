import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { MatchHubService } from './core/signalr/match-hub.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (auth.isAuthenticated()) {
      <nav class="navbar">
        <a class="navbar-brand" routerLink="/home">
          <span class="logo-number">26</span>
          <span class="logo-text">MUNDIAL</span>
        </a>
        <div class="navbar-links">
          <a routerLink="/home" routerLinkActive="active">Inicio</a>
          <a routerLink="/mundial" routerLinkActive="active">Mundial</a>
          <a routerLink="/grupos" routerLinkActive="active">Grupos</a>
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active" class="admin-link">Admin</a>
          }
        </div>
        <button class="btn-logout" (click)="auth.logout()">Salir</button>
      </nav>
    }
    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      gap: 32px;
      padding: 0 28px;
      height: 64px;
      background: #0A0A0A;
      position: sticky;
      top: 0;
      z-index: 100;
      border-bottom: 2px solid #D4001A;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      flex-shrink: 0;
    }

    .logo-number {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 2rem;
      font-weight: 900;
      line-height: 1;
      background: linear-gradient(135deg, #D4001A 0%, #6B21D6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .logo-text {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: .12em;
      color: white;
      text-transform: uppercase;
    }

    .navbar-links {
      display: flex;
      gap: 4px;
      flex: 1;
    }

    .navbar-links a {
      color: rgba(255,255,255,.6);
      text-decoration: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: .9rem;
      font-weight: 600;
      letter-spacing: .04em;
      text-transform: uppercase;
      transition: color .15s, background .15s;
    }

    .navbar-links a:hover {
      color: white;
      background: rgba(255,255,255,.08);
    }

    .navbar-links a.active {
      color: #C5E000;
      background: rgba(197,224,0,.1);
    }

    .admin-link { color: rgba(212,0,26,.7) !important; }
    .admin-link:hover { color: #D4001A !important; }
    .admin-link.active { color: #D4001A !important; background: rgba(212,0,26,.1) !important; }

    .btn-logout {
      background: transparent;
      border: 1px solid rgba(255,255,255,.2);
      color: rgba(255,255,255,.6);
      padding: 6px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: .85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .04em;
      transition: border-color .15s, color .15s;
      flex-shrink: 0;
    }

    .btn-logout:hover {
      border-color: #D4001A;
      color: white;
    }

    .main-content {
      min-height: calc(100vh - 64px);
      background: #111118;
    }
  `]
})
export class App implements OnInit {
  readonly auth = inject(AuthService);
  private readonly hub = inject(MatchHubService);

  async ngOnInit() {
    if (this.auth.isAuthenticated()) {
      try { await this.hub.start(); } catch { /* SignalR not available yet */ }
    }
  }
}
