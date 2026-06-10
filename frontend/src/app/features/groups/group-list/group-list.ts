import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api/api.service';
import { Group } from '../../../core/models/group.model';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Mis Grupos</h1>

      <div class="actions-row">
        <div class="action-card">
          <h3>Crear Grupo</h3>
          <p class="action-desc">Invita a tus amigos con el codigo unico.</p>
          <div class="input-row">
            <input
              type="text"
              [(ngModel)]="newGroupName"
              placeholder="Nombre del grupo"
              maxlength="40"
              (keydown.enter)="createGroup()"
            />
            <button (click)="createGroup()" [disabled]="!newGroupName.trim() || creating()">
              {{ creating() ? '...' : 'Crear' }}
            </button>
          </div>
        </div>

        <div class="action-card">
          <h3>Unirse a Grupo</h3>
          <p class="action-desc">Ingresa el codigo de 6 letras.</p>
          <div class="input-row">
            <input
              type="text"
              [(ngModel)]="joinCode"
              placeholder="CODIGO"
              maxlength="6"
              style="text-transform:uppercase"
              (keydown.enter)="joinGroup()"
            />
            <button (click)="joinGroup()" [disabled]="joinCode.trim().length < 3 || joining()">
              {{ joining() ? '...' : 'Unirse' }}
            </button>
          </div>
        </div>
      </div>

      @if (successMsg()) {
        <div class="alert alert-success">{{ successMsg() }}</div>
      }
      @if (errorMsg()) {
        <div class="alert alert-error">{{ errorMsg() }}</div>
      }

      @if (loadingGroups()) {
        <div class="loading-small">Cargando grupos...</div>
      } @else if (groups().length === 0) {
        <div class="empty">
          <p>Todavia no estas en ningun grupo.</p>
          <p>Crea uno o pide un codigo a un amigo.</p>
        </div>
      } @else {
        <div class="groups-list">
          @for (group of groups(); track group.id) {
            <a class="group-card" [routerLink]="['/grupos', group.id]">
              <div class="group-card-left">
                <div class="group-name">{{ group.name }}</div>
                <div class="group-code">Codigo: <strong>{{ group.code }}</strong></div>
              </div>
              <div class="group-card-right">
                <div class="group-stat">
                  <span class="stat-value">{{ group.myPoints }}</span>
                  <span class="stat-label">puntos</span>
                </div>
                <div class="group-stat">
                  <span class="stat-value">#{{ group.myRank }}</span>
                  <span class="stat-label">posicion</span>
                </div>
                <div class="group-stat">
                  <span class="stat-value">{{ group.memberCount }}</span>
                  <span class="stat-label">jugadores</span>
                </div>
              </div>
              <div class="arrow">›</div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 860px; margin: 0 auto; color: white; }
    .page-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 24px; }

    .actions-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    @media (max-width: 600px) { .actions-row { grid-template-columns: 1fr; } }

    .action-card {
      background: #1a1a2e;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid rgba(255,255,255,.08);
    }
    h3 { font-size: 1rem; margin-bottom: 4px; }
    .action-desc { font-size: .8rem; color: rgba(255,255,255,.45); margin-bottom: 14px; }

    .input-row { display: flex; gap: 8px; }
    .input-row input {
      flex: 1;
      padding: 9px 12px;
      background: #0f0f23;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 6px;
      color: white;
      font-size: .9rem;
    }
    .input-row input:focus { outline: none; border-color: #e63946; }
    .input-row button {
      padding: 9px 18px;
      background: #e63946;
      border: none;
      border-radius: 6px;
      color: white;
      font-size: .88rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity .15s;
    }
    .input-row button:hover:not(:disabled) { opacity: .85; }
    .input-row button:disabled { opacity: .45; cursor: not-allowed; }

    .alert {
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: .875rem;
    }
    .alert-success { background: rgba(76,175,80,.15); border: 1px solid rgba(76,175,80,.45); color: #a5d6a7; }
    .alert-error { background: rgba(230,57,70,.15); border: 1px solid rgba(230,57,70,.45); color: #ef9a9a; }

    .loading-small { text-align: center; color: rgba(255,255,255,.45); padding: 30px 0; }
    .empty { text-align: center; color: rgba(255,255,255,.45); padding: 48px 0; line-height: 1.8; }

    .groups-list { display: flex; flex-direction: column; gap: 10px; }
    .group-card {
      display: flex;
      align-items: center;
      gap: 20px;
      background: #1a1a2e;
      border-radius: 12px;
      padding: 18px 20px;
      text-decoration: none;
      color: white;
      border: 1px solid rgba(255,255,255,.07);
      transition: border-color .15s, background .15s;
    }
    .group-card:hover { border-color: rgba(230,57,70,.5); background: #1e1e38; }

    .group-card-left { flex: 1; }
    .group-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
    .group-code { font-size: .78rem; color: rgba(255,255,255,.4); }
    .group-code strong { color: rgba(255,255,255,.7); letter-spacing: .05em; }

    .group-card-right { display: flex; gap: 20px; }
    .group-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .stat-value { font-size: 1.1rem; font-weight: 700; color: #4caf50; }
    .stat-label { font-size: .7rem; color: rgba(255,255,255,.4); text-transform: uppercase; letter-spacing: .05em; }

    .arrow { font-size: 1.4rem; color: rgba(255,255,255,.25); margin-left: 4px; }
  `]
})
export class GroupList implements OnInit {
  private readonly api = inject(ApiService);

  groups = signal<Group[]>([]);
  loadingGroups = signal(true);
  newGroupName = '';
  joinCode = '';
  creating = signal(false);
  joining = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.loadingGroups.set(true);
    this.api.getMyGroups().subscribe({
      next: (g) => { this.groups.set(g); this.loadingGroups.set(false); },
      error: () => this.loadingGroups.set(false)
    });
  }

  createGroup() {
    const name = this.newGroupName.trim();
    if (!name) return;
    this.creating.set(true);
    this.clearAlerts();

    this.api.createGroup(name).subscribe({
      next: (r) => {
        this.successMsg.set(`Grupo "${r.name}" creado. Codigo: ${r.code}`);
        this.newGroupName = '';
        this.creating.set(false);
        this.loadGroups();
      },
      error: (e) => {
        this.errorMsg.set(e.error?.message ?? 'No se pudo crear el grupo');
        this.creating.set(false);
      }
    });
  }

  joinGroup() {
    const code = this.joinCode.trim().toUpperCase();
    if (!code) return;
    this.joining.set(true);
    this.clearAlerts();

    this.api.joinGroup(code).subscribe({
      next: () => {
        this.successMsg.set('Te uniste al grupo correctamente.');
        this.joinCode = '';
        this.joining.set(false);
        this.loadGroups();
      },
      error: (e) => {
        this.errorMsg.set(e.error?.message ?? 'Codigo invalido o grupo no encontrado');
        this.joining.set(false);
      }
    });
  }

  private clearAlerts() {
    this.successMsg.set('');
    this.errorMsg.set('');
  }
}
