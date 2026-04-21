import api from './api';

export interface CalendarDay {
  date: string;
  count: number;
  status: 'complete' | 'partial' | 'missed';
}

export interface Stats {
  current_streak: number;
  longest_streak: number;
  weekly_completion_rate: number;
  monthly_completion_rate: number;
  calendar: CalendarDay[];
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  count: number;
  is_me: boolean;
}

export interface Leaderboard {
  leaderboard: LeaderboardEntry[];
  week_start: string;
  days_until_reset: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

export const statsAPI = {
  getStats: async (): Promise<Stats> => {
    const response = await api.get('/stats');
    return response.data;
  },
  getLeaderboard: async (): Promise<Leaderboard> => {
    const response = await api.get('/stats/leaderboard');
    return response.data;
  },
  getBadges: async (): Promise<Badge[]> => {
    const response = await api.get('/stats/badges');
    return response.data.badges;
  },
};
