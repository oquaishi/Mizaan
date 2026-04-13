import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native';

function SkeletonBox({
  width,
  height,
  borderRadius = 4,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: '#d0d0d0' }, style, { opacity }]}
    />
  );
}

// --- Feed ---

export function FeedSkeletonCard() {
  return (
    <View style={feedStyles.card}>
      <View style={feedStyles.header}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <View style={feedStyles.headerInfo}>
          <SkeletonBox width={120} height={13} />
          <SkeletonBox width={60} height={10} style={feedStyles.mt6} />
        </View>
        <SkeletonBox width={64} height={24} borderRadius={12} />
      </View>
      <SkeletonBox width="100%" height={180} borderRadius={8} style={feedStyles.photo} />
      <View style={feedStyles.footer}>
        <SkeletonBox width={100} height={12} />
        <SkeletonBox width={32} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

const feedStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerInfo: {
    flex: 1,
    gap: 0,
  },
  mt6: {
    marginTop: 6,
  },
  photo: {
    marginVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
});

// --- Friends ---

export function FriendSkeletonCard() {
  return (
    <View style={friendStyles.card}>
      <SkeletonBox width={44} height={44} borderRadius={22} />
      <View style={friendStyles.info}>
        <SkeletonBox width={140} height={14} />
        <SkeletonBox width={90} height={10} style={friendStyles.mt6} />
      </View>
      <SkeletonBox width={64} height={32} borderRadius={4} />
    </View>
  );
}

const friendStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 1,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  mt6: {
    marginTop: 6,
  },
});

// --- Stats ---

export function StatsSkeletonScreen() {
  return (
    <View style={statsStyles.container}>
      <View style={statsStyles.streakRow}>
        <View style={[statsStyles.streakCard, statsStyles.currentCard]}>
          <SkeletonBox width={60} height={48} borderRadius={4} style={statsStyles.centered} />
          <SkeletonBox width={80} height={12} borderRadius={4} style={[statsStyles.centered, statsStyles.mt8]} />
        </View>
        <View style={[statsStyles.streakCard, statsStyles.longestCard]}>
          <SkeletonBox width={60} height={48} borderRadius={4} style={statsStyles.centered} />
          <SkeletonBox width={80} height={12} borderRadius={4} style={[statsStyles.centered, statsStyles.mt8]} />
        </View>
      </View>

      <View style={statsStyles.rateRow}>
        <View style={statsStyles.rateCard}>
          <SkeletonBox width={70} height={32} borderRadius={4} style={statsStyles.centered} />
          <SkeletonBox width={60} height={12} borderRadius={4} style={[statsStyles.centered, statsStyles.mt8]} />
        </View>
        <View style={statsStyles.rateCard}>
          <SkeletonBox width={70} height={32} borderRadius={4} style={statsStyles.centered} />
          <SkeletonBox width={60} height={12} borderRadius={4} style={[statsStyles.centered, statsStyles.mt8]} />
        </View>
      </View>

      <View style={statsStyles.calendarCard}>
        <SkeletonBox width={130} height={18} borderRadius={4} style={statsStyles.mb16} />
        <View style={statsStyles.calendarGrid}>
          {Array.from({ length: 30 }).map((_, i) => (
            <SkeletonBox key={i} width={28} height={28} borderRadius={6} />
          ))}
        </View>
      </View>
    </View>
  );
}

const statsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  streakRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  streakCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    elevation: 4,
  },
  currentCard: {
    backgroundColor: '#7c5cbf',
  },
  longestCard: {
    backgroundColor: '#555',
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
    borderRadius: 12,
    padding: 20,
    elevation: 1,
  },
  calendarCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  centered: {
    alignSelf: 'center',
  },
  mt8: {
    marginTop: 8,
  },
  mb16: {
    marginBottom: 16,
  },
});

// --- Prayer Times ---

export function PrayerTimesSkeletonScreen() {
  return (
    <View style={prayerStyles.container}>
      {/* Current prayer card */}
      <View style={[prayerStyles.card, prayerStyles.currentCard]}>
        <SkeletonBox width={100} height={12} borderRadius={4} />
        <SkeletonBox width={160} height={40} borderRadius={4} style={prayerStyles.mt10} />
        <SkeletonBox width={80} height={18} borderRadius={4} style={prayerStyles.mt10} />
      </View>

      {/* Next prayer card */}
      <View style={prayerStyles.card}>
        <SkeletonBox width={180} height={16} borderRadius={4} />
        <SkeletonBox width={120} height={36} borderRadius={4} style={prayerStyles.mt10} />
      </View>

      {/* All times card */}
      <View style={prayerStyles.card}>
        <SkeletonBox width={150} height={16} borderRadius={4} />
        <SkeletonBox width={90} height={11} borderRadius={4} style={prayerStyles.mt6} />
        <View style={prayerStyles.prayerList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={prayerStyles.prayerRow}>
              <SkeletonBox width={70} height={14} borderRadius={4} />
              <SkeletonBox width={55} height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const prayerStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  currentCard: {
    backgroundColor: '#ede7f6',
  },
  mt10: {
    marginTop: 10,
  },
  mt6: {
    marginTop: 6,
  },
  prayerList: {
    marginTop: 16,
    gap: 16,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
