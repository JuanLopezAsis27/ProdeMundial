import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private _footballApiKey = '';

  get footballApiKey(): string {
    return this._footballApiKey;
  }

  async load(): Promise<void> {
    try {
      const config = await lastValueFrom(
        this.http.get<{ footballApiKey: string }>(`${environment.apiUrl}/config`)
      );
      this._footballApiKey = config.footballApiKey;
    } catch {
      // Config endpoint unavailable — widgets won't show API data
    }
  }
}
