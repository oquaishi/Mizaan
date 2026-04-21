import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { FeedSkeletonCard } from '../../src/components/SkeletonLoader';
import { useRouter } from 'expo-router';
import { feedAPI, FeedItem, Comment } from '../../src/services/feedService';
import { useAuth } from '@/src/context/AuthContext';

function timeAgo(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function FeedCard({ item, onReact, onPhotoPress, onCommentPress }: { item: FeedItem; onReact: (id: string, reacted: boolean) => void; onPhotoPress: (url: string) => void; onCommentPress: (id: string) => void }) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timeAgo}>{timeAgo(item.checked_in_at)}</Text>
          </View>
          <View style={styles.prayerBadge}>
            <Text style={styles.prayerBadgeText}>{item.prayer_name}</Text>
          </View>
        </View>

        {/* Photo */}
        {item.photo_url && (
          <TouchableOpacity onPress={() => onPhotoPress(item.photo_url!)}>
            <Image
              source={{ uri: item.photo_url }}
              style={styles.photo}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.checkInText}>
            🕌 Prayed {item.prayer_name}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onCommentPress(item.prayer_id)}
            >
              <MaterialCommunityIcons name="comment-outline" size={20} color="#999" />
              {item.comment_count > 0 && (
                <Text style={styles.actionCount}>{item.comment_count}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onReact(item.prayer_id, item.user_reacted)}
            >
              <Text style={[styles.reactionEmoji, item.user_reacted && styles.reactionActive]}>
                🤲
              </Text>
              {item.reaction_count > 0 && (
                <Text style={styles.actionCount}>{item.reaction_count}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  const [commentsModalPrayerId, setCommentsModalPrayerId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadFeed(1, true);
  }, []);

  const loadFeed = async (pageNum: number, reset: boolean = false) => {
    try {
      const data = await feedAPI.getFeed(pageNum);
      if (reset) {
        setFeed(data.feed);
      } else {
        setFeed(prev => [...prev, ...data.feed]);
      }
      setPage(pageNum);
      setHasMore(data.has_more);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed(1, true);
  };

  const onEndReached = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      loadFeed(page + 1);
    }
  };

  const handleReact = async (prayerId: string, userReacted: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      let updatedCount: number;

      if (userReacted) {
        const res = await feedAPI.removeReaction(prayerId);
        updatedCount = res.reaction_count;
      } else {
        const res = await feedAPI.addReaction(prayerId);
        updatedCount = res.reaction_count;
      }

      setFeed(prev =>
        prev.map(item =>
          item.prayer_id === prayerId
            ? { ...item, user_reacted: !userReacted, reaction_count: updatedCount }
            : item
        )
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to react');
    }
  };

  const openComments = async (prayerId: string) => {
    setCommentsModalPrayerId(prayerId);
    setComments([]);
    setCommentsLoading(true);
    try {
      const data = await feedAPI.getComments(prayerId);
      setComments(data);
    } catch {
      // silently fail
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => {
    setCommentsModalPrayerId(null);
    setCommentText('');
  };

  const submitComment = async () => {
    if (!commentsModalPrayerId || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const newComment = await feedAPI.addComment(commentsModalPrayerId, commentText.trim());
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setFeed(prev =>
        prev.map(item =>
          item.prayer_id === commentsModalPrayerId
            ? { ...item, comment_count: item.comment_count + 1 }
            : item
        )
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await feedAPI.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      if (commentsModalPrayerId) {
        setFeed(prev =>
          prev.map(item =>
            item.prayer_id === commentsModalPrayerId
              ? { ...item, comment_count: Math.max(0, item.comment_count - 1) }
              : item
          )
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to delete comment');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Feed</Text>
          <Text style={styles.subtitle}>Your friends' prayers</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <MaterialCommunityIcons name="account-circle" size={34} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.skeletonList}>
          <FeedSkeletonCard />
          <FeedSkeletonCard />
          <FeedSkeletonCard />
        </View>
      ) : null}

      {!loading && <FlatList
        data={feed}
        keyExtractor={(item) => item.prayer_id}
        renderItem={({ item }) => (
          <FeedCard item={item} onReact={handleReact} onPhotoPress={setFullscreenPhoto} onCommentPress={openComments} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🕌</Text>
            <Text style={styles.emptyText}>No activity yet</Text>
            <Text style={styles.emptySubtext}>
              Add friends to see their prayer check-ins here
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/(tabs)/friends')}
              style={styles.emptyButton}
            >
              Find Friends
            </Button>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#047857" style={styles.footerSpinner} />
          ) : null
        }
        contentContainerStyle={feed.length === 0 ? styles.emptyContainer : styles.listContent}
      />}

      {/* Comments Modal */}
      <Modal
        visible={!!commentsModalPrayerId}
        transparent
        animationType="slide"
        onRequestClose={closeComments}
      >
        <KeyboardAvoidingView
          style={styles.commentsOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.commentsDismiss} onPress={closeComments} activeOpacity={1} />
          <View style={styles.commentsSheet}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity onPress={closeComments}>
                <MaterialCommunityIcons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <ActivityIndicator size="small" color="#047857" style={{ marginTop: 24 }} />
            ) : (
              <ScrollView style={styles.commentsList} keyboardShouldPersistTaps="handled">
                {comments.length === 0 && (
                  <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                )}
                {comments.map(c => (
                  <View key={c.id} style={styles.commentRow}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{c.username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.commentBody}>
                      <Text style={styles.commentUsername}>{c.username}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                    {c.user_id === user?.id && (
                      <TouchableOpacity onPress={() => deleteComment(c.id)} style={styles.commentDelete}>
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ccc" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.commentInput}>
              <TextInput
                style={styles.commentTextInput}
                placeholder="Add a comment..."
                placeholderTextColor="#aaa"
                value={commentText}
                onChangeText={setCommentText}
                maxLength={500}
                multiline
              />
              <TouchableOpacity
                style={[styles.commentSend, (!commentText.trim() || submittingComment) && styles.commentSendDisabled]}
                onPress={submitComment}
                disabled={!commentText.trim() || submittingComment}
              >
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!fullscreenPhoto}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFullscreenPhoto(null)}
      >
        <SafeAreaView style={styles.fullscreenContainer}>
          <TouchableOpacity
            style={styles.fullscreenClose}
            onPress={() => setFullscreenPhoto(null)}
          >
            <Text style={styles.fullscreenCloseText}>✕</Text>
          </TouchableOpacity>
          {fullscreenPhoto && (
            <Image
              source={{ uri: fullscreenPhoto }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  skeletonList: {
    padding: 16,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#065F46',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#047857',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  prayerBadge: {
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prayerBadgeText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  checkInText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  actionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  reactionEmoji: {
    fontSize: 22,
    opacity: 0.4,
  },
  reactionActive: {
    opacity: 1,
  },
  commentsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  commentsDismiss: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  commentsSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: 320,
  },
  noComments: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 14,
    paddingVertical: 24,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#047857',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  commentBody: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  commentDelete: {
    padding: 4,
    alignSelf: 'center',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1a1a1a',
    maxHeight: 80,
  },
  commentSend: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#047857',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSendDisabled: {
    backgroundColor: '#ccc',
  },
  footerSpinner: {
    paddingVertical: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 56,
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
    backgroundColor: '#047857',
    paddingHorizontal: 8,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
