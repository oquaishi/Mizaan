import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Text, Card } from 'react-native-paper';
import { StatsSkeletonScreen } from '../../src/components/SkeletonLoader';
import { statsAPI, Stats, CalendarDay } from '../../src/services/statsService';

export default function StatisticsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const getCalendarColor = (status: CalendarDay['status']) => {
    switch (status) {
      case 'complete': return '#4caf50';
      case 'partial': return '#ff9800';
      case 'missed': return '#e0e0e0';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        <Text style={styles.subtitle}>Your prayer journey</Text>
      </View>

      {loading ? <StatsSkeletonScreen /> : <>

      {/* Streak Cards */}
      <View style={styles.streakRow}>
        <Card style={[styles.streakCard, styles.currentStreakCard]}>
          <Card.Content style={styles.streakContent}>
            <Text style={styles.streakNumber}>{stats?.current_streak ?? 0}</Text>
            <Text style={styles.streakLabel}>Current{'\n'}Streak</Text>
            <Text style={styles.streakEmoji}>🔥</Text>
          </Card.Content>
        </Card>

        <View style={[styles.streakCard, styles.longestStreakCard]}>
          <LinearGradient
            colors={['#6B4226', '#A07818']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakGradient}
          >
            <Text style={styles.streakNumber}>{stats?.longest_streak ?? 0}</Text>
            <Text style={styles.streakLabel}>Longest{'\n'}Streak</Text>
            <Text style={styles.streakEmoji}>🏆</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Completion Rate Cards */}
      <View style={styles.rateRow}>
        <Card style={styles.rateCard}>
          <Card.Content style={styles.rateContent}>
            <Text style={styles.rateNumber}>{stats?.weekly_completion_rate ?? 0}%</Text>
            <Text style={styles.rateLabel}>7-Day Rate</Text>
          </Card.Content>
        </Card>

        <Card style={styles.rateCard}>
          <Card.Content style={styles.rateContent}>
            <Text style={styles.rateNumber}>{stats?.monthly_completion_rate ?? 0}%</Text>
            <Text style={styles.rateLabel}>30-Day Rate</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Calendar */}
      <Card style={styles.calendarCard}>
        <Card.Content>
          <Text style={styles.calendarTitle}>Last 30 Days</Text>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4caf50' }]} />
              <Text style={styles.legendText}>Complete</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ff9800' }]} />
              <Text style={styles.legendText}>Partial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#e0e0e0' }]} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
          </View>

          <View style={styles.calendarGrid}>
            {stats?.calendar.map((day) => (
              <View key={day.date} style={styles.calendarDayWrapper}>
                <View
                  style={[
                    styles.calendarDay,
                    { backgroundColor: getCalendarColor(day.status) },
                  ]}
                />
                <Text style={styles.calendarDayNumber}>
                  {new Date(day.date + 'T00:00:00').getDate()}
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#065F46',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    marginTop: 4,
  },
  streakRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  streakCard: {
    flex: 1,
    elevation: 4,
  },
  currentStreakCard: {
    backgroundColor: '#065F46',
  },
  longestStreakCard: {
    overflow: 'hidden',
    borderRadius: 12,
    elevation: 4,
  },
  streakGradient: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  streakContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakLabel: {
    fontSize: 13,
    color: '#ddd',
    textAlign: 'center',
    marginTop: 4,
  },
  streakEmoji: {
    fontSize: 24,
    marginTop: 8,
  },
  rateRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  rateCard: {
    flex: 1,
    backgroundColor: '#fff',
  },
  rateContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  rateNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#047857',
  },
  rateLabel: {
    fontSize: 13,
    color: '#6B4226',
    marginTop: 4,
  },
  calendarCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#fff',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#6B4226',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarDayWrapper: {
    alignItems: 'center',
    width: 36,
  },
  calendarDay: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  calendarDayNumber: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
});
