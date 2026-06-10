export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlagUrl?: string;
  awayFlagUrl?: string;
  homeGoals: number;
  awayGoals: number;
  status: 'Scheduled' | 'InProgress' | 'Finished' | 'Postponed';
  kickoffUtc: string;
  stage: string;
  groupName?: string;
  minute?: number;
  league?: string;
  country?: string;
  qualifierTeam?: string;
  homePenalties?: number;
  awayPenalties?: number;
}
