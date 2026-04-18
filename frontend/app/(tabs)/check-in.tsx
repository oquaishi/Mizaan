import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Text, Card, Button, ActivityIndicator, ProgressBar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { prayerAPI, TodaysPrayers } from '../../src/services/prayerService';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function CelebrationModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.7);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <TouchableOpacity style={celebStyles.overlay} activeOpacity={1} onPress={onDismiss}>
        <Animated.View style={[celebStyles.card, { transform: [{ scale }], opacity }]}>
          <Text style={celebStyles.mosque}>🕌</Text>
          <Text style={celebStyles.heading}>All 5 Prayers Complete!</Text>
          <Text style={celebStyles.arabic}>ما شاء الله</Text>
          <Text style={celebStyles.subtext}>May Allah accept your prayers today</Text>
          <View style={celebStyles.divider} />
          <Text style={celebStyles.hint}>Tap anywhere to continue</Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function CheckInScreen() {
  const [todayData, setTodayData] = useState<TodaysPrayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = ['32%'];

  useEffect(() => {
    loadTodaysPrayers();
  }, []);

  const loadTodaysPrayers = async () => {
    try {
      const data = await prayerAPI.getToday();
      setTodayData(data);
    } catch (error) {
      console.error('Failed to load prayers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    return Promise.resolve();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTodaysPrayers();
  };

  const handleCheckIn = (prayerName: string) => {
    setSelectedPrayer(prayerName);
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
    setSelectedPrayer(null);
  };

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const takePhoto = async (prayerName: string) => {
    closeSheet();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await submitCheckIn(prayerName, `data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickImage = async (prayerName: string) => {
    closeSheet();
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await submitCheckIn(prayerName, `data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const submitCheckIn = async (prayerName: string, photo?: string) => {
    setCheckingIn(prayerName);
    const willComplete = todayData?.total_completed === 4;
    try {
      await prayerAPI.checkIn(prayerName, photo);
      await loadTodaysPrayers();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (willComplete) {
        setShowCelebration(true);
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to check in');
    } finally {
      setCheckingIn(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D52" />
        <Text style={styles.loadingText}>Loading prayers...</Text>
      </View>
    );
  }

  const progress = todayData ? todayData.total_completed / 5 : 0;

  return (
    <View style={styles.container}>
    <ScrollView
      style={styles.scrollView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Today's Prayers</Text>
        <Text style={styles.date}>{todayData?.date}</Text>
      </View>

      <Card style={styles.progressCard}>
        <Card.Content>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Daily Progress</Text>
            <Text style={styles.progressCount}>
              {todayData?.total_completed || 0} / 5
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            color="#2E7D52"
            style={styles.progressBar}
          />
          <Text style={styles.progressPercent}>
            {Math.round(progress * 100)}% Complete
          </Text>
        </Card.Content>
      </Card>

      {todayData?.total_completed === 5 && (
        <View style={styles.completionBanner}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.completionTitle}>All prayers complete!</Text>
          <Text style={styles.completionSubtext}>MashaAllah — you completed all 5 prayers today</Text>
        </View>
      )}

      <View style={styles.prayerList}>
        {PRAYERS.map((prayer) => {
          const isCompleted = todayData?.completed_names.includes(prayer);
          const completedPrayer = todayData?.completed.find(
            (p) => p.prayer_name === prayer
          );

          return (
            <Card
              key={prayer}
              style={[styles.prayerCard, isCompleted && styles.completedCard]}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.prayerInfo}>
                  <View style={styles.prayerHeader}>
                    <Text style={styles.prayerName}>{prayer}</Text>
                    {isCompleted ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </View>
                  {isCompleted ? (
                    <Text style={styles.completedText}>Completed</Text>
                  ) : (
                    <Text style={styles.pendingText}>Pending</Text>
                  )}
                </View>

                <View style={styles.actionArea}>
                  {isCompleted && completedPrayer?.photo_url ? (
                    <Image
                      source={{ uri: completedPrayer.photo_url }}
                      style={styles.thumbnail}
                    />
                  ) : null}

                  {!isCompleted && (
                    <Button
                      mode="contained"
                      onPress={() => handleCheckIn(prayer)}
                      loading={checkingIn === prayer}
                      disabled={checkingIn !== null}
                      style={styles.checkInButton}
                      labelStyle={styles.checkInButtonLabel}
                    >
                      Check In
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          );
        })}
      </View>
    </ScrollView>

    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={() => setSelectedPrayer(null)}
    >
      <BottomSheetView style={styles.sheetContent}>
        <Text style={styles.sheetTitle}>
          {selectedPrayer ? `Check in for ${selectedPrayer}` : ''}
        </Text>
        <Text style={styles.sheetSubtitle}>Add a photo to your check-in?</Text>

        <TouchableOpacity style={styles.sheetOption} onPress={() => { closeSheet(); if (selectedPrayer) submitCheckIn(selectedPrayer); }}>
          <Text style={styles.sheetOptionIcon}>🤲</Text>
          <Text style={styles.sheetOptionText}>No photo — just check in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sheetOption} onPress={() => selectedPrayer && takePhoto(selectedPrayer)}>
          <Text style={styles.sheetOptionIcon}>📷</Text>
          <Text style={styles.sheetOptionText}>Take a photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sheetOption} onPress={() => selectedPrayer && pickImage(selectedPrayer)}>
          <Text style={styles.sheetOptionIcon}>🖼️</Text>
          <Text style={styles.sheetOptionText}>Choose from gallery</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>

    <CelebrationModal
      visible={showCelebration}
      onDismiss={() => setShowCelebration(false)}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3E0',
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF3E0',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1B5E38',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 16,
    color: '#e0e0e0',
    marginTop: 4,
  },
  progressCard: {
    margin: 16,
    marginTop: -20,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D52',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressPercent: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
  prayerList: {
    padding: 16,
    paddingTop: 0,
  },
  prayerCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  completedCard: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerInfo: {
    flex: 1,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerName: {
    fontSize: 20,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#4caf50',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  completedText: {
    color: '#4caf50',
    marginTop: 4,
    fontWeight: '500',
  },
  pendingText: {
    color: '#ff9800',
    marginTop: 4,
  },
  actionArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  checkInButton: {
    backgroundColor: '#2E7D52',
  },
  checkInButtonLabel: {
    fontSize: 14,
  },
  completionBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 20,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    alignItems: 'center',
  },
  completionEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  completionSubtext: {
    fontSize: 14,
    color: '#e8f5e9',
    textAlign: 'center',
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sheetOptionIcon: {
    fontSize: 22,
    marginRight: 16,
  },
  sheetOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
});

const celebStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 4, 30, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    alignItems: 'center',
    width: '100%',
  },
  mosque: {
    fontSize: 80,
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  arabic: {
    fontSize: 32,
    color: '#C9A227',
    marginBottom: 12,
    fontWeight: '600',
  },
  subtext: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: '#2E7D52',
    borderRadius: 2,
    marginVertical: 28,
  },
  hint: {
    fontSize: 13,
    color: '#888',
  },
});
