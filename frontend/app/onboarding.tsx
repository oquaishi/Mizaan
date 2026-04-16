import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { userAPI } from '@/src/services/api';
import { useAuth } from '@/src/context/AuthContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationDone, setLocationDone] = useState(false);

  const skip = () => router.replace('/(tabs)');

  const handleEnableLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission denied. You can enable it later in Prayer Times.');
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await userAPI.updateSettings({ location: `${latitude},${longitude}`, timezone });
      await refreshUser();
      setLocationDone(true);
    } catch {
      setLocationError('Could not get location. Try again or skip for now.');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Step dots */}
      <View style={styles.dots}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
        ))}
      </View>

      {/* Step 1 — Welcome */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.emoji}>🕌</Text>
          <Text style={styles.heading}>Bismillah</Text>
          <Text style={styles.subheading}>Welcome to Mizaan</Text>
          <Text style={styles.body}>
            Mizaan helps you stay consistent with your 5 daily prayers through
            accountability with friends, streaks, and gentle reminders.
          </Text>
          <Button
            mode="contained"
            onPress={() => setStep(2)}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            Get Started
          </Button>
        </View>
      )}

      {/* Step 2 — Location */}
      {step === 2 && (
        <View style={styles.stepContainer}>
          <Text style={styles.emoji}>📍</Text>
          <Text style={styles.heading}>Set Your Location</Text>
          <Text style={styles.body}>
            Mizaan calculates accurate prayer times based on where you are.
            Your location is only used for prayer time calculations.
          </Text>
          {locationError && (
            <Text style={styles.errorText}>{locationError}</Text>
          )}
          {locationDone ? (
            <View style={styles.successRow}>
              <Text style={styles.successText}>✓ Location saved</Text>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={handleEnableLocation}
              loading={locationLoading}
              disabled={locationLoading}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
            >
              Enable Location
            </Button>
          )}
          <Button
            mode="text"
            onPress={() => setStep(3)}
            style={styles.nextButton}
            textColor="#6750a4"
          >
            {locationDone ? 'Next →' : 'Skip this step'}
          </Button>
        </View>
      )}

      {/* Step 3 — Find friends */}
      {step === 3 && (
        <View style={styles.stepContainer}>
          <Text style={styles.emoji}>👥</Text>
          <Text style={styles.heading}>Find Your People</Text>
          <Text style={styles.body}>
            Accountability is more powerful with friends. Search for people you
            know and build your prayer network.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.replace('/(tabs)/friends')}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            Find Friends
          </Button>
          <Button
            mode="text"
            onPress={skip}
            style={styles.nextButton}
            textColor="#888"
          >
            Maybe later
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 32,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipText: {
    color: '#aaa',
    fontSize: 15,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  dotActive: {
    backgroundColor: '#6750a4',
    width: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emoji: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: 24,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 18,
    color: '#6750a4',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 36,
  },
  primaryButton: {
    backgroundColor: '#6750a4',
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  nextButton: {
    alignSelf: 'center',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  successRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '600',
  },
});
