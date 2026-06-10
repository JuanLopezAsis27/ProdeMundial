import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, GroupStats, UserStats } from '../../../core/api/api.service';
import { Leaderboard } from '../../../core/models/group.model';
import { Prediction } from '../../../core/models/prediction.model';
import { Match } from '../../../core/models/match.model';
import { AuthService } from '../../../core/auth/auth.service';

const ARG_OFFSET_MS = -3 * 60 * 60 * 1000;

function toArgDate(utcStr: string): Date {
  return new Date(new Date(utcStr).getTime() + ARG_OFFSET_MS);
}

function toArgDateKey(utcStr: string): string {
  const d = toArgDate(utcStr);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatArgTime(utcStr: string): string {
  const d = toArgDate(utcStr);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function isKnockout(stage: string): boolean {
  return stage !== 'Group Stage' && stage !== 'Friendly';
}

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      @if (toast()) {
        <div class="toast" [class.toast-ok]="toast()!.type === 'ok'" [class.toast-err]="toast()!.type === 'err'">
          {{ toast()!.msg }}
        </div>
      }

      <!-- User stats modal -->
      @if (selectedMember()) {
        <div class="modal-overlay" (click)="closeMemberModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="modal-title">{{ selectedMember()!.username }}</span>
              <button class="modal-close" (click)="closeMemberModal()">&#10005;</button>
            </div>
            <div class="modal-stat-row">
              <div class="modal-chip">
                <span class="modal-chip-val">{{ selectedMember()!.totalPoints }}</span>
                <span class="modal-chip-lbl">puntos</span>
              </div>
              <div class="modal-chip good">
                <span class="modal-chip-val">{{ selectedMember()!.exactPredictions }}</span>
                <span class="modal-chip-lbl">exactos (3pts)</span>
              </div>
              <div class="modal-chip ok">
                <span class="modal-chip-val">{{ selectedMember()!.correctOutcomes }}</span>
                <span class="modal-chip-lbl">correctos (1pt)</span>
              </div>
              <div class="modal-chip bad">
                <span class="modal-chip-val">{{ selectedMember()!.wrongPredictions }}</span>
                <span class="modal-chip-lbl">errores</span>
              </div>
            </div>
            @if (loadingMemberPreds()) {
              <div class="modal-loading">Cargando predicciones...</div>
            } @else if (memberPredictions().length === 0) {
              <div class="modal-empty">Sin predicciones puntuadas aún.</div>
            } @else {
              <div class="modal-preds">
                @for (pred of memberPredictions(); track pred.id) {
                  <div class="modal-pred-row" [class.scored]="pred.isScored">
                    <div class="modal-pred-match">
                      <span class="modal-team">{{ pred.homeTeam }}</span>
                      <span class="modal-vs">vs</span>
                      <span class="modal-team">{{ pred.awayTeam }}</span>
                    </div>
                    <div class="modal-scores">
                      <div class="modal-score-box pred">
                        <span class="mslbl">Predicción</span>
                        <span class="msval">{{ pred.predictedHome }} - {{ pred.predictedAway }}</span>
                      </div>
                      @if (pred.matchStatus !== 'Scheduled') {
                        <div class="modal-score-box actual" [class.live]="pred.matchStatus === 'InProgress'">
                          <span class="mslbl">{{ pred.matchStatus === 'InProgress' ? 'En curso' : 'Resultado' }}</span>
                          <span class="msval">{{ pred.actualHome }} - {{ pred.actualAway }}</span>
                        </div>
                      }
                      @if (pred.isScored) {
                        <div class="modal-pts"
                          [class.pts-3]="pred.pointsEarned === 3"
                          [class.pts-1]="pred.pointsEarned === 1"
                          [class.pts-0]="pred.pointsEarned === 0">
                          {{ pred.pointsEarned }}pts
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <a routerLink="/grupos" class="back-link">&#8592; Mis Grupos</a>

      @if (leaderboard()) {
        <div class="group-header">
          <h1>{{ leaderboard()!.groupName }}</h1>
        </div>
      }

      <div class="tabs">
        <button [class.active]="tab() === 'leaderboard'" (click)="setTab('leaderboard')">Tabla</button>
        <button [class.active]="tab() === 'predict'" (click)="setTab('predict')">Predecir</button>
        <button [class.active]="tab() === 'predictions'" (click)="setTab('predictions')">Mis Predicciones</button>
        <button [class.active]="tab() === 'stats'" (click)="setTab('stats')">Estadísticas</button>
      </div>

      @if (tab() === 'leaderboard') {
        @if (loadingLeaderboard()) {
          <div class="loading">Cargando tabla...</div>
        } @else if (!leaderboard() || leaderboard()!.entries.length === 0) {
          <div class="empty">No hay entradas en la tabla todavia.</div>
        } @else {
          <div class="leaderboard">
            @for (entry of leaderboard()!.entries; track entry.userId) {
              <div class="lb-row" [class.is-me]="entry.userId === currentUserId()" [class.podium]="entry.rank <= 3"
                (click)="openMemberModal(entry.userId, entry.username)">
                <div class="lb-rank" [class.gold]="entry.rank === 1" [class.silver]="entry.rank === 2" [class.bronze]="entry.rank === 3">
                  {{ entry.rank }}
                </div>
                <div class="lb-username">
                  {{ entry.username }}
                  @if (entry.userId === currentUserId()) {
                    <span class="you-badge">Vos</span>
                  }
                </div>
                <div class="lb-points">
                  <span class="pts-value">{{ entry.totalPoints }}</span>
                  <span class="pts-label">pts</span>
                </div>
                <span class="lb-arrow">&#8250;</span>
              </div>
            }
          </div>
        }
      }

      @if (tab() === 'predict') {
        @if (loadingFixture()) {
          <div class="loading">Cargando partidos...</div>
        } @else if (fixtureLoaded() && predictableMatches().length === 0) {
          <div class="empty">
            <p>No hay partidos disponibles para predecir en este momento.</p>
            <p class="empty-sub">Los partidos aparecen aqui hasta el momento del pitazo inicial.</p>
          </div>
        } @else {
          @for (dateGroup of matchesByDate(); track dateGroup[0]) {
            <div class="date-section">
              <div class="date-heading">{{ formatDateKey(dateGroup[0]) }}</div>
              <div class="predict-list">
                @for (match of dateGroup[1]; track match.id) {
                  <div class="predict-row" [class.is-predicted]="isPredicted(match.id)" [class.is-knockout]="isKnockoutMatch(match)">
                    <div class="match-info">
                      <div class="team home-team">
                        @if (match.homeFlagUrl) {
                          <img [src]="match.homeFlagUrl" [alt]="match.homeTeam" class="flag">
                        }
                        <span class="team-name">{{ match.homeTeam }}</span>
                      </div>
                      <div class="match-meta">
                        <span class="kick-time">{{ argTime(match.kickoffUtc) }}</span>
                        @if (match.groupName) {
                          <span class="group-badge">Grupo {{ match.groupName }}</span>
                        } @else {
                          <span class="group-badge ko-badge">{{ match.stage }}</span>
                        }
                      </div>
                      <div class="team away-team">
                        <span class="team-name">{{ match.awayTeam }}</span>
                        @if (match.awayFlagUrl) {
                          <img [src]="match.awayFlagUrl" [alt]="match.awayTeam" class="flag">
                        }
                      </div>
                    </div>
                    <div class="predict-controls">
                      <input type="number" min="0" max="20" class="score-input"
                        [value]="getDraft(match.id).home"
                        (input)="setDraftHome(match.id, +$any($event.target).value)">
                      <span class="score-sep">-</span>
                      <input type="number" min="0" max="20" class="score-input"
                        [value]="getDraft(match.id).away"
                        (input)="setDraftAway(match.id, +$any($event.target).value)">
                      @if (isKnockoutMatch(match) && getDraft(match.id).home === getDraft(match.id).away) {
                        <div class="qualifier-picker">
                          <span class="qualifier-label">Pasa:</span>
                          <button class="qual-btn"
                            [class.qual-active]="getDraft(match.id).qualifier === 'home'"
                            (click)="setDraftQualifier(match.id, getDraft(match.id).qualifier === 'home' ? undefined : 'home')">
                            {{ match.homeTeam }}
                          </button>
                          <button class="qual-btn"
                            [class.qual-active]="getDraft(match.id).qualifier === 'away'"
                            (click)="setDraftQualifier(match.id, getDraft(match.id).qualifier === 'away' ? undefined : 'away')">
                            {{ match.awayTeam }}
                          </button>
                        </div>
                      }
                      <button
                        class="btn-predict"
                        [class.btn-update]="isPredicted(match.id)"
                        [disabled]="savingMatch() === match.id"
                        (click)="savePrediction(match.id)">
                        @if (savingMatch() === match.id) {
                          <span class="saving-dot"></span>
                        } @else if (isPredicted(match.id)) {
                          Actualizar
                        } @else {
                          Predecir
                        }
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        }
      }

      @if (tab() === 'predictions') {
        @if (loadingPredictions()) {
          <div class="loading">Cargando predicciones...</div>
        } @else if (predictions().length === 0) {
          <div class="empty">No hiciste predicciones en este grupo todavia.</div>
        } @else {
          <div class="pred-stats">
            <div class="stat-chip">
              <span class="chip-value">{{ totalPredictions() }}</span>
              <span class="chip-label">predicciones</span>
            </div>
            <div class="stat-chip">
              <span class="chip-value">{{ scoredPredictions() }}</span>
              <span class="chip-label">puntuadas</span>
            </div>
            <div class="stat-chip good">
              <span class="chip-value">{{ totalPoints() }}</span>
              <span class="chip-label">puntos totales</span>
            </div>
          </div>

          <div class="predictions-list">
            @for (pred of predictions(); track pred.id) {
              <div class="pred-row" [class.scored]="pred.isScored" [class.pending]="!pred.isScored">
                <div class="pred-match">
                  <span class="pred-home">{{ pred.homeTeam }}</span>
                  <span class="pred-vs">vs</span>
                  <span class="pred-away">{{ pred.awayTeam }}</span>
                </div>
                <div class="pred-result">
                  <div class="pred-score-box">
                    <span class="pred-label">Mi prediccion</span>
                    <span class="pred-value">{{ pred.predictedHome }} - {{ pred.predictedAway }}</span>
                    @if (pred.predictedQualifier) {
                      <span class="pred-qualifier">Pasa: {{ pred.predictedQualifier === 'home' ? pred.homeTeam : pred.awayTeam }}</span>
                    }
                  </div>
                  @if (pred.matchStatus !== 'Scheduled') {
                    <div class="actual-score-box" [class.live-box]="pred.matchStatus === 'InProgress'">
                      <span class="pred-label">{{ pred.matchStatus === 'InProgress' ? 'En curso' : 'Resultado' }}</span>
                      <span class="pred-value actual-val">{{ pred.actualHome }} - {{ pred.actualAway }}</span>
                    </div>
                  }
                  @if (pred.isScored) {
                    <div class="points-box"
                      [class.pts-4]="pred.pointsEarned === 4"
                      [class.pts-3]="pred.pointsEarned === 3"
                      [class.pts-1]="pred.pointsEarned === 1"
                      [class.pts-0]="pred.pointsEarned === 0">
                      <span class="pts-big">{{ pred.pointsEarned }}</span>
                      <span class="pts-small">pts</span>
                    </div>
                  } @else {
                    <div class="pending-box">
                      <span>{{ pred.matchStatus === 'Scheduled' ? argDateTime(pred.matchKickoff) : 'En curso' }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      }

      @if (tab() === 'stats') {
        @if (loadingStats()) {
          <div class="loading">Cargando estadísticas...</div>
        } @else if (!groupStats()) {
          <div class="empty">No hay estadísticas disponibles.</div>
        } @else {
          <!-- Top charts -->
          <div class="stats-section">
            <h3 class="stats-title">Predicciones exactas (3 pts)</h3>
            <div class="bar-chart">
              @for (u of groupStats()!.userStats; track u.userId) {
                <div class="bar-row">
                  <span class="bar-label">{{ u.username }}</span>
                  <div class="bar-track">
                    <div class="bar-fill exact"
                      [style.width]="barPct(u.exactPredictions, maxExact())">
                    </div>
                  </div>
                  <span class="bar-val">{{ u.exactPredictions }}</span>
                </div>
              }
            </div>
          </div>

          <div class="stats-section">
            <h3 class="stats-title">Resultados correctos (1+ pts)</h3>
            <div class="bar-chart">
              @for (u of groupStats()!.userStats; track u.userId) {
                <div class="bar-row">
                  <span class="bar-label">{{ u.username }}</span>
                  <div class="bar-track">
                    <div class="bar-fill correct"
                      [style.width]="barPct(u.correctOutcomes, maxCorrect())">
                    </div>
                  </div>
                  <span class="bar-val">{{ u.correctOutcomes }}</span>
                </div>
              }
            </div>
          </div>

          <div class="stats-section">
            <h3 class="stats-title">Puntos totales</h3>
            <div class="bar-chart">
              @for (u of groupStats()!.userStats; track u.userId) {
                <div class="bar-row">
                  <span class="bar-label">{{ u.username }}</span>
                  <div class="bar-track">
                    <div class="bar-fill points"
                      [style.width]="barPct(u.totalPoints, maxPoints())">
                    </div>
                  </div>
                  <span class="bar-val">{{ u.totalPoints }}</span>
                </div>
              }
            </div>
          </div>

          @if (groupStats()!.evolution.length > 1) {
            <div class="stats-section">
              <h3 class="stats-title">Evolución de la tabla</h3>
              <div class="evolution-table-wrap">
                <table class="evo-table">
                  <thead>
                    <tr>
                      <th class="evo-user-col">Usuario</th>
                      @for (snap of groupStats()!.evolution; track snap.date) {
                        <th class="evo-date-col">{{ formatEvoDate(snap.date) }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (u of groupStats()!.userStats; track u.userId) {
                      <tr>
                        <td class="evo-user-cell">{{ u.username }}</td>
                        @for (snap of groupStats()!.evolution; track snap.date) {
                          <td class="evo-pts-cell">{{ snap.cumulativePoints[u.userId] ?? 0 }}</td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 800px; margin: 0 auto; color: white; }
    .back-link { color: rgba(255,255,255,.5); text-decoration: none; font-size: .875rem; display: inline-block; margin-bottom: 20px; }
    .back-link:hover { color: white; }

    .group-header { margin-bottom: 20px; }
    .group-header h1 { font-size: 1.6rem; font-weight: 700; }

    .toast {
      position: fixed; top: 80px; right: 24px; z-index: 999;
      padding: 12px 20px; border-radius: 8px; font-size: .9rem; font-weight: 600;
      animation: fadeIn .2s ease;
    }
    .toast-ok { background: #1e3a1e; border: 1px solid #4caf50; color: #81c784; }
    .toast-err { background: #3a1e1e; border: 1px solid #e53935; color: #ef9a9a; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }

    .tabs { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,.07); padding-bottom: 0; flex-wrap: wrap; }
    .tabs button {
      padding: 10px 18px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: rgba(255,255,255,.5);
      font-size: .9rem;
      cursor: pointer;
      transition: color .15s, border-color .15s;
      margin-bottom: -1px;
      font-weight: 600;
    }
    .tabs button.active { color: white; border-bottom-color: #D4001A; }
    .tabs button:hover { color: rgba(255,255,255,.85); }

    .loading { text-align: center; color: rgba(255,255,255,.45); padding: 40px 0; }
    .empty { text-align: center; color: rgba(255,255,255,.4); padding: 40px 0; font-size: .95rem; }
    .empty-sub { font-size: .8rem; color: rgba(255,255,255,.25); margin-top: 8px; }

    /* Leaderboard */
    .leaderboard { display: flex; flex-direction: column; gap: 8px; }
    .lb-row {
      display: flex; align-items: center; gap: 16px;
      background: #1a1a2e; padding: 14px 18px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,.06); transition: border-color .15s;
      cursor: pointer;
    }
    .lb-row.podium { border-left: 3px solid rgba(255,215,0,.4); }
    .lb-row.is-me { background: #1e2240; border-color: rgba(99,102,241,.4); }
    .lb-row:hover { border-color: rgba(255,255,255,.22); background: #1e1e34; }
    .lb-rank { width: 32px; text-align: center; font-size: 1rem; font-weight: 700; color: rgba(255,255,255,.4); }
    .lb-rank.gold { color: gold; }
    .lb-rank.silver { color: silver; }
    .lb-rank.bronze { color: #cd7f32; }
    .lb-username { flex: 1; font-size: .95rem; display: flex; align-items: center; gap: 8px; }
    .you-badge { font-size: .68rem; background: rgba(99,102,241,.3); color: #a5b4fc; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
    .lb-points { display: flex; align-items: baseline; gap: 3px; }
    .pts-value { font-size: 1.2rem; font-weight: 700; color: #4caf50; }
    .pts-label { font-size: .7rem; color: rgba(255,255,255,.4); }
    .lb-arrow { color: rgba(255,255,255,.2); font-size: 1.2rem; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.7);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;
    }
    .modal {
      background: #12121E; border: 1px solid rgba(255,255,255,.12); border-radius: 14px;
      width: 100%; max-width: 540px; max-height: 80vh; overflow-y: auto;
      padding: 24px;
    }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .modal-title { font-size: 1.2rem; font-weight: 700; }
    .modal-close { background: none; border: none; color: rgba(255,255,255,.5); font-size: 1.2rem; cursor: pointer; padding: 4px; }
    .modal-close:hover { color: white; }
    .modal-stat-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
    .modal-chip { display: flex; flex-direction: column; align-items: center; background: #1a1a2e; border: 1px solid rgba(255,255,255,.07); border-radius: 10px; padding: 10px 14px; min-width: 72px; }
    .modal-chip.good { border-color: rgba(76,175,80,.3); }
    .modal-chip.ok { border-color: rgba(255,202,40,.3); }
    .modal-chip.bad { border-color: rgba(229,57,53,.2); }
    .modal-chip-val { font-size: 1.3rem; font-weight: 700; }
    .modal-chip.good .modal-chip-val { color: #4caf50; }
    .modal-chip.ok .modal-chip-val { color: #ffca28; }
    .modal-chip.bad .modal-chip-val { color: rgba(255,255,255,.4); }
    .modal-chip-lbl { font-size: .65rem; color: rgba(255,255,255,.35); text-transform: uppercase; letter-spacing: .04em; margin-top: 2px; text-align: center; }
    .modal-loading { text-align: center; color: rgba(255,255,255,.4); padding: 24px; }
    .modal-empty { text-align: center; color: rgba(255,255,255,.3); padding: 24px; }
    .modal-preds { display: flex; flex-direction: column; gap: 8px; }
    .modal-pred-row { background: #1a1a2e; border-radius: 8px; padding: 12px 14px; border: 1px solid rgba(255,255,255,.05); }
    .modal-pred-match { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: .85rem; }
    .modal-team { font-weight: 600; }
    .modal-vs { font-size: .75rem; color: rgba(255,255,255,.3); }
    .modal-scores { display: flex; align-items: center; gap: 10px; }
    .modal-score-box { display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,.04); border-radius: 6px; padding: 6px 10px; }
    .modal-score-box.live { border: 1px solid rgba(212,0,26,.3); }
    .mslbl { font-size: .6rem; color: rgba(255,255,255,.35); text-transform: uppercase; letter-spacing: .04em; }
    .msval { font-size: .9rem; font-weight: 700; margin-top: 2px; }
    .modal-score-box.actual .msval { color: #C5E000; }
    .modal-score-box.live .msval { color: #D4001A; }
    .modal-pts { font-size: .85rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; background: rgba(255,255,255,.06); margin-left: auto; }
    .modal-pts.pts-3 { color: #4caf50; }
    .modal-pts.pts-1 { color: #ffca28; }
    .modal-pts.pts-0 { color: rgba(255,255,255,.3); }

    /* Predict tab */
    .date-section { margin-bottom: 28px; }
    .date-heading {
      font-size: .75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .1em; color: rgba(255,255,255,.35);
      margin-bottom: 10px; padding-bottom: 6px;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .predict-list { display: flex; flex-direction: column; gap: 8px; }
    .predict-row {
      background: #1a1a2e; border-radius: 10px; padding: 14px 16px;
      border: 1px solid rgba(255,255,255,.06);
      display: flex; flex-direction: column; gap: 12px;
      transition: border-color .15s;
    }
    .predict-row.is-predicted { border-color: rgba(197,224,0,.2); }
    .predict-row.is-knockout { border-left: 3px solid rgba(107,33,214,.5); }
    .predict-row:hover { border-color: rgba(255,255,255,.12); }

    .match-info { display: flex; align-items: center; gap: 8px; }
    .team { display: flex; align-items: center; gap: 6px; flex: 1; }
    .home-team { justify-content: flex-end; text-align: right; }
    .away-team { justify-content: flex-start; text-align: left; }
    .team-name { font-size: .9rem; font-weight: 600; }
    .flag { width: 24px; height: 16px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
    .match-meta { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 64px; flex-shrink: 0; }
    .kick-time { font-size: .8rem; color: rgba(255,255,255,.5); }
    .group-badge { font-size: .65rem; color: rgba(255,255,255,.25); letter-spacing: .04em; }
    .ko-badge { color: rgba(197,224,0,.5); }

    .predict-controls { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
    .score-input {
      width: 52px; height: 38px;
      background: #0f0f1a; border: 1px solid rgba(255,255,255,.15); border-radius: 6px;
      color: white; font-size: 1.1rem; font-weight: 700; text-align: center;
      outline: none; transition: border-color .15s;
    }
    .score-input:focus { border-color: #D4001A; }
    .score-sep { color: rgba(255,255,255,.3); font-weight: 700; font-size: 1rem; }

    .qualifier-picker { display: flex; align-items: center; gap: 6px; width: 100%; justify-content: center; margin-top: 4px; }
    .qualifier-label { font-size: .72rem; color: rgba(255,255,255,.4); text-transform: uppercase; letter-spacing: .05em; }
    .qual-btn {
      padding: 5px 12px; border-radius: 6px;
      background: rgba(107,33,214,.15); border: 1px solid rgba(107,33,214,.3);
      color: rgba(255,255,255,.6); font-size: .78rem; font-weight: 600;
      cursor: pointer; transition: all .15s;
    }
    .qual-btn:hover { background: rgba(107,33,214,.3); color: white; }
    .qual-btn.qual-active { background: rgba(107,33,214,.5); border-color: #6B21D6; color: white; }

    .btn-predict {
      margin-left: 8px; padding: 8px 18px;
      background: #D4001A; border: none; border-radius: 6px;
      color: white; font-size: .82rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em;
      cursor: pointer; transition: background .15s, opacity .15s;
      min-width: 90px;
    }
    .btn-predict:hover { background: #b80017; }
    .btn-predict.btn-update { background: rgba(197,224,0,.15); color: #C5E000; border: 1px solid rgba(197,224,0,.3); }
    .btn-predict.btn-update:hover { background: rgba(197,224,0,.25); }
    .btn-predict:disabled { opacity: .5; cursor: not-allowed; }
    .saving-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: white; animation: pulse .7s infinite alternate; }
    @keyframes pulse { from { opacity: .3; } to { opacity: 1; } }

    /* Stats chips */
    .pred-stats { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat-chip { display: flex; flex-direction: column; align-items: center; background: #1a1a2e; border-radius: 10px; padding: 12px 20px; border: 1px solid rgba(255,255,255,.07); min-width: 90px; }
    .stat-chip.good { border-color: rgba(76,175,80,.3); }
    .chip-value { font-size: 1.4rem; font-weight: 700; }
    .stat-chip.good .chip-value { color: #4caf50; }
    .chip-label { font-size: .7rem; color: rgba(255,255,255,.4); text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }

    /* Predictions list */
    .predictions-list { display: flex; flex-direction: column; gap: 8px; }
    .pred-row {
      background: #1a1a2e; border-radius: 10px; padding: 14px 18px;
      border: 1px solid rgba(255,255,255,.06);
      display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
    }
    .pred-row.pending { opacity: .8; }
    .pred-match { display: flex; align-items: center; gap: 8px; flex: 1; flex-wrap: wrap; min-width: 140px; }
    .pred-home, .pred-away { font-size: .9rem; }
    .pred-vs { font-size: .78rem; color: rgba(255,255,255,.3); }
    .pred-result { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .pred-score-box { display: flex; flex-direction: column; align-items: flex-end; }
    .actual-score-box { display: flex; flex-direction: column; align-items: center; background: rgba(197,224,0,.06); border: 1px solid rgba(197,224,0,.2); border-radius: 6px; padding: 4px 8px; }
    .actual-score-box.live-box { background: rgba(212,0,26,.07); border-color: rgba(212,0,26,.3); }
    .actual-val { color: #C5E000; }
    .actual-score-box.live-box .actual-val { color: #ff5a6e; }
    .pred-label { font-size: .68rem; color: rgba(255,255,255,.35); }
    .pred-value { font-size: .95rem; font-weight: 700; }
    .pred-qualifier { font-size: .7rem; color: rgba(107,33,214,.8); margin-top: 2px; }
    .points-box { display: flex; align-items: baseline; gap: 3px; min-width: 48px; justify-content: center; }
    .pts-big { font-size: 1.4rem; font-weight: 700; }
    .pts-small { font-size: .7rem; color: rgba(255,255,255,.4); }
    .points-box.pts-4 .pts-big { color: #C5E000; }
    .points-box.pts-3 .pts-big { color: #4caf50; }
    .points-box.pts-1 .pts-big { color: #ffca28; }
    .points-box.pts-0 .pts-big { color: rgba(255,255,255,.3); }
    .pending-box { font-size: .78rem; color: rgba(255,255,255,.4); text-align: right; min-width: 90px; }

    /* Stats tab */
    .stats-section { margin-bottom: 32px; }
    .stats-title { font-size: .85rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.5); margin-bottom: 14px; }
    .bar-chart { display: flex; flex-direction: column; gap: 8px; }
    .bar-row { display: flex; align-items: center; gap: 10px; }
    .bar-label { font-size: .82rem; min-width: 100px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; color: rgba(255,255,255,.7); }
    .bar-track { flex: 1; background: rgba(255,255,255,.06); border-radius: 4px; height: 10px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width .4s ease; min-width: 2px; }
    .bar-fill.exact { background: linear-gradient(90deg, #4caf50, #81c784); }
    .bar-fill.correct { background: linear-gradient(90deg, #ffca28, #ffe082); }
    .bar-fill.points { background: linear-gradient(90deg, #D4001A, #ff5a6e); }
    .bar-val { font-size: .8rem; font-weight: 700; color: rgba(255,255,255,.6); min-width: 28px; text-align: right; }

    /* Evolution table */
    .evolution-table-wrap { overflow-x: auto; }
    .evo-table { border-collapse: collapse; min-width: 100%; }
    .evo-table th { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: rgba(255,255,255,.35); padding: 6px 10px; background: rgba(255,255,255,.03); text-align: center; white-space: nowrap; }
    .evo-table th.evo-user-col { text-align: left; min-width: 100px; }
    .evo-table td { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,.04); font-size: .85rem; text-align: center; }
    .evo-user-cell { text-align: left; font-weight: 600; color: rgba(255,255,255,.8); }
    .evo-pts-cell { font-weight: 700; color: #4caf50; }
    .evo-table tr:last-child td { border-bottom: none; }
  `]
})
export class GroupDetail implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  groupId = '';
  tab = signal<'leaderboard' | 'predict' | 'predictions' | 'stats'>('leaderboard');

  leaderboard = signal<Leaderboard | null>(null);
  loadingLeaderboard = signal(true);

  predictions = signal<Prediction[]>([]);
  loadingPredictions = signal(true);

  fixture = signal<Match[]>([]);
  loadingFixture = signal(false);
  fixtureLoaded = signal(false);
  drafts = signal<Record<string, { home: number; away: number; qualifier?: string }>>({});
  existingPreds = signal<Record<string, string>>({});
  savingMatch = signal<string | null>(null);
  toast = signal<{ msg: string; type: 'ok' | 'err' } | null>(null);

  // Stats tab
  groupStats = signal<GroupStats | null>(null);
  loadingStats = signal(false);

  // Member modal
  selectedMember = signal<UserStats | null>(null);
  memberPredictions = signal<Prediction[]>([]);
  loadingMemberPreds = signal(false);

  readonly currentUserId = computed(() => this.auth.user()?.userId ?? '');
  readonly totalPredictions = computed(() => this.predictions().length);
  readonly scoredPredictions = computed(() => this.predictions().filter(p => p.isScored).length);
  readonly totalPoints = computed(() =>
    this.predictions().filter(p => p.isScored).reduce((acc, p) => acc + (p.pointsEarned ?? 0), 0)
  );

  readonly maxExact = computed(() => Math.max(1, ...( this.groupStats()?.userStats.map(u => u.exactPredictions) ?? [1])));
  readonly maxCorrect = computed(() => Math.max(1, ...( this.groupStats()?.userStats.map(u => u.correctOutcomes) ?? [1])));
  readonly maxPoints = computed(() => Math.max(1, ...( this.groupStats()?.userStats.map(u => u.totalPoints) ?? [1])));

  readonly predictableMatches = computed(() => {
    const now = new Date();
    return this.fixture().filter(m => m.status === 'Scheduled' && new Date(m.kickoffUtc) > now);
  });

  readonly matchesByDate = computed(() => {
    const groups: Record<string, Match[]> = {};
    for (const m of this.predictableMatches()) {
      const key = toArgDateKey(m.kickoffUtc);
      (groups[key] ??= []).push(m);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  });

  ngOnInit() {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    this.loadLeaderboard();
    this.loadPredictions();
  }

  setTab(tab: 'leaderboard' | 'predict' | 'predictions' | 'stats') {
    this.tab.set(tab);
    if (tab === 'predict' && !this.fixtureLoaded()) {
      this.loadFixture();
    }
    if (tab === 'stats' && !this.groupStats()) {
      this.loadStats();
    }
  }

  openMemberModal(userId: string, username: string) {
    const stats = this.groupStats()?.userStats.find(u => u.userId === userId);
    if (stats) {
      this.selectedMember.set(stats);
    } else {
      this.selectedMember.set({
        userId, username,
        totalPredictions: 0, exactPredictions: 0,
        correctOutcomes: 0, wrongPredictions: 0, totalPoints: 0
      });
    }
    this.loadMemberPredictions(userId);
  }

  closeMemberModal() {
    this.selectedMember.set(null);
    this.memberPredictions.set([]);
  }

  private loadMemberPredictions(userId: string) {
    this.loadingMemberPreds.set(true);
    this.api.getMemberPredictions(this.groupId, userId).subscribe({
      next: preds => {
        this.memberPredictions.set(preds);
        this.loadingMemberPreds.set(false);
      },
      error: () => this.loadingMemberPreds.set(false)
    });
  }

  private loadLeaderboard() {
    this.api.getLeaderboard(this.groupId).subscribe({
      next: l => { this.leaderboard.set(l); this.loadingLeaderboard.set(false); },
      error: () => this.loadingLeaderboard.set(false)
    });
  }

  private loadPredictions() {
    this.api.getMyPredictions(this.groupId).subscribe({
      next: p => {
        this.predictions.set(p);
        this.loadingPredictions.set(false);
        this.syncDraftsFromPredictions(p);
      },
      error: () => this.loadingPredictions.set(false)
    });
  }

  private loadStats() {
    this.loadingStats.set(true);
    this.api.getGroupStats(this.groupId).subscribe({
      next: s => { this.groupStats.set(s); this.loadingStats.set(false); },
      error: () => this.loadingStats.set(false)
    });
  }

  private syncDraftsFromPredictions(preds: Prediction[]) {
    const existing: Record<string, string> = {};
    this.drafts.update(d => {
      const updated = { ...d };
      for (const p of preds) {
        existing[p.matchId] = p.id;
        updated[p.matchId] = {
          home: p.predictedHome,
          away: p.predictedAway,
          qualifier: p.predictedQualifier
        };
      }
      return updated;
    });
    this.existingPreds.set(existing);
  }

  private loadFixture() {
    this.loadingFixture.set(true);
    this.api.getFixture().subscribe({
      next: matches => {
        this.fixture.set(matches);
        this.drafts.update(d => {
          const updated = { ...d };
          for (const m of matches) {
            if (!updated[m.id]) updated[m.id] = { home: 0, away: 0 };
          }
          return updated;
        });
        this.loadingFixture.set(false);
        this.fixtureLoaded.set(true);
      },
      error: () => { this.loadingFixture.set(false); this.fixtureLoaded.set(true); }
    });
  }

  getDraft(matchId: string) {
    return this.drafts()[matchId] ?? { home: 0, away: 0 };
  }

  setDraftHome(matchId: string, val: number) {
    const home = Math.max(0, val || 0);
    this.drafts.update(d => {
      const current = d[matchId] ?? { home: 0, away: 0 };
      const qualifier = home === current.away ? current.qualifier : undefined;
      return { ...d, [matchId]: { ...current, home, qualifier } };
    });
  }

  setDraftAway(matchId: string, val: number) {
    const away = Math.max(0, val || 0);
    this.drafts.update(d => {
      const current = d[matchId] ?? { home: 0, away: 0 };
      const qualifier = current.home === away ? current.qualifier : undefined;
      return { ...d, [matchId]: { ...current, away, qualifier } };
    });
  }

  setDraftQualifier(matchId: string, qualifier: string | undefined) {
    this.drafts.update(d => ({ ...d, [matchId]: { ...d[matchId], qualifier } }));
  }

  isKnockoutMatch(match: Match): boolean {
    return isKnockout(match.stage);
  }

  argTime(utcStr: string): string {
    return formatArgTime(utcStr);
  }

  argDateTime(utcStr: string): string {
    const d = toArgDate(utcStr);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const h = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month} ${h}:${min}`;
  }

  barPct(val: number, max: number): string {
    if (max <= 0) return '0%';
    return Math.round((val / max) * 100) + '%';
  }

  formatEvoDate(dateStr: string): string {
    const [, m, d] = dateStr.split('-').map(Number);
    const months = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d} ${months[m]}`;
  }

  savePrediction(matchId: string) {
    const draft = this.getDraft(matchId);
    const existingId = this.existingPreds()[matchId];
    this.savingMatch.set(matchId);

    const obs = existingId
      ? this.api.updatePrediction(existingId, draft.home, draft.away, draft.qualifier)
      : this.api.createPrediction(matchId, this.groupId, draft.home, draft.away, draft.qualifier);

    obs.subscribe({
      next: (result: any) => {
        if (!existingId && result?.id) {
          this.existingPreds.update(e => ({ ...e, [matchId]: result.id }));
        }
        this.savingMatch.set(null);
        this.showToast('Prediccion guardada', 'ok');
        this.loadPredictions();
      },
      error: (err: any) => {
        this.savingMatch.set(null);
        const msg = err?.error?.detail ?? err?.error?.message ?? 'Error al guardar';
        this.showToast(msg, 'err');
      }
    });
  }

  isPredicted(matchId: string) {
    return !!this.existingPreds()[matchId];
  }

  formatDateKey(key: string): string {
    const [year, month, day] = key.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[d.getDay()]} ${day} ${months[month - 1]} ${year}`;
  }

  private showToast(msg: string, type: 'ok' | 'err') {
    this.toast.set({ msg, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
