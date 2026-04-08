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

export const statsAPI = {
  getStats: async (): Promise<Stats> => {
    const response = await api.get('/stats');
    return response.data;
  },
};
