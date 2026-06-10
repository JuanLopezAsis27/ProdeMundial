export interface Prediction {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  predictedHome: number;
  predictedAway: number;
  predictedQualifier?: string;
  pointsEarned?: number;
  isScored: boolean;
  matchKickoff: string;
  matchStatus: string;
  actualHome: number;
  actualAway: number;
}
