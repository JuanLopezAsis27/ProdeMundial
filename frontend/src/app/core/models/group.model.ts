export interface Group {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  myPoints: number;
  myRank: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  rank: number;
}

export interface Leaderboard {
  groupId: string;
  groupName: string;
  entries: LeaderboardEntry[];
}
