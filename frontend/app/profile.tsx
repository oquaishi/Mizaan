import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { statsAPI, Stats, Badge } from '@/src/services/statsService';
import { useFriendRequests } from '@/src/context/FriendRequestContext';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { pendingCount } = useFriendRequests();
  const [stats, setStats] = useState<Stats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([statsAPI.getStats(), statsAPI.getBadges()])
      .then(([statsData, badgesData]) => {
        setStats(statsData);
        setBadges(badgesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const initial = user?.username?.charAt(0).toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar + identity */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats summary */}
        {loading ? (
          <ActivityIndicator size="large" color="#047857" style={styles.spinner} />
        ) : (
          <>
            <Text style={styles.sectionLabel}>Prayer Stats</Text>

            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text style={styles.statValue}>{stats?.current_streak ?? 0}</Text>
                  <Text style={styles.statLabel}>Current{'\n'}Streak</Text>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text style={styles.statValue}>{stats?.longest_streak ?? 0}</Text>
                  <Text style={styles.statLabel}>Longest{'\n'}Streak</Text>
                </Card.Content>
              </Card>
            </View>

            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text style={styles.statValue}>
                    {stats?.weekly_completion_rate ?? 0}%
                  </Text>
                  <Text style={styles.statLabel}>This{'\n'}Week</Text>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content style={styles.statContent}>
                  <Text style={styles.statValue}>
                    {stats?.monthly_completion_rate ?? 0}%
                  </Text>
                  <Text style={styles.statLabel}>This{'\n'}Month</Text>
                </Card.Content>
              </Card>
            </View>

            {/* Badges */}
            <Text style={styles.sectionLabel}>Achievements</Text>
            <View style={styles.badgesGrid}>
              {badges.map((badge) => (
                <View key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
                  <View style={[styles.badgeIconCircle, !badge.earned && styles.badgeIconLocked]}>
                    <MaterialCommunityIcons
                      name={badge.icon as any}
                      size={28}
                      color={badge.earned ? '#fff' : '#bbb'}
                    />
                  </View>
                  <Text style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]}>
                    {badge.name}
                  </Text>
                  <Text style={styles.badgeDesc} numberOfLines={2}>
                    {badge.description}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Navigation Hub */}
        <Text style={styles.sectionLabel}>Explore</Text>

        <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/(tabs)/friends')}>
          <MaterialCommunityIcons name="account-group" size={24} color="#047857" />
          <Text style={styles.hubCardText}>Friends</Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
          <MaterialCommunityIcons name="chevron-right" size={22} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.hubCard} onPress={() => router.push('/(tabs)/settings')}>
          <MaterialCommunityIcons name="cog" size={24} color="#047857" />
          <Text style={styles.hubCardText}>Settings</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#ccc" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  header: {
    backgroundColor: '#065F46',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#047857',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#888',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B4226',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#047857',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 16,
  },
  spinner: {
    marginTop: 40,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
  },
  badgeCardLocked: {
    backgroundColor: '#f5f5f5',
    elevation: 0,
  },
  badgeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#047857',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIconLocked: {
    backgroundColor: '#e0e0e0',
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: '#aaa',
  },
  badgeDesc: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    lineHeight: 15,
  },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    gap: 12,
  },
  hubCardText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  badge: {
    backgroundColor: '#047857',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginRight: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
