import api from './api';

export interface FeedItem {
  prayer_id: string;
  user_id: string;
  username: string;
  profile_picture_url: string | null;
  prayer_name: string;
  photo_url: string | null;
  checked_in_at: string;
  prayer_date: string;
  reaction_count: number;
  user_reacted: boolean;
}

export interface FeedResponse {
  feed: FeedItem[];
  page: number;
  has_more: boolean;
}

export const feedAPI = {
  getFeed: async (page: number = 1): Promise<FeedResponse> => {
    const response = await api.get(`/feed?page=${page}`);
    return response.data;
  },

  addReaction: async (prayer_id: string): Promise<{ reaction_count: number }> => {
    const response = await api.post(`/feed/${prayer_id}/react`);
    return response.data;
  },

  removeReaction: async (prayer_id: string): Promise<{ reaction_count: number }> => {
    const response = await api.delete(`/feed/${prayer_id}/react`);
    return response.data;
  },
};
