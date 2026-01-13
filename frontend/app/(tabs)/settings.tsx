import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Text, List, Divider, Snackbar, RadioButton } from 'react-native-paper';
import { useAuth } from '@/src/context/AuthContext';
import { userAPI } from '@/src/services/api';
import { usePrayerTimes } from '@/src/context/PrayerTimesContext';

const CALCULATION_METHODS = [
  { value: 'ISNA', label: 'Islamic Society of North America (ISNA)', description: 'Widely used in North America' },
  { value: 'MWL', label: 'Muslim World League', description: 'Used globally' },
  { value: 'KARACHI', label: 'University of Islamic Sciences, Karachi', description: 'Used in Pakistan, Bangladesh' },
  { value: 'MAKKAH', label: 'Umm al-Qura, Makkah', description: 'Used in Saudi Arabia' },
  { value: 'EGYPT', label: 'Egyptian General Authority of Survey', description: 'Used in Egypt, Middle East' },
];

export default function SettingsScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { refreshPrayerTimes } = usePrayerTimes();
  const [selectedMethod, setSelectedMethod] = useState(user?.calculation_method || 'ISNA');
  const [isUpdating, setIsUpdating] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleUpdateMethod = async () => {
    if (selectedMethod === user?.calculation_method) {
      setSnackbarMessage('Method already selected');
      setSnackbarVisible(true);
      return;
    }

    try {
      setIsUpdating(true);

      // Update settings on backend
      await userAPI.updateSettings({
        calculation_method: selectedMethod,
      });

      // Refresh user data in AuthContext
      await refreshUser();

      // Small delay to ensure backend processes the update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh prayer times with new method
      await refreshPrayerTimes();

      setSnackbarMessage(`Updated to ${selectedMethod}. Prayer times refreshed!`);
      setSnackbarVisible(true);
    } catch (error: any) {
      console.error('Error updating method:', error);
      setSnackbarMessage(error.response?.data?.error || 'Failed to update method');
      setSnackbarVisible(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Parse location if available
  let locationDisplay = 'Not set';
  if (user?.location) {
    try {
      const [lat, lon] = user.location.split(',').map(Number);
      locationDisplay = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (e) {
      locationDisplay = user.location;
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Info Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Account Information
          </Text>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>Username:</Text>
            <Text variant="bodyMedium" style={styles.value}>{user?.username}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>Email:</Text>
            <Text variant="bodyMedium" style={styles.value}>{user?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>Location:</Text>
            <Text variant="bodyMedium" style={styles.value}>{locationDisplay}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>Timezone:</Text>
            <Text variant="bodyMedium" style={styles.value}>{user?.timezone || 'Not set'}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Calculation Method Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Calculation Method
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            Different methods calculate prayer times slightly differently based on the angle of the sun.
          </Text>
        </Card.Content>

        <RadioButton.Group onValueChange={setSelectedMethod} value={selectedMethod}>
          {CALCULATION_METHODS.map((method, index) => (
            <React.Fragment key={method.value}>
              <List.Item
                title={method.label}
                description={method.description}
                left={() => (
                  <RadioButton.Android
                    value={method.value}
                    status={selectedMethod === method.value ? 'checked' : 'unchecked'}
                  />
                )}
                onPress={() => setSelectedMethod(method.value)}
              />
              {index < CALCULATION_METHODS.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </RadioButton.Group>

        <Card.Actions>
          <Button
            mode="contained"
            onPress={handleUpdateMethod}
            loading={isUpdating}
            disabled={isUpdating || selectedMethod === user?.calculation_method}
            style={styles.updateButton}
          >
            Update Method
          </Button>
        </Card.Actions>
      </Card>

      {/* Logout Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={handleLogout}
            icon="logout"
            style={styles.logoutButton}
            textColor="#d32f2f"
          >
            Log Out
          </Button>
        </Card.Content>
      </Card>

      {/* App Info */}
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>Mizaan v1.0</Text>
        <Text variant="bodySmall" style={styles.footerText}>Prayer Accountability App</Text>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    color: '#666',
    flex: 1,
  },
  value: {
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  updateButton: {
    flex: 1,
    marginHorizontal: 8,
    marginTop: 8,
  },
  logoutButton: {
    borderColor: '#d32f2f',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  footerText: {
    color: '#666',
    marginBottom: 4,
  },
});
