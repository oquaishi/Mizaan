import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Card, Button, Chip } from 'react-native-paper';
import { FriendSkeletonCard } from '../../src/components/SkeletonLoader';
import {
  friendsAPI,
  Friend,
  FriendRequest,
  SearchUser,
} from '../../src/services/friendsService';
import { useFriendRequests } from '../../src/context/FriendRequestContext';

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { refreshCount } = useFriendRequests();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        friendsAPI.getFriends(),
        friendsAPI.getPendingRequests(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Failed to load friends data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await friendsAPI.searchUsers(text);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async (userId: string, username: string) => {
    setActionLoading(userId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await friendsAPI.sendRequest(userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Request Sent', `Friend request sent to ${username}`);
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRespond = async (friendshipId: string, action: 'accept' | 'decline') => {
    setActionLoading(friendshipId);
    try {
      await friendsAPI.respond(friendshipId, action);
      Haptics.notificationAsync(
        action === 'accept'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
      await Promise.all([loadData(), refreshCount()]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to respond');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = (friendshipId: string, username: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(friendshipId);
            try {
              await friendsAPI.removeFriend(friendshipId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId));
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to remove friend');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends {friends.length > 0 ? `(${friends.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests {requests.length > 0 ? `(${requests.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
            Search
          </Text>
        </TouchableOpacity>
      </View>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <>
              <FriendSkeletonCard />
              <FriendSkeletonCard />
              <FriendSkeletonCard />
            </>
          ) : friends.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>Search for people you know and build your accountability network</Text>
              <Button
                mode="contained"
                onPress={() => setActiveTab('search')}
                style={styles.emptyButton}
              >
                Find Friends
              </Button>
            </View>
          ) : (
            friends.map((friend) => (
              <Card key={friend.friendship_id} style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {friend.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.username}>{friend.username}</Text>
                    <Text style={styles.sinceText}>
                      Friends since {new Date(friend.since).toLocaleDateString()}
                    </Text>
                  </View>
                  <Button
                    mode="outlined"
                    onPress={() => handleRemoveFriend(friend.friendship_id, friend.username)}
                    loading={actionLoading === friend.friendship_id}
                    disabled={actionLoading !== null}
                    textColor="#e53935"
                    style={styles.removeButton}
                    labelStyle={styles.removeButtonLabel}
                  >
                    Remove
                  </Button>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {requests.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={styles.emptyText}>No pending requests</Text>
              <Text style={styles.emptySubtext}>When someone sends you a friend request it will appear here</Text>
            </View>
          ) : (
            requests.map((req) => (
              <Card key={req.id} style={styles.card}>
                <Card.Content>
                  <View style={styles.requestHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {req.requester_username?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.username}>{req.requester_username}</Text>
                      <Text style={styles.sinceText}>wants to be your friend</Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <Button
                      mode="contained"
                      onPress={() => handleRespond(req.id, 'accept')}
                      loading={actionLoading === req.id}
                      disabled={actionLoading !== null}
                      style={[styles.actionButton, styles.acceptButton]}
                    >
                      Accept
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => handleRespond(req.id, 'decline')}
                      loading={actionLoading === req.id}
                      disabled={actionLoading !== null}
                      style={styles.actionButton}
                      textColor="#e53935"
                    >
                      Decline
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <View style={styles.content}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {searchLoading && (
            <ActivityIndicator size="small" color="#6750a4" style={styles.searchSpinner} />
          )}

          <ScrollView style={styles.searchResults}>
            {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>Try a different username</Text>
              </View>
            )}

            {searchResults.map((user) => (
              <Card key={user.id} style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.username}>{user.username}</Text>
                  </View>
                  <Button
                    mode="contained"
                    onPress={() => handleSendRequest(user.id, user.username)}
                    loading={actionLoading === user.id}
                    disabled={actionLoading !== null}
                    style={styles.addButton}
                    labelStyle={styles.addButtonLabel}
                  >
                    Add
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#6750a4',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6750a4',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#6750a4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#fff',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6750a4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  sinceText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  removeButton: {
    borderColor: '#e53935',
  },
  removeButtonLabel: {
    fontSize: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  acceptButton: {
    backgroundColor: '#6750a4',
  },
  addButton: {
    backgroundColor: '#6750a4',
  },
  addButtonLabel: {
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#6750a4',
  },
  searchBar: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 14,
  },
  searchInput: {
    height: 46,
    fontSize: 16,
    color: '#333',
  },
  searchSpinner: {
    marginTop: 8,
  },
  searchResults: {
    flex: 1,
  },
});
