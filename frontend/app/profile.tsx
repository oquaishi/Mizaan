import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { statsAPI, Stats } from '@/src/services/statsService';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.getStats()
      .then(setStats)
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
          </>
        )}
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
    color: '#888',
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
});
