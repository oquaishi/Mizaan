import api from './api';

export interface Prayer {
  id: string;
  user_id: string;
  prayer_name: string;
  photo_url: string | null;
  checked_in_at: string;
  prayer_date: string;
  status: string;
  note: string | null;
}

export interface TodaysPrayers {
  date: string;
  completed: Prayer[];
  completed_names: string[];
  pending: string[];
  total_completed: number;
  total_prayers: number;
}

export const prayerAPI = {
  checkIn: async (prayerName: string, photo?: string, note?: string): Promise<Prayer> => {
    const response = await api.post('/prayers/check-in', {
      prayer_name: prayerName,
      photo,
      note,
    });
    return response.data.prayer;
  },

  getToday: async (): Promise<TodaysPrayers> => {
    const response = await api.get('/prayers/today');
    return response.data;
  },

  getHistory: async (days: number = 7): Promise<Prayer[]> => {
    const response = await api.get(`/prayers/history?days=${days}`);
    return response.data.prayers;
  },

  delete: async (prayerId: string): Promise<void> => {
    await api.delete(`/prayers/${prayerId}`);
  },
};
