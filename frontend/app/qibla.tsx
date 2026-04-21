import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { Magnetometer } from 'expo-sensors';
import { useAuth } from '@/src/context/AuthContext';

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

// Returns the bearing from user coords to the Kaaba in degrees (0–360)
function calcQiblaBearing(userLat: number, userLng: number): number {
  const lat1 = toRad(userLat);
  const lat2 = toRad(KAABA_LAT);
  const dLng = toRad(KAABA_LNG - userLng);

  const x = Math.sin(dLng) * Math.cos(lat2);
  const y =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDeg(Math.atan2(x, y)) + 360) % 360;
}

export default function QiblaScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [heading, setHeading] = useState(0);
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const animatedRotation = useRef(new Animated.Value(0)).current;
  const lastAngle = useRef(0);

  useEffect(() => {
    if (user?.location) {
      const [lat, lng] = user.location.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        setQiblaBearing(calcQiblaBearing(lat, lng));
      }
    }
  }, [user?.location]);

  useEffect(() => {
    let subscription: any;

    Magnetometer.isAvailableAsync().then((available) => {
      if (!available) {
        setSensorAvailable(false);
        return;
      }

      Magnetometer.setUpdateInterval(100);
      subscription = Magnetometer.addListener(({ x, y }) => {
        // Compass heading from magnetometer: angle of magnetic north
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        angle = (angle + 360) % 360;
        // Convert to compass heading (magnetic north = 0°)
        angle = (270 - angle) % 360;
        setHeading(angle);
      });
    });

    return () => subscription?.remove();
  }, []);

  // Needle rotation = qibla bearing minus current device heading
  const needleAngle =
    qiblaBearing !== null ? (qiblaBearing - heading + 360) % 360 : 0;

  // Smooth rotation to avoid jumps across 0/360 boundary
  useEffect(() => {
    let delta = needleAngle - lastAngle.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const target = lastAngle.current + delta;
    lastAngle.current = target;

    Animated.spring(animatedRotation, {
      toValue: target,
      useNativeDriver: true,
      damping: 20,
      stiffness: 120,
    }).start();
  }, [needleAngle]);

  const rotate = animatedRotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const distanceKm = (() => {
    if (!user?.location) return null;
    const [lat, lng] = user.location.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) return null;
    const R = 6371;
    const dLat = toRad(KAABA_LAT - lat);
    const dLng = toRad(KAABA_LNG - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(KAABA_LAT)) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  })();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Qibla Direction</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitle}>Point your phone toward Mecca</Text>

        {!sensorAvailable && (
          <Text style={styles.warning}>
            Compass not available on this device
          </Text>
        )}

        {/* Compass ring */}
        <View style={styles.compassContainer}>
          {/* Cardinal labels */}
          <Text style={[styles.cardinal, styles.cardinalN]}>N</Text>
          <Text style={[styles.cardinal, styles.cardinalS]}>S</Text>
          <Text style={[styles.cardinal, styles.cardinalE]}>E</Text>
          <Text style={[styles.cardinal, styles.cardinalW]}>W</Text>

          {/* Outer ring */}
          <View style={styles.compassRing}>
            {/* Needle */}
            <Animated.View style={[styles.needleWrapper, { transform: [{ rotate }] }]}>
              <View style={styles.needleTip} />
              <View style={styles.needleCenter} />
              <View style={styles.needleTail} />
            </Animated.View>

            {/* Kaaba icon at center */}
            <View style={styles.centerDot}>
              <MaterialCommunityIcons name="mosque" size={22} color="#fff" />
            </View>
          </View>
        </View>

        {/* Info row */}
        <View style={styles.infoRow}>
          {qiblaBearing !== null && (
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>{Math.round(qiblaBearing)}°</Text>
              <Text style={styles.infoLabel}>Qibla Bearing</Text>
            </View>
          )}
          {distanceKm !== null && (
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>{distanceKm.toLocaleString()}</Text>
              <Text style={styles.infoLabel}>km to Mecca</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const COMPASS_SIZE = 280;
const NEEDLE_LENGTH = 110;

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
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 40,
  },
  warning: {
    color: '#e53935',
    fontSize: 13,
    marginBottom: 16,
  },
  compassContainer: {
    width: COMPASS_SIZE + 60,
    height: COMPASS_SIZE + 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  cardinal: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: '700',
    color: '#6B4226',
  },
  cardinalN: { top: 0, alignSelf: 'center' },
  cardinalS: { bottom: 0, alignSelf: 'center' },
  cardinalE: { right: 0, top: '48%' },
  cardinalW: { left: 0, top: '48%' },
  compassRing: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 4,
    borderColor: '#065F46',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  needleWrapper: {
    position: 'absolute',
    alignItems: 'center',
    height: NEEDLE_LENGTH * 2,
    width: 20,
  },
  needleTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: NEEDLE_LENGTH,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#C9A227',
  },
  needleCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#333',
    marginVertical: -2,
    zIndex: 2,
  },
  needleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: NEEDLE_LENGTH,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ccc',
  },
  centerDot: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#065F46',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 2,
    minWidth: 120,
  },
  infoValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#047857',
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});
