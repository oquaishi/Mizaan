import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Card, Button, Text, List, Divider, Snackbar, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
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

const REMINDER_OPTIONS = [5, 10, 15, 20, 30];

export default function SettingsScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { refreshPrayerTimes } = usePrayerTimes();
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState(user?.calculation_method || 'ISNA');
  const [isUpdating, setIsUpdating] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notifications_enabled ?? true);
  const [prayerReminders, setPrayerReminders] = useState(user?.prayer_reminders_enabled ?? true);
  const [missedAlerts, setMissedAlerts] = useState(user?.missed_prayer_alerts ?? true);
  const [friendAlerts, setFriendAlerts] = useState(user?.friend_activity_alerts ?? true);
  const [reminderMinutes, setReminderMinutes] = useState(user?.reminder_minutes_before ?? 15);

  const handleUpdateMethod = async () => {
    if (selectedMethod === user?.calculation_method) {
      setSnackbarMessage('Method already selected');
      setSnackbarVisible(true);
      return;
    }

    try {
      setIsUpdating(true);
      await userAPI.updateSettings({ calculation_method: selectedMethod });
      await refreshUser();
      await new Promise(resolve => setTimeout(resolve, 500));
      await refreshPrayerTimes();
      setSnackbarMessage(`Updated to ${selectedMethod}. Prayer times refreshed!`);
      setSnackbarVisible(true);
    } catch (error: any) {
      setSnackbarMessage(error.response?.data?.error || 'Failed to update method');
      setSnackbarVisible(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationToggle = async (field: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try {
      await userAPI.updateNotificationSettings({ [field]: value });
      await refreshUser();
    } catch {
      setter(!value);
      setSnackbarMessage('Failed to update notification setting');
      setSnackbarVisible(true);
    }
  };

  const handleReminderMinutesChange = async (minutes: number) => {
    setReminderMinutes(minutes);
    try {
      await userAPI.updateNotificationSettings({ reminder_minutes_before: minutes });
      await refreshUser();
    } catch {
      setReminderMinutes(reminderMinutes);
      setSnackbarMessage('Failed to update reminder time');
      setSnackbarVisible(true);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

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
          <Divider style={styles.divider} />
          <TouchableOpacity style={styles.profileLink} onPress={() => router.push('/profile')}>
            <Text variant="bodyMedium" style={styles.profileLinkText}>View Prayer Stats →</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Notification Settings Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Notifications
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text variant="bodyMedium" style={styles.toggleLabel}>All Notifications</Text>
              <Text variant="bodySmall" style={styles.toggleDesc}>Master switch for all alerts</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(v) => handleNotificationToggle('notifications_enabled', v, setNotificationsEnabled)}
              trackColor={{ true: '#047857' }}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={[styles.toggleRow, !notificationsEnabled && styles.disabled]}>
            <View style={styles.toggleInfo}>
              <Text variant="bodyMedium" style={styles.toggleLabel}>Prayer Reminders</Text>
              <Text variant="bodySmall" style={styles.toggleDesc}>Alert before each prayer time</Text>
            </View>
            <Switch
              value={prayerReminders}
              onValueChange={(v) => handleNotificationToggle('prayer_reminders_enabled', v, setPrayerReminders)}
              trackColor={{ true: '#047857' }}
              disabled={!notificationsEnabled}
            />
          </View>

          {prayerReminders && notificationsEnabled && (
            <View style={styles.reminderMinutes}>
              <Text variant="bodySmall" style={styles.reminderLabel}>Remind me before prayer:</Text>
              <View style={styles.minuteOptions}>
                {REMINDER_OPTIONS.map((min) => (
                  <Button
                    key={min}
                    mode={reminderMinutes === min ? 'contained' : 'outlined'}
                    onPress={() => handleReminderMinutesChange(min)}
                    style={styles.minuteButton}
                    compact
                  >
                    {min}m
                  </Button>
                ))}
              </View>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={[styles.toggleRow, !notificationsEnabled && styles.disabled]}>
            <View style={styles.toggleInfo}>
              <Text variant="bodyMedium" style={styles.toggleLabel}>Missed Prayer Alerts</Text>
              <Text variant="bodySmall" style={styles.toggleDesc}>Notify when a prayer window passes</Text>
            </View>
            <Switch
              value={missedAlerts}
              onValueChange={(v) => handleNotificationToggle('missed_prayer_alerts', v, setMissedAlerts)}
              trackColor={{ true: '#047857' }}
              disabled={!notificationsEnabled}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={[styles.toggleRow, !notificationsEnabled && styles.disabled]}>
            <View style={styles.toggleInfo}>
              <Text variant="bodyMedium" style={styles.toggleLabel}>Friend Activity</Text>
              <Text variant="bodySmall" style={styles.toggleDesc}>When a friend checks in for a prayer</Text>
            </View>
            <Switch
              value={friendAlerts}
              onValueChange={(v) => handleNotificationToggle('friend_activity_alerts', v, setFriendAlerts)}
              trackColor={{ true: '#047857' }}
              disabled={!notificationsEnabled}
            />
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

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>Mizaan v1.0</Text>
        <Text variant="bodySmall" style={styles.footerText}>Prayer Accountability App</Text>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{ label: 'Dismiss', onPress: () => setSnackbarVisible(false) }}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8F2',
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontWeight: '500',
  },
  toggleDesc: {
    color: '#888',
    marginTop: 2,
  },
  disabled: {
    opacity: 0.4,
  },
  divider: {
    marginVertical: 4,
  },
  reminderMinutes: {
    paddingVertical: 12,
    paddingLeft: 4,
  },
  reminderLabel: {
    color: '#666',
    marginBottom: 8,
  },
  minuteOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  minuteButton: {
    minWidth: 48,
  },
  updateButton: {
    flex: 1,
    marginHorizontal: 8,
    marginTop: 8,
  },
  profileLink: {
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  profileLinkText: {
    color: '#047857',
    fontWeight: '600',
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
