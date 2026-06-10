import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api/api.service';
import { Match } from '../../../core/models/match.model';

type StageGroup = { name: string; matches: Match[] };

@Component({
  selector: 'app-fixture',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Fixture — Mundial 2026</h1>
        <div class="filter-bar">
          <input
            type="text"
            [(ngModel)]="searchTerm"
            placeholder="Buscar equipo..."
            class="search-input"
          />
          <select [(ngModel)]="statusFilter" class="select-filter">
            <option value="">Todos</option>
            <option value="Scheduled">Proximos</option>
            <option value="InProgress">En vivo</option>
            <option value="Finished">Finalizados</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <span>Cargando fixture...</span>
        </div>
      } @else if (filteredStages().length === 0) {
        <div class="empty">No se encontraron partidos.</div>
      } @else {
        @for (stage of filteredStages(); track stage.name) {
          <section class="stage-section">
            <h2 class="stage-title">{{ stage.name }}</h2>
            <div class="matches-list">
              @for (match of stage.matches; track match.id) {
                <div class="match-row"
                  [class.live]="match.status === 'InProgress'"
                  [class.finished]="match.status === 'Finished'">
                  <div class="match-datetime">
                    <span class="match-date">{{ match.kickoffUtc | date:'dd/MM' }}</span>
                    <span class="match-time">{{ match.kickoffUtc | date:'HH:mm' }}</span>
                  </div>
                  <div class="match-teams">
                    <span class="team-name" [class.winner]="isHomeWinner(match)">{{ match.homeTeam }}</span>
                    <span class="match-score">
                      @if (match.status === 'Scheduled') {
                        <span class="vs">vs</span>
                      } @else {
                        <span [class.live-score]="match.status === 'InProgress'">
                          {{ match.homeGoals }} - {{ match.awayGoals }}
                        </span>
                      }
                    </span>
                    <span class="team-name right" [class.winner]="isAwayWinner(match)">{{ match.awayTeam }}</span>
                  </div>
                  <div class="match-status-badge">
                    @if (match.status === 'InProgress') {
                      <span class="badge-live">EN VIVO{{ match.minute ? " " + match.minute + "'" : "" }}</span>
                    } @else if (match.status === 'Finished') {
                      <span class="badge-finished">FIN</span>
                    } @else {
                      <span class="badge-group">{{ match.groupName ? "Gr. " + match.groupName : "" }}</span>
                    }
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
    .page-header { margin-bottom: 28px; }
    .page-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 16px; }

    .filter-bar { display: flex; gap: 12px; flex-wrap: wrap; }
    .search-input, .select-filter {
      padding: 8px 14px;
      background: #1a1a2e;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 8px;
      color: white;
      font-size: .9rem;
    }
    .search-input { flex: 1; min-width: 200px; }
    .search-input:focus, .select-filter:focus { outline: none; border-color: #e63946; }
    .select-filter option { background: #1a1a2e; }

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
      border-top-color: #e63946;
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty { text-align: center; color: rgba(255,255,255,.45); padding: 60px 0; }

    .stage-section { margin-bottom: 36px; }
    .stage-title {
      font-size: .85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .1em;
      color: #e63946;
      border-bottom: 1px solid rgba(255,255,255,.07);
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .matches-list { display: flex; flex-direction: column; gap: 6px; }
    .match-row {
      display: grid;
      grid-template-columns: 72px 1fr 80px;
      align-items: center;
      gap: 12px;
      background: #1a1a2e;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,.05);
      transition: border-color .15s;
    }
    .match-row:hover { border-color: rgba(255,255,255,.15); }
    .match-row.live { border-color: rgba(230,57,70,.4); }
    .match-row.finished { opacity: .8; }

    .match-datetime { display: flex; flex-direction: column; gap: 2px; }
    .match-date { font-size: .78rem; color: rgba(255,255,255,.45); }
    .match-time { font-size: .88rem; font-weight: 600; color: rgba(255,255,255,.75); }

    .match-teams {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 10px;
    }
    .team-name { font-size: .88rem; }
    .team-name.right { text-align: right; }
    .team-name.winner { color: #4caf50; font-weight: 600; }
    .match-score { font-weight: 700; min-width: 60px; text-align: center; font-size: 1rem; }
    .live-score { color: #e63946; }
    .vs { color: rgba(255,255,255,.35); font-size: .85rem; }

    .match-status-badge { text-align: right; }
    .badge-live { font-size: .7rem; font-weight: 700; color: #e63946; text-transform: uppercase; letter-spacing: .05em; }
    .badge-finished { font-size: .7rem; color: rgba(255,255,255,.3); text-transform: uppercase; letter-spacing: .05em; }
    .badge-group { font-size: .7rem; color: rgba(255,255,255,.3); }
  `]
})
export class Fixture implements OnInit {
  private readonly api = inject(ApiService);

  loading = signal(true);
  searchTerm = '';
  statusFilter = '';

  private allStages = signal<StageGroup[]>([]);

  readonly filteredStages = computed(() => {
    const term = this.searchTerm.toLowerCase();
    const status = this.statusFilter;
    return this.allStages()
      .map(stage => ({
        ...stage,
        matches: stage.matches.filter(m => {
          const matchesSearch = !term ||
            m.homeTeam.toLowerCase().includes(term) ||
            m.awayTeam.toLowerCase().includes(term);
          const matchesStatus = !status || m.status === status;
          return matchesSearch && matchesStatus;
        })
      }))
      .filter(stage => stage.matches.length > 0);
  });

  ngOnInit() {
    this.api.getFixture().subscribe({
      next: (matches) => {
        const stageOrder = [
          'Fase de Grupos',
          'Round of 32',
          'Round of 16',
          'Cuartos de Final',
          'Semifinal',
          'Tercer Puesto',
          'Final'
        ];

        const stageMap = new Map<string, Match[]>();
        for (const match of matches) {
          const key = match.groupName
            ? `Fase de Grupos — Grupo ${match.groupName}`
            : match.stage;
          if (!stageMap.has(key)) stageMap.set(key, []);
          stageMap.get(key)!.push(match);
        }

        const stages: StageGroup[] = [...stageMap.entries()].map(([name, m]) => ({
          name,
          matches: m.sort((a, b) => new Date(a.kickoffUtc).getTime() - new Date(b.kickoffUtc).getTime())
        }));

        this.allStages.set(stages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  isHomeWinner(match: Match): boolean {
    return match.status === 'Finished' && match.homeGoals > match.awayGoals;
  }

  isAwayWinner(match: Match): boolean {
    return match.status === 'Finished' && match.awayGoals > match.homeGoals;
  }
}
