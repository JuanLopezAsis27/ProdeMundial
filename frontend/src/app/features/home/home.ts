import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { MatchHubService } from '../../core/signalr/match-hub.service';
import { Match } from '../../core/models/match.model';

const ARG_TZ = 'America/Argentina/Buenos_Aires';

// Returns YYYY-MM-DD in Argentine timezone (UTC-3, no DST)
function toArgDateStr(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const shifted = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Returns today's date as Argentine date string
function todayArgStr(): string {
  return toArgDateStr(new Date());
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Partidos</h1>
      </div>

      <!-- Date navigator -->
      <div class="date-nav">
        <button class="nav-btn" (click)="prevDay()" title="Día anterior">&#8592;</button>
        <div class="date-center">
          <span class="date-display">{{ selectedDate() | date:'EEEE d MMMM yyyy':ARG_TZ }}</span>
          @if (!isToday()) {
            <button class="today-btn" (click)="goToday()">Hoy</button>
          }
        </div>
        <button class="nav-btn" (click)="nextDay()" title="Día siguiente">&#8594;</button>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <span>Cargando partidos...</span>
        </div>
      } @else if (loadError()) {
        <div class="error-banner">{{ loadError() }}</div>
      } @else if (liveMatches().length === 0 && scheduledMatches().length === 0 && finishedMatches().length === 0) {
        <div class="empty">No hay partidos para este día.</div>
      } @else {
        @if (liveMatches().length > 0) {
          <section class="section">
            <h2 class="section-title live-title">En Vivo</h2>
            <div class="matches-grid">
              @for (match of liveMatches(); track match.id) {
                <div class="match-card live">
                  <div class="live-badge">EN VIVO{{ match.minute ? " · " + match.minute + "'" : "" }}</div>
                  <div class="match-stage">{{ match.groupName ? "Grupo " + match.groupName : match.stage }}</div>
                  <div class="teams">
                    <div class="team">
                      @if (match.homeFlagUrl) {
                        <img [src]="match.homeFlagUrl" [alt]="match.homeTeam" class="flag">
                      }
                      <span class="team-name">{{ match.homeTeam }}</span>
                    </div>
                    <div class="score live-score">{{ match.homeGoals }} - {{ match.awayGoals }}</div>
                    <div class="team">
                      @if (match.awayFlagUrl) {
                        <img [src]="match.awayFlagUrl" [alt]="match.awayTeam" class="flag">
                      }
                      <span class="team-name">{{ match.awayTeam }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }

        @if (scheduledMatches().length > 0) {
          <section class="section">
            <h2 class="section-title">Próximos</h2>
            <div class="matches-grid">
              @for (match of scheduledMatches(); track match.id) {
                <div class="match-card">
                  <div class="match-stage">{{ match.groupName ? "Grupo " + match.groupName : match.stage }}</div>
                  <div class="teams">
                    <div class="team">
                      @if (match.homeFlagUrl) {
                        <img [src]="match.homeFlagUrl" [alt]="match.homeTeam" class="flag">
                      }
                      <span class="team-name">{{ match.homeTeam }}</span>
                    </div>
                    <div class="score">
                      <span class="kickoff-time">{{ match.kickoffUtc | date:'HH:mm':ARG_TZ }}</span>
                    </div>
                    <div class="team">
                      @if (match.awayFlagUrl) {
                        <img [src]="match.awayFlagUrl" [alt]="match.awayTeam" class="flag">
                      }
                      <span class="team-name">{{ match.awayTeam }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }

        @if (finishedMatches().length > 0) {
          <section class="section">
            <h2 class="section-title">Resultados</h2>
            <div class="matches-grid">
              @for (match of finishedMatches(); track match.id) {
                <div class="match-card finished">
                  <div class="finished-badge">Finalizado</div>
                  <div class="match-stage">{{ match.groupName ? "Grupo " + match.groupName : match.stage }}</div>
                  <div class="teams">
                    <div class="team" [class.winner]="match.qualifierTeam === 'home' || (!match.qualifierTeam && match.homeGoals > match.awayGoals)">
                      @if (match.homeFlagUrl) {
                        <img [src]="match.homeFlagUrl" [alt]="match.homeTeam" class="flag">
                      }
                      <span class="team-name">{{ match.homeTeam }}</span>
                    </div>
                    <div class="score-block">
                      <div class="score">{{ match.homeGoals }} - {{ match.awayGoals }}</div>
                      @if (match.homePenalties != null && match.awayPenalties != null) {
                        <div class="penalties-line">Pen: {{ match.homePenalties }} - {{ match.awayPenalties }}</div>
                      }
                    </div>
                    <div class="team" [class.winner]="match.qualifierTeam === 'away' || (!match.qualifierTeam && match.awayGoals > match.homeGoals)">
                      @if (match.awayFlagUrl) {
                        <img [src]="match.awayFlagUrl" [alt]="match.awayTeam" class="flag">
                      }
                      <span class="team-name">{{ match.awayTeam }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 960px; margin: 0 auto; color: white; }
    .page-header { margin-bottom: 20px; }
    .page-title { font-size: 2rem; font-weight: 900; }

    /* Date nav */
    .date-nav {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
      background: #1A1A28;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 12px;
      padding: 10px 16px;
    }

    .nav-btn {
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background .15s;
    }
    .nav-btn:hover { background: rgba(255,255,255,.15); }

    .date-center {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .date-display {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      text-transform: capitalize;
      letter-spacing: .03em;
    }

    .today-btn {
      background: rgba(212,0,26,.15);
      border: 1px solid rgba(212,0,26,.35);
      color: #D4001A;
      padding: 3px 12px;
      border-radius: 100px;
      font-size: .78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      cursor: pointer;
      transition: background .15s;
    }
    .today-btn:hover { background: rgba(212,0,26,.25); }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 60px 0;
      color: rgba(255,255,255,.55);
    }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid rgba(255,255,255,.1);
      border-top-color: #D4001A;
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty { text-align: center; color: rgba(255,255,255,.45); padding: 60px 0; font-size: 1.05rem; }
    .error-banner { background: rgba(212,0,26,.15); border: 1px solid rgba(212,0,26,.4); color: #ff6b6b; padding: 14px 18px; border-radius: 10px; font-size: .9rem; margin-bottom: 20px; word-break: break-all; }

    .section { margin-bottom: 36px; }
    .section-title {
      font-size: 1rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: rgba(255,255,255,.5);
      margin-bottom: 14px;
    }
    .live-title { color: #D4001A; }

    .matches-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }

    .match-card {
      background: #1A1A28;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid rgba(255,255,255,.07);
      transition: border-color .15s;
    }
    .match-card:hover { border-color: rgba(255,255,255,.18); }
    .match-card.live { border-color: rgba(212,0,26,.5); }
    .match-card.finished { opacity: .85; }

    .live-badge {
      font-size: .72rem;
      font-weight: 700;
      color: #D4001A;
      letter-spacing: .05em;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .finished-badge {
      font-size: .72rem;
      color: rgba(255,255,255,.35);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: .05em;
    }
    .match-stage {
      font-size: .75rem;
      color: rgba(255,255,255,.4);
      margin-bottom: 14px;
    }

    .teams { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .team {
      display: flex; flex-direction: column; align-items: center;
      gap: 6px; flex: 1; text-align: center;
    }
    .team.winner .team-name { color: #C5E000; font-weight: 600; }
    .flag { width: 36px; height: 26px; object-fit: cover; border-radius: 3px; }
    .team-name { font-size: .85rem; line-height: 1.2; }
    .score { font-size: 1.5rem; font-weight: 700; min-width: 70px; text-align: center; }
    .live-score { color: #D4001A; }
    .kickoff-time { font-size: 1rem; color: rgba(255,255,255,.6); font-weight: 500; }
    .score-block { display: flex; flex-direction: column; align-items: center; min-width: 70px; }
    .penalties-line { font-size: .7rem; color: rgba(197,224,0,.7); font-weight: 600; margin-top: 2px; letter-spacing: .03em; }
  `]
})
export class Home implements OnInit, OnDestroy {
  readonly ARG_TZ = ARG_TZ;

  private readonly api = inject(ApiService);
  private readonly hub = inject(MatchHubService);

  private readonly _allMatches = signal<Match[]>([]);
  readonly selectedDate = signal<Date>(new Date());
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  private subs = new Subscription();

  private readonly matchesForDate = computed(() => {
    const dateStr = toArgDateStr(this.selectedDate());
    return this._allMatches().filter(m => toArgDateStr(m.kickoffUtc) === dateStr);
  });

  readonly liveMatches = computed(() => this._allMatches().filter(m => m.status === 'InProgress'));
  readonly scheduledMatches = computed(() => this.matchesForDate().filter(m => m.status === 'Scheduled'));
  readonly finishedMatches = computed(() => this.matchesForDate().filter(m => m.status === 'Finished'));

  isToday(): boolean {
    return toArgDateStr(this.selectedDate()) === todayArgStr();
  }

  prevDay() {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.selectedDate.set(d);
  }

  nextDay() {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.selectedDate.set(d);
  }

  goToday() {
    this.selectedDate.set(new Date());
  }

  ngOnInit() {
    this.api.getFixture().subscribe({
      next: (matches) => {
        console.log('[Home] Fixture cargado:', matches.length, 'partidos');
        this._allMatches.set(matches);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[Home] Error cargando fixture:', err);
        this.loadError.set(`Error al cargar partidos: ${err?.status ?? ''} ${err?.message ?? JSON.stringify(err)}`);
        this.loading.set(false);
      }
    });

    this.hub.start().catch(err => console.warn('[Home] SignalR connect error:', err));

    this.subs.add(
      this.hub.matchUpdates$.subscribe(update => {
        console.log('[Home] SignalR matchUpdate → aplicando a _allMatches. matchId:', update.matchId);
        this._allMatches.update(list => list.map(m =>
          m.id === update.matchId
            ? { ...m, homeGoals: update.homeGoals, awayGoals: update.awayGoals, minute: update.minute, status: 'InProgress' as const }
            : m
        ));
        console.log('[Home] liveMatches tras update:', this.liveMatches().length);
      })
    );

    this.subs.add(
      this.hub.matchFinished$.subscribe(update => {
        console.log('[Home] SignalR matchFinished → matchId:', update.matchId);
        this._allMatches.update(list => list.map(m =>
          m.id === update.matchId
            ? { ...m, homeGoals: update.homeGoals, awayGoals: update.awayGoals, status: 'Finished' as const }
            : m
        ));
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
