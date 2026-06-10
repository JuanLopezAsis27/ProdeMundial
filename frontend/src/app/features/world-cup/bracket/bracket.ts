import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { Match } from '../../../core/models/match.model';

const KNOCKOUT_STAGES = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Third Place', 'Final'];

@Component({
  selector: 'app-bracket',
  standalone: true,
  template: `
    <div class="bk-outer">
      @if (loading()) {
        <div class="bk-loading">
          <div class="spinner"></div>
          <span>Cargando bracket...</span>
        </div>
      } @else if (matchBySlot().size === 0) {
        <div class="bk-empty">Las eliminatorias comienzan cuando termina la fase de grupos.</div>
      } @else {
        <div class="bk-wrap">

          <!-- LEFT HALF -->
          <div class="bk-half bk-left">
            <div class="bk-col bk-teams-col">
              @for (slot of ['P74','P77','P73','P75','P83','P84','P81','P82']; track slot) {
                <div class="bk-r32e">
                  <div class="bk-r32m">
                    <div class="bk-team" [class.bk-w]="isWin(slot,'home')" [class.bk-l]="isLoss(slot,'home')">
                      @if (get(slot)?.homeFlagUrl) { <img [src]="get(slot)!.homeFlagUrl!" class="tk-flag"> }
                      <span class="tk-name">{{ get(slot)?.homeTeam ?? '—' }}</span>
                      @if (get(slot)?.status !== 'Scheduled' && get(slot)?.status) {
                        <span class="tk-sc">{{ get(slot)?.homeGoals }}</span>
                      }
                    </div>
                    <div class="bk-team" [class.bk-w]="isWin(slot,'away')" [class.bk-l]="isLoss(slot,'away')">
                      @if (get(slot)?.awayFlagUrl) { <img [src]="get(slot)!.awayFlagUrl!" class="tk-flag"> }
                      <span class="tk-name">{{ get(slot)?.awayTeam ?? '—' }}</span>
                      @if (get(slot)?.status !== 'Scheduled' && get(slot)?.status) {
                        <span class="tk-sc">{{ get(slot)?.awayGoals }}</span>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
            <div class="bk-col">
              @for (pair of [['P74','P77'],['P73','P75'],['P83','P84'],['P81','P82']]; track pair[0]) {
                <div class="bk-pair">
                  @for (s of pair; track s) {
                    <div class="bk-entry">
                      <div class="bk-box" [class.bk-done]="!!winner(s)">
                        @if (winnerFlag(s)) { <img [src]="winnerFlag(s)!" class="bk-box-flag"> }
                        {{ winner(s) || (get(s) ? '···' : s) }}
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
            <div class="bk-col">
              @for (pair of [['P89','P90'],['P93','P94']]; track pair[0]) {
                <div class="bk-pair">
                  @for (s of pair; track s) {
                    <div class="bk-entry">
                      <div class="bk-box" [class.bk-done]="!!winner(s)">
                        @if (winnerFlag(s)) { <img [src]="winnerFlag(s)!" class="bk-box-flag"> }
                        {{ winner(s) || (get(s) ? '···' : s) }}
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
            <div class="bk-col">
              <div class="bk-pair">
                @for (s of ['P97','P98']; track s) {
                  <div class="bk-entry">
                    <div class="bk-box" [class.bk-done]="!!winner(s)">
                      @if (winnerFlag(s)) { <img [src]="winnerFlag(s)!" class="bk-box-flag"> }
                      {{ winner(s) || (get(s) ? '···' : s) }}
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="bk-col bk-sf-col">
              <div class="bk-entry">
                <div class="bk-box bk-sf-box" [class.bk-done]="!!winner('P101')">
                  @if (winnerFlag('P101')) { <img [src]="winnerFlag('P101')!" class="bk-box-flag"> }
                  {{ winner('P101') || (get('P101') ? '···' : 'P101') }}
                </div>
              </div>
            </div>
          </div>

          <!-- CENTER -->
          <div class="bk-center">
            <div class="bk-trophy-area">
              <div class="bk-trophy-icon">🏆</div>
              <div class="bk-champ-label">CAMPEÓN</div>
              @if (winner('P104')) {
                <div class="bk-champ-name">{{ winner('P104') }}</div>
              }
            </div>
            <div class="bk-final-row">
              <div class="bk-final-sf" [class.bk-done]="!!winner('P101')">
                @if (winnerFlag('P101')) { <img [src]="winnerFlag('P101')!" class="bk-box-flag"> }
                {{ winner('P101') || (get('P101') ? '···' : 'P101') }}
              </div>
              <div class="bk-final-vs">
                FINAL
                @if (get('P104') && get('P104')!.status !== 'Scheduled') {
                  <br><span class="bk-final-score">{{ get('P104')!.homeGoals }}-{{ get('P104')!.awayGoals }}</span>
                }
              </div>
              <div class="bk-final-sf" [class.bk-done]="!!winner('P102')">
                @if (winnerFlag('P102')) { <img [src]="winnerFlag('P102')!" class="bk-box-flag"> }
                {{ winner('P102') || (get('P102') ? '···' : 'P102') }}
              </div>
            </div>
            <div class="bk-third-area">
              <div class="bk-third-lbl">3° Lugar</div>
              <div class="bk-third-row">
                @if (get('P103')?.homeFlagUrl) { <img [src]="get('P103')!.homeFlagUrl!" class="bk-box-flag"> }
                <span>{{ get('P103')?.homeTeam ?? '—' }}</span>
                @if (get('P103') && get('P103')!.status !== 'Scheduled') {
                  <span class="bk-third-sc">{{ get('P103')!.homeGoals }}-{{ get('P103')!.awayGoals }}</span>
                } @else {
                  <span class="bk-third-vs">vs</span>
                }
                <span>{{ get('P103')?.awayTeam ?? '—' }}</span>
                @if (get('P103')?.awayFlagUrl) { <img [src]="get('P103')!.awayFlagUrl!" class="bk-box-flag"> }
              </div>
              @if (winner('P103')) { <div class="bk-third-winner">3° {{ winner('P103') }}</div> }
            </div>
          </div>

          <!-- RIGHT HALF -->
          <div class="bk-half bk-right">
            <div class="bk-col bk-sf-col">
              <div class="bk-entry">
                <div class="bk-box bk-sf-box" [class.bk-done]="!!winner('P102')">
                  @if (winnerFlag('P102')) { <img [src]="winnerFlag('P102')!" class="bk-box-flag"> }
                  {{ winner('P102') || (get('P102') ? '···' : 'P102') }}
                </div>
              </div>
            </div>
            <div class="bk-col">
              <div class="bk-pair">
                @for (s of ['P99','P100']; track s) {
                  <div class="bk-entry">
                    <div class="bk-box" [class.bk-done]="!!winner(s)">
                      @if (winnerFlag(s)) { <img [src]="winnerFlag(s)!" class="bk-box-flag"> }
                      {{ winner(s) || (get(s) ? '···' : s) }}
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="bk-col">
              @for (pair of [['P91','P92'],['P95','P96']]; track pair[0]) {
                <div class="bk-pair">
                  @for (s of pair; track s) {
                    <div class="bk-entry">
                      <div class="bk-box" [class.bk-done]="!!winner(s)">
                        @if (winnerFlag(s)) { <img [src]="winnerFlag(s)!" class="bk-box-flag"> }
                        {{ winner(s) || (get(s) ? '···' : s) }}
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
            <div class="bk-col">
              @for (pair of [['P76','P78'],['P79','P80'],['P86','P88'],['P85','P87']]; track pair[0]) {
                <div class="bk-pair">
                  @for (s of pair; track s) {
                    <div class="bk-entry">
                      <div class="bk-box" [class.bk-done]="!!winner(s)">
                        @if (winnerFlag(s)) { <img [src]="winnerFlag(s)!" class="bk-box-flag"> }
                        {{ winner(s) || (get(s) ? '···' : s) }}
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
            <div class="bk-col bk-teams-col">
              @for (slot of ['P76','P78','P79','P80','P86','P88','P85','P87']; track slot) {
                <div class="bk-r32e">
                  <div class="bk-r32m">
                    <div class="bk-team" [class.bk-w]="isWin(slot,'home')" [class.bk-l]="isLoss(slot,'home')">
                      @if (get(slot)?.status !== 'Scheduled' && get(slot)?.status) {
                        <span class="tk-sc">{{ get(slot)?.homeGoals }}</span>
                      }
                      <span class="tk-name">{{ get(slot)?.homeTeam ?? '—' }}</span>
                      @if (get(slot)?.homeFlagUrl) { <img [src]="get(slot)!.homeFlagUrl!" class="tk-flag"> }
                    </div>
                    <div class="bk-team" [class.bk-w]="isWin(slot,'away')" [class.bk-l]="isLoss(slot,'away')">
                      @if (get(slot)?.status !== 'Scheduled' && get(slot)?.status) {
                        <span class="tk-sc">{{ get(slot)?.awayGoals }}</span>
                      }
                      <span class="tk-name">{{ get(slot)?.awayTeam ?? '—' }}</span>
                      @if (get(slot)?.awayFlagUrl) { <img [src]="get(slot)!.awayFlagUrl!" class="tk-flag"> }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .bk-outer { color: white; }
    .bk-loading { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px 0; color:rgba(255,255,255,.5); }
    .spinner { width:32px; height:32px; border:3px solid rgba(255,255,255,.1); border-top-color:#D4001A; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .bk-empty { text-align:center; color:rgba(255,255,255,.4); padding:60px 0; }

    .bk-wrap { display:flex; align-items:stretch; gap:8px; overflow-x:auto; padding:16px 8px; min-height:640px; background:#090912; border-radius:12px; border:1px solid rgba(255,255,255,.05); }
    .bk-half { display:flex; align-items:stretch; flex:1; gap:8px; min-width:0; }
    .bk-col { display:flex; flex-direction:column; flex:1; min-width:66px; max-width:100px; }
    .bk-teams-col { min-width:96px; max-width:118px; }
    .bk-sf-col { max-width:82px; }
    .bk-pair { flex:1; display:flex; flex-direction:column; position:relative; }
    .bk-entry { flex:1; display:flex; align-items:center; position:relative; padding:3px 0; }
    .bk-r32e { flex:1; display:flex; align-items:center; position:relative; padding:2px 0; }
    .bk-r32m { width:100%; display:flex; flex-direction:column; gap:2px; }

    .bk-box { width:100%; padding:5px 7px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:6px; font-size:.68rem; font-weight:600; color:rgba(255,255,255,.45); text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; justify-content:center; gap:4px; }
    .bk-box.bk-done { background:rgba(197,224,0,.13); border-color:rgba(197,224,0,.4); color:#C5E000; font-weight:700; }
    .bk-sf-box { font-size:.72rem; font-weight:700; }

    .bk-team { padding:4px 5px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:4px; font-size:.62rem; font-weight:600; color:rgba(255,255,255,.5); display:flex; align-items:center; gap:4px; }
    .bk-team.bk-w { background:rgba(197,224,0,.1); border-color:rgba(197,224,0,.3); color:#C5E000; }
    .bk-team.bk-l { color:rgba(255,255,255,.18); background:transparent; text-decoration:line-through; }

    .tk-flag { width:16px; height:11px; object-fit:cover; border-radius:1px; flex-shrink:0; }
    .tk-name { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
    .tk-sc { font-weight:700; font-size:.7rem; flex-shrink:0; margin-left:auto; }

    .bk-box-flag { width:14px; height:10px; object-fit:cover; border-radius:1px; flex-shrink:0; }

    /* Left connectors */
    .bk-left .bk-pair::after { content:''; position:absolute; right:-8px; top:25%; height:50%; width:1px; background:rgba(255,255,255,.18); pointer-events:none; }
    .bk-left .bk-entry::after { content:''; position:absolute; right:-8px; top:50%; width:8px; height:1px; background:rgba(255,255,255,.18); pointer-events:none; }
    .bk-left .bk-r32e::after { content:''; position:absolute; right:-8px; top:50%; width:8px; height:1px; background:rgba(255,255,255,.18); pointer-events:none; }
    /* Right connectors */
    .bk-right .bk-pair::before { content:''; position:absolute; left:-8px; top:25%; height:50%; width:1px; background:rgba(255,255,255,.18); pointer-events:none; }
    .bk-right .bk-entry::before { content:''; position:absolute; left:-8px; top:50%; width:8px; height:1px; background:rgba(255,255,255,.18); pointer-events:none; }
    .bk-right .bk-r32e::before { content:''; position:absolute; left:-8px; top:50%; width:8px; height:1px; background:rgba(255,255,255,.18); pointer-events:none; }

    .bk-center { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; min-width:144px; max-width:164px; padding:0 4px; }
    .bk-trophy-area { text-align:center; }
    .bk-trophy-icon { font-size:2.4rem; line-height:1; }
    .bk-champ-label { font-size:.56rem; font-weight:800; text-transform:uppercase; letter-spacing:.12em; color:rgba(255,255,255,.3); margin-top:6px; }
    .bk-champ-name { font-size:.82rem; font-weight:800; color:#C5E000; margin-top:4px; }
    .bk-final-row { display:flex; align-items:center; gap:6px; width:100%; }
    .bk-final-sf { flex:1; padding:5px 6px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:6px; font-size:.66rem; font-weight:600; color:rgba(255,255,255,.45); text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; justify-content:center; gap:4px; }
    .bk-final-sf.bk-done { background:rgba(197,224,0,.13); border-color:rgba(197,224,0,.4); color:#C5E000; }
    .bk-final-vs { font-size:.54rem; font-weight:800; text-transform:uppercase; color:rgba(255,255,255,.22); text-align:center; white-space:nowrap; flex-shrink:0; }
    .bk-final-score { font-size:.72rem; color:white; font-weight:700; }
    .bk-third-area { text-align:center; }
    .bk-third-lbl { font-size:.56rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,.22); margin-bottom:5px; }
    .bk-third-row { display:flex; align-items:center; gap:4px; justify-content:center; font-size:.62rem; color:rgba(255,255,255,.38); flex-wrap:wrap; }
    .bk-third-vs { font-size:.52rem; color:rgba(255,255,255,.18); }
    .bk-third-sc { font-size:.66rem; font-weight:700; color:white; }
    .bk-third-winner { font-size:.68rem; color:rgba(255,255,255,.5); margin-top:5px; }
  `]
})
export class Bracket implements OnInit {
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  private readonly allMatches = signal<Match[]>([]);

  readonly matchBySlot = computed((): Map<string, Match> => {
    const matches = this.allMatches();
    const map = new Map<string, Match>();
    const byStage = (stage: string) =>
      matches.filter(m => m.stage === stage).sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc));

    const assign = (stage: string, slots: string[]) => {
      byStage(stage).forEach((m, i) => { if (slots[i]) map.set(slots[i], m); });
    };

    assign('Round of 32', ['P73','P74','P75','P76','P77','P78','P79','P80','P81','P82','P83','P84','P85','P86','P87','P88']);
    assign('Round of 16', ['P89','P90','P91','P92','P93','P94','P95','P96']);
    assign('Quarter-finals', ['P97','P98','P99','P100']);
    assign('Semi-finals', ['P101','P102']);
    byStage('Third Place').forEach(m => map.set('P103', m));
    byStage('Final').forEach(m => map.set('P104', m));
    return map;
  });

  get(slot: string): Match | null {
    return this.matchBySlot().get(slot) ?? null;
  }

  winner(slot: string): string {
    const m = this.get(slot);
    if (!m || m.status !== 'Finished') return '';
    if ((m.homeGoals ?? 0) > (m.awayGoals ?? 0)) return m.homeTeam;
    if ((m.awayGoals ?? 0) > (m.homeGoals ?? 0)) return m.awayTeam;
    const q = (m as any).qualifierTeam;
    return q === 'home' ? m.homeTeam : (q === 'away' ? m.awayTeam : '');
  }

  winnerFlag(slot: string): string | null {
    const m = this.get(slot);
    if (!m) return null;
    const w = this.winner(slot);
    if (!w) return null;
    return w === m.homeTeam ? (m.homeFlagUrl ?? null) : (m.awayFlagUrl ?? null);
  }

  isWin(slot: string, side: 'home' | 'away'): boolean {
    const m = this.get(slot);
    if (!m) return false;
    const w = this.winner(slot);
    return !!w && w === (side === 'home' ? m.homeTeam : m.awayTeam);
  }

  isLoss(slot: string, side: 'home' | 'away'): boolean {
    const m = this.get(slot);
    if (!m) return false;
    const w = this.winner(slot);
    const team = side === 'home' ? m.homeTeam : m.awayTeam;
    return !!w && !!team && w !== team;
  }

  ngOnInit() {
    this.api.getFixture().subscribe({
      next: matches => {
        this.allMatches.set(matches.filter(m => KNOCKOUT_STAGES.includes(m.stage)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
