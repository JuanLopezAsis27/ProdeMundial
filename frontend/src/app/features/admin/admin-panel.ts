import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface MatchDto {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlagUrl?: string;
  awayFlagUrl?: string;
  homeGoals: number;
  awayGoals: number;
  status: string;
  kickoffUtc: string;
  stage: string;
  groupName?: string;
  qualifierTeam?: string;
  homePenalties?: number;
  awayPenalties?: number;
}

interface UserDto { id: string; username: string; email: string; createdAt: string; }
interface GroupDto { id: string; name: string; code: string; memberCount: number; createdAt: string; }

const ARG_TZ = 'America/Argentina/Buenos_Aires';

function isKnockoutStage(stage: string): boolean {
  return stage !== 'Group Stage' && stage !== 'Friendly' && !!stage;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="admin">
      <div class="admin-header">
        <h1 class="admin-title">Panel de Administración</h1>
        <p class="admin-sub">Gestioná partidos, simulá resultados, usuarios y grupos</p>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="tab() === 'matches'" (click)="tab.set('matches')">⚽ Partidos</button>
        <button class="tab" [class.active]="tab() === 'users'"   (click)="loadUsers(); tab.set('users')">👥 Usuarios</button>
        <button class="tab" [class.active]="tab() === 'groups'"  (click)="loadGroups(); tab.set('groups')">🏆 Grupos</button>
      </div>

      <!-- Matches tab -->
      @if (tab() === 'matches') {
        <div class="section">
          <div class="section-header">
            <h2>Partidos</h2>
            <div class="filter-row">
              <button class="btn-create" (click)="openCreateModal()">➕ Crear Partido</button>
              <button class="btn-import" (click)="importFixture()" [disabled]="importing()">
                {{ importing() === 'fixture' ? '⏳ Importando...' : '🌍 Importar fixture WC' }}
              </button>
              <button class="btn-import btn-import-today" (click)="importToday()" [disabled]="importing()">
                {{ importing() === 'today' ? '⏳ Importando...' : '📅 Partidos de hoy' }}
              </button>
              <button class="btn-import btn-import-bracket" (click)="generateBracket()" [disabled]="importing()">
                {{ importing() === 'bracket' ? '⏳ Generando...' : '🔀 Generar Bracket' }}
              </button>
              <select class="filter-select" [(ngModel)]="stageFilter">
                <option value="">Todas las fases</option>
                <option value="Group Stage">Fase de Grupos</option>
                <option value="Round of 32">Ronda de 32</option>
                <option value="Round of 16">Octavos</option>
                <option value="Quarter-finals">Cuartos</option>
                <option value="Semi-finals">Semis</option>
                <option value="Final">Final</option>
              </select>
              <select class="filter-select" [(ngModel)]="statusFilter">
                <option value="">Todos los estados</option>
                <option value="Scheduled">Programados</option>
                <option value="InProgress">En Vivo</option>
                <option value="Finished">Finalizados</option>
              </select>
            </div>
          </div>

          @if (matchesLoading()) {
            <div class="loading-row"><div class="spinner"></div> Cargando...</div>
          } @else {
            <div class="match-table-wrap">
              <table class="match-table">
                <thead>
                  <tr>
                    <th>Fecha (ARG)</th>
                    <th>Fase</th>
                    <th>Partido</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of filteredMatches(); track m.id) {
                    <tr [class.live-row]="m.status === 'InProgress'" [class.finished-row]="m.status === 'Finished'">
                      <td class="date-cell">{{ m.kickoffUtc | date:'d/M HH:mm':ARG_TZ }}</td>
                      <td class="stage-cell">{{ m.groupName ? 'G ' + m.groupName : m.stage }}</td>
                      <td class="teams-cell">
                        @if (m.homeFlagUrl) { <img [src]="m.homeFlagUrl" class="flag"> }
                        <span>{{ m.homeTeam }}</span>
                        @if (m.status !== 'Scheduled') {
                          <span class="score-inline">{{ m.homeGoals }}–{{ m.awayGoals }}</span>
                          @if (m.homePenalties != null && m.awayPenalties != null) {
                            <span class="pen-inline">({{ m.homePenalties }}-{{ m.awayPenalties }} pen)</span>
                          }
                        } @else {
                          <span class="vs">vs</span>
                        }
                        <span>{{ m.awayTeam }}</span>
                        @if (m.awayFlagUrl) { <img [src]="m.awayFlagUrl" class="flag"> }
                        @if (m.qualifierTeam && m.status === 'Finished') {
                          <span class="qualifier-badge">→ {{ m.qualifierTeam === 'home' ? m.homeTeam : m.awayTeam }}</span>
                        }
                      </td>
                      <td>
                        <span class="badge" [class.badge-live]="m.status === 'InProgress'" [class.badge-done]="m.status === 'Finished'">
                          {{ statusLabel(m.status) }}
                        </span>
                      </td>
                      <td class="actions-cell">
                        <button class="btn-edit" (click)="openEditModal(m)" title="Editar partido">✏️</button>
                        @if (m.status !== 'Finished') {
                          @if (simulating() === m.id) {
                            <div class="sim-form">
                              <input type="number" [(ngModel)]="simHome" min="0" max="20" class="score-input">
                              <span>–</span>
                              <input type="number" [(ngModel)]="simAway" min="0" max="20" class="score-input">
                              <label class="finish-label">
                                <input type="checkbox" [(ngModel)]="simFinish"> Final
                              </label>
                              @if (simFinish && isKnockout(m.stage) && simHome === simAway) {
                                <div class="knockout-extras">
                                  <div class="qual-row">
                                    <span class="qual-label">Pasa:</span>
                                    <button class="qual-btn" [class.qual-active]="simQualifier === 'home'" (click)="simQualifier = simQualifier === 'home' ? '' : 'home'">{{ m.homeTeam }}</button>
                                    <button class="qual-btn" [class.qual-active]="simQualifier === 'away'" (click)="simQualifier = simQualifier === 'away' ? '' : 'away'">{{ m.awayTeam }}</button>
                                  </div>
                                  <div class="pen-row">
                                    <span class="pen-label">Penales:</span>
                                    <input type="number" [(ngModel)]="simHomePen" min="0" max="20" class="score-input pen-input">
                                    <span>–</span>
                                    <input type="number" [(ngModel)]="simAwayPen" min="0" max="20" class="score-input pen-input">
                                  </div>
                                </div>
                              }
                              <button class="btn-apply" (click)="applySimulation(m.id)" [disabled]="simBusy()">
                                {{ simBusy() ? '...' : 'Aplicar' }}
                              </button>
                              <button class="btn-cancel" (click)="simulating.set('')">✕</button>
                            </div>
                          } @else {
                            <button class="btn-sim" (click)="openSim(m)">Simular</button>
                          }
                        } @else {
                          <!-- Finished match: show qualifier/penalty edit for knockout draws -->
                          @if (isKnockout(m.stage) && m.homeGoals === m.awayGoals) {
                            @if (editingQualifier() === m.id) {
                              <div class="sim-form">
                                <div class="knockout-extras">
                                  <div class="qual-row">
                                    <span class="qual-label">Pasa:</span>
                                    <button class="qual-btn" [class.qual-active]="editQualifier === 'home'" (click)="editQualifier = editQualifier === 'home' ? '' : 'home'">{{ m.homeTeam }}</button>
                                    <button class="qual-btn" [class.qual-active]="editQualifier === 'away'" (click)="editQualifier = editQualifier === 'away' ? '' : 'away'">{{ m.awayTeam }}</button>
                                  </div>
                                  <div class="pen-row">
                                    <span class="pen-label">Penales:</span>
                                    <input type="number" [(ngModel)]="editHomePen" min="0" max="20" class="score-input pen-input">
                                    <span>–</span>
                                    <input type="number" [(ngModel)]="editAwayPen" min="0" max="20" class="score-input pen-input">
                                  </div>
                                </div>
                                <button class="btn-apply" (click)="applyQualifierEdit(m)" [disabled]="simBusy()">
                                  {{ simBusy() ? '...' : 'Guardar' }}
                                </button>
                                <button class="btn-cancel" (click)="editingQualifier.set('')">✕</button>
                              </div>
                            } @else {
                              <button class="btn-sim btn-qualifier" (click)="openQualifierEdit(m)">{{ m.qualifierTeam ? '✏️ Editar' : '⚡ Quién pasa' }}</button>
                            }
                          } @else {
                            <span class="text-muted">—</span>
                          }
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- Create/Edit Match modal -->
      @if (showMatchModal()) {
        <div class="modal-overlay" (click)="closeMatchModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="modal-title">{{ editingMatchId ? 'Editar Partido' : 'Crear Partido' }}</span>
              <button class="modal-close" (click)="closeMatchModal()">&#10005;</button>
            </div>
            <div class="modal-body">
              <div class="form-row">
                <label>Local</label>
                <input type="text" [(ngModel)]="modalHome" class="form-input" placeholder="Equipo local">
              </div>
              <div class="form-row">
                <label>Visitante</label>
                <input type="text" [(ngModel)]="modalAway" class="form-input" placeholder="Equipo visitante">
              </div>
              <div class="form-row">
                <label>Fecha y Hora (UTC)</label>
                <input type="datetime-local" [(ngModel)]="modalKickoff" class="form-input">
              </div>
              <div class="form-row">
                <label>Fase</label>
                <select [(ngModel)]="modalStage" class="form-input">
                  <option value="Group Stage">Fase de Grupos</option>
                  <option value="Round of 32">Ronda de 32</option>
                  <option value="Round of 16">Octavos</option>
                  <option value="Quarter-finals">Cuartos</option>
                  <option value="Semi-finals">Semifinales</option>
                  <option value="Third Place">Tercer Puesto</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              @if (modalStage === 'Group Stage') {
                <div class="form-row">
                  <label>Grupo</label>
                  <select [(ngModel)]="modalGroup" class="form-input">
                    <option value="">Sin grupo</option>
                    @for (g of ['A','B','C','D','E','F','G','H','I','J','K','L']; track g) {
                      <option [value]="g">Grupo {{ g }}</option>
                    }
                  </select>
                </div>
              }
              <div class="form-row">
                <label>Bandera Local (URL)</label>
                <input type="text" [(ngModel)]="modalHomeFlagUrl" class="form-input" placeholder="https://...">
              </div>
              <div class="form-row">
                <label>Bandera Visitante (URL)</label>
                <input type="text" [(ngModel)]="modalAwayFlagUrl" class="form-input" placeholder="https://...">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="closeMatchModal()">Cancelar</button>
              <button class="btn-apply" (click)="saveMatch()" [disabled]="savingMatch()">
                {{ savingMatch() ? '...' : (editingMatchId ? 'Guardar' : 'Crear') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Users tab -->
      @if (tab() === 'users') {
        <div class="section">
          <h2>Usuarios ({{ users().length }})</h2>
          @if (usersLoading()) {
            <div class="loading-row"><div class="spinner"></div> Cargando...</div>
          } @else {
            <table class="data-table">
              <thead><tr><th>Usuario</th><th>Email</th><th>Registrado</th><th></th></tr></thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr>
                    <td>{{ u.username }}</td>
                    <td class="email-cell">{{ u.email }}</td>
                    <td>{{ u.createdAt | date:'d/M/yy' }}</td>
                    <td>
                      <button class="btn-del" (click)="deleteUser(u.id, u.username)" title="Eliminar usuario">✕</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      <!-- Groups tab -->
      @if (tab() === 'groups') {
        <div class="section">
          <h2>Grupos ({{ groups().length }})</h2>
          @if (groupsLoading()) {
            <div class="loading-row"><div class="spinner"></div> Cargando...</div>
          } @else {
            <table class="data-table">
              <thead><tr><th>Nombre</th><th>Código</th><th>Miembros</th><th>Creado</th><th></th></tr></thead>
              <tbody>
                @for (g of groups(); track g.id) {
                  <tr>
                    <td>{{ g.name }}</td>
                    <td><code class="code-badge">{{ g.code }}</code></td>
                    <td>{{ g.memberCount }}</td>
                    <td>{{ g.createdAt | date:'d/M/yy' }}</td>
                    <td>
                      <button class="btn-del" (click)="deleteGroup(g.id, g.name)" title="Eliminar grupo">✕</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      @if (toast()) {
        <div class="toast" [class.toast-err]="toastType() === 'error'">{{ toast() }}</div>
      }
    </div>
  `,
  styles: [`
    .admin { max-width: 1200px; margin: 0 auto; padding: 32px 24px; color: white; }

    .admin-header { margin-bottom: 28px; }
    .admin-title { font-size: 2rem; }
    .admin-sub { color: rgba(255,255,255,.4); font-size: .9rem; margin-top: 4px; }

    .tabs {
      display: flex; gap: 4px;
      border-bottom: 2px solid rgba(255,255,255,.08);
      margin-bottom: 28px;
    }
    .tab {
      background: none; border: none; color: rgba(255,255,255,.5);
      padding: 10px 20px; font-size: .95rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: .06em; cursor: pointer;
      border-bottom: 2px solid transparent; margin-bottom: -2px;
      transition: color .15s; font-family: 'Barlow Condensed', sans-serif;
    }
    .tab:hover { color: white; }
    .tab.active { color: #C5E000; border-bottom-color: #C5E000; }

    .section h2 { font-size: 1.2rem; margin-bottom: 18px; color: rgba(255,255,255,.7); }

    .section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
    .section-header h2 { margin-bottom: 0; }
    .filter-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .filter-select {
      background: #1A1A28; border: 1px solid rgba(255,255,255,.12); color: white;
      padding: 6px 10px; border-radius: 6px; font-size: .82rem; outline: none;
    }
    .btn-create {
      background: rgba(76,175,80,.15); border: 1px solid rgba(76,175,80,.4); color: #81c784;
      padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: .8rem; font-weight: 700;
      transition: all .15s; white-space: nowrap;
    }
    .btn-create:hover { background: rgba(76,175,80,.3); border-color: #4caf50; color: white; }
    .btn-import {
      background: rgba(107,33,214,.15); border: 1px solid rgba(107,33,214,.4); color: #a78bfa;
      padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: .8rem; font-weight: 600;
      transition: all .15s; white-space: nowrap;
    }
    .btn-import:hover:not(:disabled) { background: rgba(107,33,214,.3); border-color: #6B21D6; color: white; }
    .btn-import:disabled { opacity: .5; cursor: not-allowed; }
    .btn-import-today { background: rgba(197,224,0,.1); border-color: rgba(197,224,0,.35); color: #C5E000; }
    .btn-import-today:hover:not(:disabled) { background: rgba(197,224,0,.22); border-color: #C5E000; color: white; }
    .btn-import-bracket { background: rgba(212,0,26,.1); border-color: rgba(212,0,26,.35); color: #ff6b6b; }
    .btn-import-bracket:hover:not(:disabled) { background: rgba(212,0,26,.22); border-color: #D4001A; color: white; }

    .loading-row { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,.45); padding: 40px 0; }
    .spinner { width: 22px; height: 22px; border: 2px solid rgba(255,255,255,.1); border-top-color: #D4001A; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .match-table-wrap { overflow-x: auto; }

    .match-table, .data-table {
      width: 100%; border-collapse: collapse; font-size: .88rem;
    }
    .match-table th, .data-table th {
      text-align: left; padding: 8px 10px; font-size: .75rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .06em; color: rgba(255,255,255,.4);
      border-bottom: 1px solid rgba(255,255,255,.08);
    }
    .match-table td, .data-table td {
      padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,.05); vertical-align: middle;
    }
    .match-table tr:hover td, .data-table tr:hover td { background: rgba(255,255,255,.03); }
    .live-row td { background: rgba(212,0,26,.06); }
    .finished-row { opacity: .7; }

    .date-cell { white-space: nowrap; color: rgba(255,255,255,.5); font-size: .8rem; }
    .stage-cell { font-size: .8rem; color: rgba(255,255,255,.5); white-space: nowrap; }
    .teams-cell { display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-wrap: wrap; }
    .flag { width: 20px; height: 14px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
    .vs { color: rgba(255,255,255,.3); font-size: .8rem; margin: 0 4px; }
    .score-inline { font-weight: 700; color: #D4001A; margin: 0 6px; }
    .pen-inline { font-size: .72rem; color: rgba(197,224,0,.7); margin-left: 2px; }
    .qualifier-badge { font-size: .68rem; color: #C5E000; background: rgba(197,224,0,.12); padding: 2px 6px; border-radius: 4px; margin-left: 4px; }

    .badge { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 3px 8px; border-radius: 100px; background: rgba(255,255,255,.08); color: rgba(255,255,255,.4); }
    .badge-live { background: rgba(212,0,26,.2); color: #D4001A; }
    .badge-done { background: rgba(197,224,0,.1); color: #C5E000; }

    .actions-cell { min-width: 200px; }
    .btn-edit {
      background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.15); color: rgba(255,255,255,.6);
      padding: 3px 8px; border-radius: 5px; cursor: pointer; font-size: .82rem; margin-right: 4px;
      transition: all .15s;
    }
    .btn-edit:hover { background: rgba(255,255,255,.12); color: white; }
    .sim-form { display: flex; align-items: flex-start; gap: 6px; flex-wrap: wrap; }
    .score-input { width: 42px; background: #111118; border: 1px solid rgba(255,255,255,.15); color: white; padding: 4px 6px; border-radius: 5px; text-align: center; font-size: .9rem; }
    .pen-input { width: 36px; font-size: .8rem; }
    .finish-label { font-size: .78rem; color: rgba(255,255,255,.5); display: flex; align-items: center; gap: 4px; white-space: nowrap; }
    .knockout-extras { display: flex; flex-direction: column; gap: 6px; width: 100%; margin: 4px 0; }
    .qual-row, .pen-row { display: flex; align-items: center; gap: 6px; }
    .qual-label, .pen-label { font-size: .72rem; color: rgba(255,255,255,.4); text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
    .qual-btn {
      padding: 4px 10px; border-radius: 5px;
      background: rgba(107,33,214,.15); border: 1px solid rgba(107,33,214,.3);
      color: rgba(255,255,255,.6); font-size: .75rem; font-weight: 600;
      cursor: pointer; transition: all .15s;
    }
    .qual-btn:hover { background: rgba(107,33,214,.3); color: white; }
    .qual-btn.qual-active { background: rgba(107,33,214,.5); border-color: #6B21D6; color: white; }
    .btn-apply { background: #D4001A; border: none; color: white; padding: 4px 12px; border-radius: 5px; cursor: pointer; font-size: .8rem; font-weight: 700; }
    .btn-apply:disabled { opacity: .5; }
    .btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,.2); color: rgba(255,255,255,.5); padding: 4px 8px; border-radius: 5px; cursor: pointer; font-size: .8rem; }
    .btn-sim { background: rgba(197,224,0,.12); border: 1px solid rgba(197,224,0,.3); color: #C5E000; padding: 4px 12px; border-radius: 5px; cursor: pointer; font-size: .8rem; font-weight: 600; transition: background .15s; }
    .btn-sim:hover { background: rgba(197,224,0,.22); }
    .btn-qualifier { background: rgba(107,33,214,.12); border-color: rgba(107,33,214,.3); color: #a78bfa; }
    .btn-qualifier:hover { background: rgba(107,33,214,.22); }
    .text-muted { color: rgba(255,255,255,.2); }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.7);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;
    }
    .modal {
      background: #12121E; border: 1px solid rgba(255,255,255,.12); border-radius: 14px;
      width: 100%; max-width: 500px; max-height: 85vh; overflow-y: auto; padding: 24px;
    }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .modal-title { font-size: 1.2rem; font-weight: 700; }
    .modal-close { background: none; border: none; color: rgba(255,255,255,.5); font-size: 1.2rem; cursor: pointer; padding: 4px; }
    .modal-close:hover { color: white; }
    .modal-body { display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: flex; flex-direction: column; gap: 4px; }
    .form-row label { font-size: .78rem; color: rgba(255,255,255,.5); text-transform: uppercase; letter-spacing: .04em; }
    .form-input {
      background: #1A1A28; border: 1px solid rgba(255,255,255,.15); color: white;
      padding: 8px 12px; border-radius: 6px; font-size: .88rem; outline: none;
      transition: border-color .15s;
    }
    .form-input:focus { border-color: #D4001A; }
    .form-input option { background: #1A1A28; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.07); }

    .email-cell { color: rgba(255,255,255,.55); font-size: .82rem; }
    .code-badge { background: rgba(255,255,255,.08); padding: 2px 8px; border-radius: 4px; font-size: .85rem; color: rgba(255,255,255,.7); }
    .btn-del { background: transparent; border: 1px solid rgba(212,0,26,.3); color: rgba(212,0,26,.7); padding: 3px 8px; border-radius: 5px; cursor: pointer; font-size: .85rem; transition: all .15s; }
    .btn-del:hover { background: rgba(212,0,26,.15); color: #D4001A; border-color: #D4001A; }

    .toast {
      position: fixed; bottom: 24px; right: 24px; background: #22223A; border: 1px solid rgba(197,224,0,.4);
      color: #C5E000; padding: 12px 20px; border-radius: 8px; font-size: .9rem; font-weight: 600;
      animation: fadeIn .2s ease; z-index: 999;
    }
    .toast.toast-err { border-color: rgba(212,0,26,.4); color: #D4001A; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; } }
  `]
})
export class AdminPanel implements OnInit {
  readonly ARG_TZ = ARG_TZ;

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  readonly tab = signal<'matches' | 'users' | 'groups'>('matches');

  // Matches
  private readonly _matches = signal<MatchDto[]>([]);
  readonly matchesLoading = signal(true);
  stageFilter = '';
  statusFilter = '';

  filteredMatches() {
    return this._matches().filter(m =>
      (!this.stageFilter || m.stage === this.stageFilter) &&
      (!this.statusFilter || m.status === this.statusFilter)
    );
  }

  // Simulate
  readonly simulating = signal('');
  simHome = 0;
  simAway = 0;
  simFinish = true;
  simQualifier = '';
  simHomePen = 0;
  simAwayPen = 0;
  readonly simBusy = signal(false);
  readonly importing = signal<'' | 'fixture' | 'today' | 'bracket'>('');

  // Qualifier edit (for finished matches)
  readonly editingQualifier = signal('');
  editQualifier = '';
  editHomePen = 0;
  editAwayPen = 0;

  // Create/Edit Match modal
  readonly showMatchModal = signal(false);
  readonly savingMatch = signal(false);
  editingMatchId = '';
  modalHome = '';
  modalAway = '';
  modalKickoff = '';
  modalStage = 'Group Stage';
  modalGroup = '';
  modalHomeFlagUrl = '';
  modalAwayFlagUrl = '';

  // Users
  readonly users = signal<UserDto[]>([]);
  readonly usersLoading = signal(false);

  // Groups
  readonly groups = signal<GroupDto[]>([]);
  readonly groupsLoading = signal(false);

  // Toast
  readonly toast = signal('');
  readonly toastType = signal<'ok' | 'error'>('ok');

  ngOnInit() {
    this.loadMatches();
  }

  isKnockout(stage: string): boolean {
    return isKnockoutStage(stage);
  }

  // ---- Matches ----

  loadMatches() {
    this.matchesLoading.set(true);
    this.http.get<MatchDto[]>(`${this.base}/matches`).subscribe({
      next: r => { this._matches.set(r); this.matchesLoading.set(false); },
      error: () => { this.matchesLoading.set(false); this.showToast('Error al cargar partidos', 'error'); }
    });
  }

  openCreateModal() {
    this.editingMatchId = '';
    this.modalHome = '';
    this.modalAway = '';
    this.modalKickoff = '';
    this.modalStage = 'Group Stage';
    this.modalGroup = '';
    this.modalHomeFlagUrl = '';
    this.modalAwayFlagUrl = '';
    this.showMatchModal.set(true);
  }

  openEditModal(m: MatchDto) {
    this.editingMatchId = m.id;
    this.modalHome = m.homeTeam;
    this.modalAway = m.awayTeam;
    // Convert UTC date to datetime-local format
    const d = new Date(m.kickoffUtc);
    this.modalKickoff = d.toISOString().slice(0, 16);
    this.modalStage = m.stage;
    this.modalGroup = m.groupName ?? '';
    this.modalHomeFlagUrl = m.homeFlagUrl ?? '';
    this.modalAwayFlagUrl = m.awayFlagUrl ?? '';
    this.showMatchModal.set(true);
  }

  closeMatchModal() {
    this.showMatchModal.set(false);
  }

  saveMatch() {
    if (!this.modalHome.trim() || !this.modalAway.trim() || !this.modalKickoff) {
      this.showToast('Completá todos los campos requeridos', 'error');
      return;
    }
    this.savingMatch.set(true);
    const body = {
      homeTeam: this.modalHome.trim(),
      awayTeam: this.modalAway.trim(),
      kickoffUtc: new Date(this.modalKickoff).toISOString(),
      stage: this.modalStage,
      groupName: this.modalStage === 'Group Stage' && this.modalGroup ? this.modalGroup : null,
      homeFlagUrl: this.modalHomeFlagUrl.trim() || null,
      awayFlagUrl: this.modalAwayFlagUrl.trim() || null,
    };

    const obs = this.editingMatchId
      ? this.http.put(`${this.base}/matches/${this.editingMatchId}`, body)
      : this.http.post(`${this.base}/matches`, body);

    obs.subscribe({
      next: () => {
        this.savingMatch.set(false);
        this.showMatchModal.set(false);
        this.showToast(this.editingMatchId ? 'Partido actualizado ✓' : 'Partido creado ✓');
        this.loadMatches();
      },
      error: () => { this.savingMatch.set(false); this.showToast('Error al guardar partido', 'error'); }
    });
  }

  // ---- Simulate ----

  openSim(m: MatchDto) {
    this.simulating.set(m.id);
    this.simHome = m.homeGoals;
    this.simAway = m.awayGoals;
    this.simFinish = true;
    this.simQualifier = '';
    this.simHomePen = 0;
    this.simAwayPen = 0;
  }

  applySimulation(matchId: string) {
    this.simBusy.set(true);
    const match = this._matches().find(m => m.id === matchId);
    const isKo = match && isKnockoutStage(match.stage);
    const isDraw = this.simHome === this.simAway;

    const body: any = {
      homeGoals: this.simHome,
      awayGoals: this.simAway,
      finish: this.simFinish,
    };

    if (this.simFinish && isKo && isDraw) {
      if (this.simQualifier) body.qualifier = this.simQualifier;
      if (this.simHomePen > 0 || this.simAwayPen > 0) {
        body.homePenalties = this.simHomePen;
        body.awayPenalties = this.simAwayPen;
      }
    }

    this.http.post(`${this.base}/matches/${matchId}/simulate`, body).subscribe({
      next: () => {
        this.simBusy.set(false);
        this.simulating.set('');
        this.showToast('Resultado simulado ✓');
        this.loadMatches();
      },
      error: () => { this.simBusy.set(false); this.showToast('Error al simular', 'error'); }
    });
  }

  // ---- Qualifier edit for finished matches ----

  openQualifierEdit(m: MatchDto) {
    this.editingQualifier.set(m.id);
    this.editQualifier = m.qualifierTeam ?? '';
    this.editHomePen = m.homePenalties ?? 0;
    this.editAwayPen = m.awayPenalties ?? 0;
  }

  applyQualifierEdit(m: MatchDto) {
    this.simBusy.set(true);
    const body: any = {
      qualifier: this.editQualifier || null,
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
    };
    if (this.editHomePen > 0 || this.editAwayPen > 0) {
      body.homePenalties = this.editHomePen;
      body.awayPenalties = this.editAwayPen;
    }

    this.http.put(`${this.base}/matches/${m.id}/qualifier`, body).subscribe({
      next: () => {
        this.simBusy.set(false);
        this.editingQualifier.set('');
        this.showToast('Clasificado actualizado ✓');
        this.loadMatches();
      },
      error: () => { this.simBusy.set(false); this.showToast('Error al actualizar', 'error'); }
    });
  }

  // ---- Import ----

  importFixture() {
    this.importing.set('fixture');
    this.http.post<{ count: number; message: string }>(`${this.base}/import-fixture`, {}).subscribe({
      next: r => {
        this.importing.set('');
        this.showToast(`${r.message}`);
        this.loadMatches();
      },
      error: () => { this.importing.set(''); this.showToast('Error al importar fixture', 'error'); }
    });
  }

  importToday() {
    this.importing.set('today');
    this.http.post<{ count: number; message: string }>(`${this.base}/import-today`, {}).subscribe({
      next: r => {
        this.importing.set('');
        this.showToast(`${r.message}`);
        this.loadMatches();
      },
      error: () => { this.importing.set(''); this.showToast('Error al importar partidos de hoy', 'error'); }
    });
  }

  generateBracket() {
    this.importing.set('bracket');
    this.http.post<{ count: number; message: string }>(`${this.base}/generate-bracket`, {}).subscribe({
      next: r => {
        this.importing.set('');
        this.showToast(`${r.message}`);
        this.loadMatches();
      },
      error: () => { this.importing.set(''); this.showToast('Error al generar bracket', 'error'); }
    });
  }

  // ---- Users ----

  loadUsers() {
    if (this.users().length) return;
    this.usersLoading.set(true);
    this.http.get<UserDto[]>(`${this.base}/users`).subscribe({
      next: r => { this.users.set(r); this.usersLoading.set(false); },
      error: () => { this.usersLoading.set(false); this.showToast('Error al cargar usuarios', 'error'); }
    });
  }

  loadGroups() {
    if (this.groups().length) return;
    this.groupsLoading.set(true);
    this.http.get<GroupDto[]>(`${this.base}/groups`).subscribe({
      next: r => { this.groups.set(r); this.groupsLoading.set(false); },
      error: () => { this.groupsLoading.set(false); this.showToast('Error al cargar grupos', 'error'); }
    });
  }

  deleteUser(id: string, username: string) {
    if (!confirm(`¿Eliminar usuario "${username}"?`)) return;
    this.http.delete(`${this.base}/users/${id}`).subscribe({
      next: () => { this.users.update(list => list.filter(u => u.id !== id)); this.showToast('Usuario eliminado'); },
      error: () => this.showToast('Error al eliminar usuario', 'error')
    });
  }

  deleteGroup(id: string, name: string) {
    if (!confirm(`¿Eliminar grupo "${name}"? Se borrarán todas las predicciones.`)) return;
    this.http.delete(`${this.base}/groups/${id}`).subscribe({
      next: () => { this.groups.update(list => list.filter(g => g.id !== id)); this.showToast('Grupo eliminado'); },
      error: () => this.showToast('Error al eliminar grupo', 'error')
    });
  }

  statusLabel(status: string) {
    return status === 'InProgress' ? 'En Vivo' : status === 'Finished' ? 'Finalizado' : 'Prog.';
  }

  private showToast(msg: string, type: 'ok' | 'error' = 'ok') {
    this.toast.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
