import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Button, Text, List, Divider } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { PrayerTimesSkeletonScreen } from '@/src/components/SkeletonLoader';
import * as Location from 'expo-location';
import { usePrayerTimes } from '@/src/context/PrayerTimesContext';
import { userAPI } from '@/src/services/api';
import { useAuth } from '@/src/context/AuthContext';

export default function PrayerTimesScreen() {
  const { prayerTimes, isLoading, error, fetchPrayerTimes, refreshPrayerTimes } = usePrayerTimes();
  const { user } = useAuth();
  const router = useRouter();
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    // If user has location, fetch prayer times
    if (user?.location) {
      fetchPrayerTimes();
    }
  }, [user?.location]);

  // Update countdown every second
  useEffect(() => {
    if (!prayerTimes) return;

    const interval = setInterval(() => {
      setTimeLeft(prayerTimes.time_until_next);
    }, 1000);

    return () => clearInterval(interval);
  }, [prayerTimes]);

  const requestLocationPermission = async () => {
    try {
      setRequestingLocation(true);
      setLocationError(null);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable it in settings.');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Get timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Save to backend
      await userAPI.updateSettings({
        location: `${latitude},${longitude}`,
        timezone: timezone,
      });

      // Fetch prayer times
      await fetchPrayerTimes();
    } catch (err: any) {
      setLocationError(err.message || 'Failed to get location');
    } finally {
      setRequestingLocation(false);
    }
  };

  // Show location request if user hasn't set location
  if (!user?.location) {
    return (
      <View style={styles.centerContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.centerText}>
              Location Required
            </Text>
            <Text variant="bodyMedium" style={styles.centerText}>
              We need your location to calculate accurate prayer times.
            </Text>

            {locationError && (
              <Text variant="bodyMedium" style={styles.errorText}>
                {locationError}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={requestLocationPermission}
              loading={requestingLocation}
              disabled={requestingLocation}
              style={styles.button}
            >
              Enable Location
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // Show loading state
  if (isLoading && !prayerTimes) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <PrayerTimesSkeletonScreen />
      </ScrollView>
    );
  }

  // Show error state
  if (error && !prayerTimes) {
    return (
      <View style={styles.centerContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.centerText}>
              Error
            </Text>
            <Text variant="bodyMedium" style={styles.centerText}>
              {error}
            </Text>
            <Button mode="contained" onPress={fetchPrayerTimes} style={styles.button}>
              Retry
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!prayerTimes) return null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prayer Times</Text>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <MaterialCommunityIcons name="account-circle" size={34} color="#fff" />
        </TouchableOpacity>
      </View>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refreshPrayerTimes} />
      }
    >
      {/* Current Prayer Card */}
      <Card style={[styles.card, styles.currentPrayerCard]}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.currentLabel}>
            Current Prayer
          </Text>
          <Text variant="displaySmall" style={styles.currentPrayer}>
            {prayerTimes.current_prayer}
          </Text>
          <Text variant="bodyLarge" style={styles.currentTime}>
            {prayerTimes.times[prayerTimes.current_prayer as keyof typeof prayerTimes.times]}
          </Text>
        </Card.Content>
      </Card>

      {/* Next Prayer Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.nextPrayerLabel}>
            Next Prayer: {prayerTimes.next_prayer}
          </Text>
          <Text variant="headlineMedium" style={styles.countdown}>
            {prayerTimes.time_until_next}
          </Text>
        </Card.Content>
      </Card>

      {/* All Prayer Times */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Today's Prayer Times
          </Text>
          <Text variant="bodySmall" style={styles.dateText}>
            {prayerTimes.date}
          </Text>
        </Card.Content>

        <List.Section>
          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer, index) => {
            const time = prayerTimes.times[prayer as keyof typeof prayerTimes.times];
            return (
              <React.Fragment key={prayer}>
                <List.Item
                  title={prayer}
                  titleStyle={
                    prayer === prayerTimes.current_prayer
                      ? styles.currentPrayerText
                      : styles.prayerText
                  }
                  right={() => (
                    <Text
                      variant="bodyLarge"
                      style={
                        prayer === prayerTimes.current_prayer
                          ? styles.currentPrayerTime
                          : styles.prayerTime
                      }
                    >
                      {time}
                    </Text>
                  )}
                  style={
                    prayer === prayerTimes.current_prayer
                      ? [styles.currentPrayerItem, styles.prayerRow]
                      : styles.prayerRow
                  }
                />
                {index < 4 && <Divider />}
              </React.Fragment>
            );
          })}
        </List.Section>
      </Card>

      {/* Qibla Direction */}
      <TouchableOpacity style={styles.qiblaButton} onPress={() => router.push('/qibla')}>
        <MaterialCommunityIcons name="compass" size={24} color="#fff" />
        <Text style={styles.qiblaButtonText}>Qibla Direction</Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      {/* Method Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodySmall" style={styles.infoText}>
            Calculation Method: {prayerTimes.calculation_method || 'ISNA'}
          </Text>
          <Text variant="bodySmall" style={styles.infoText}>
            Location: {prayerTimes.location.latitude.toFixed(4)}, {prayerTimes.location.longitude.toFixed(4)}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#065F46',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  currentPrayerCard: {
    backgroundColor: '#065F46',
  },
  currentLabel: {
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 4,
  },
  currentPrayer: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentTime: {
    color: '#ffffff',
    fontSize: 20,
  },
  nextPrayerLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  countdown: {
    color: '#047857',
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginBottom: 4,
    fontWeight: 'bold',
    color: '#6B4226',
  },
  dateText: {
    color: '#666',
    marginBottom: 8,
  },
  prayerText: {
    fontSize: 16,
  },
  prayerTime: {
    fontSize: 16,
  },
  currentPrayerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
  },
  currentPrayerTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
  },
  currentPrayerItem: {
    backgroundColor: '#E8F5EE',
  },
  prayerRow: {
    borderLeftWidth: 4,
    borderLeftColor: '#6B4226',
  },
  infoText: {
    color: '#666',
    marginBottom: 4,
  },
  centerText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  qiblaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065F46',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  qiblaButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
