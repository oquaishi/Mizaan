import api from './api';

export interface Friend {
  friendship_id: string;
  user_id: string;
  username: string;
  profile_picture_url: string | null;
  since: string;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  requester_username: string;
  addressee_username: string;
  status: string;
  created_at: string;
}

export interface SearchUser {
  id: string;
  username: string;
  profile_picture_url: string | null;
}

export const friendsAPI = {
  sendRequest: async (addressee_id: string): Promise<FriendRequest> => {
    const response = await api.post('/friends/request', { addressee_id });
    return response.data.friendship;
  },

  respond: async (friendship_id: string, action: 'accept' | 'decline'): Promise<FriendRequest> => {
    const response = await api.put(`/friends/${friendship_id}/respond`, { action });
    return response.data.friendship;
  },

  getFriends: async (): Promise<Friend[]> => {
    const response = await api.get('/friends');
    return response.data.friends;
  },

  getPendingRequests: async (): Promise<FriendRequest[]> => {
    const response = await api.get('/friends/requests');
    return response.data.requests;
  },

  removeFriend: async (friendship_id: string): Promise<void> => {
    await api.delete(`/friends/${friendship_id}`);
  },

  searchUsers: async (query: string): Promise<SearchUser[]> => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data.users;
  },
};
