import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Match } from '../models/match.model';
import { Group, Leaderboard } from '../models/group.model';
import { Prediction } from '../models/prediction.model';

export interface GroupStats {
  userStats: UserStats[];
  evolution: DateSnapshot[];
}

export interface UserStats {
  userId: string;
  username: string;
  totalPredictions: number;
  exactPredictions: number;
  correctOutcomes: number;
  wrongPredictions: number;
  totalPoints: number;
}

export interface DateSnapshot {
  date: string;
  cumulativePoints: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getTodayMatches() {
    return this.http.get<Match[]>(`${this.base}/matches/today`).pipe(
      tap({ next: r => console.log('[API] today matches:', r.length), error: e => console.error('[API] today error:', e) })
    );
  }

  getFixture() {
    console.log('[API] fetching fixture from', `${this.base}/matches/fixture`);
    return this.http.get<Match[]>(`${this.base}/matches/fixture`).pipe(
      tap({ next: r => console.log('[API] fixture:', r.length, 'partidos'), error: e => console.error('[API] fixture error:', e) })
    );
  }

  getExternalLiveMatches() {
    return this.http.get<Match[]>(`${this.base}/matches/live`).pipe(
      tap({ error: e => console.error('[API] live error:', e) })
    );
  }

  getMyGroups() {
    return this.http.get<Group[]>(`${this.base}/groups`);
  }

  createGroup(name: string) {
    return this.http.post<{ groupId: string; name: string; code: string }>(`${this.base}/groups`, { name });
  }

  joinGroup(code: string) {
    return this.http.post<{ groupId: string }>(`${this.base}/groups/join`, { code });
  }

  getLeaderboard(groupId: string) {
    return this.http.get<Leaderboard>(`${this.base}/groups/${groupId}/leaderboard`);
  }

  getGroupStats(groupId: string) {
    return this.http.get<GroupStats>(`${this.base}/groups/${groupId}/stats`);
  }

  getMemberPredictions(groupId: string, userId: string) {
    return this.http.get<Prediction[]>(`${this.base}/groups/${groupId}/members/${userId}/predictions`);
  }

  getMyPredictions(groupId: string) {
    return this.http.get<Prediction[]>(`${this.base}/predictions`, {
      params: new HttpParams().set('groupId', groupId)
    });
  }

  createPrediction(matchId: string, groupId: string, homeGoals: number, awayGoals: number, qualifier?: string) {
    return this.http.post<{ id: string }>(`${this.base}/predictions`, { matchId, groupId, homeGoals, awayGoals, qualifier });
  }

  updatePrediction(predictionId: string, homeGoals: number, awayGoals: number, qualifier?: string) {
    return this.http.put(`${this.base}/predictions/${predictionId}`, { homeGoals, awayGoals, qualifier });
  }
}

