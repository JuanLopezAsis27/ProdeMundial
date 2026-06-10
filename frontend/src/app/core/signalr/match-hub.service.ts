import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface MatchUpdate {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  minute?: number;
}

export interface MatchFinishedUpdate {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
}

@Injectable({ providedIn: 'root' })
export class MatchHubService {
  private readonly auth = inject(AuthService);

  private hubConnection?: signalR.HubConnection;
  private readonly _matchUpdates = new Subject<MatchUpdate>();
  private readonly _matchFinished = new Subject<MatchFinishedUpdate>();

  readonly matchUpdates$ = this._matchUpdates.asObservable();
  readonly matchFinished$ = this._matchFinished.asObservable();

  private _startPromise?: Promise<void>;

  async start() {
    if (
      this.hubConnection?.state === signalR.HubConnectionState.Connected ||
      this.hubConnection?.state === signalR.HubConnectionState.Connecting
    ) return;

    if (this._startPromise) return this._startPromise;

    this._startPromise = this._doStart().finally(() => (this._startPromise = undefined));
    return this._startPromise;
  }

  private async _doStart() {

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
        accessTokenFactory: () => this.auth.getToken()
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('MatchScoreUpdated', (update: MatchUpdate) => {
      console.log('[SignalR] MatchScoreUpdated recibido:', update);
      this._matchUpdates.next(update);
    });

    this.hubConnection.on('MatchFinished', (update: MatchFinishedUpdate) => {
      console.log('[SignalR] MatchFinished recibido:', update);
      this._matchFinished.next(update);
    });

    this.hubConnection.onreconnecting(err => console.warn('[SignalR] Reconectando...', err));
    this.hubConnection.onreconnected(id => console.log('[SignalR] Reconectado, connectionId:', id));
    this.hubConnection.onclose(err => console.warn('[SignalR] Conexión cerrada:', err));

    console.log('[SignalR] Conectando a', environment.hubUrl);
    await this.hubConnection.start();
    console.log('[SignalR] Conectado. State:', this.hubConnection.state);
  }

  async subscribeToMatch(matchId: string) {
    if (!this.hubConnection) await this.start();
    await this.hubConnection!.invoke('SubscribeToMatch', matchId);
  }

  async unsubscribeFromMatch(matchId: string) {
    await this.hubConnection?.invoke('UnsubscribeFromMatch', matchId);
  }

  async stop() {
    await this.hubConnection?.stop();
  }
}
