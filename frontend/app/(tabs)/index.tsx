import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Text, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';

export default function HomeScreen() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Icon size={80} icon="account" style={styles.avatar} />

          <Text variant="headlineMedium" style={styles.greeting}>
            Welcome Back!
          </Text>

          <Text variant="titleLarge" style={styles.username}>
            {user?.username}
          </Text>

          <Text variant="bodyMedium" style={styles.email}>
            {user?.email}
          </Text>

          <View style={styles.infoSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Account Details
            </Text>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>User ID:</Text>
              <Text variant="bodyMedium" style={styles.value}>{user?.id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>Calculation Method:</Text>
              <Text variant="bodyMedium" style={styles.value}>{user?.calculation_method || 'ISNA'}</Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            icon="logout"
          >
            Log Out
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            🎉 Phase 2 Complete!
          </Text>
          <Text variant="bodyMedium" style={styles.successText}>
            Authentication system is working! You can now:
          </Text>
          <Text variant="bodyMedium" style={styles.listItem}>✓ Register new accounts</Text>
          <Text variant="bodyMedium" style={styles.listItem}>✓ Log in with email/password</Text>
          <Text variant="bodyMedium" style={styles.listItem}>✓ Stay logged in across sessions</Text>
          <Text variant="bodyMedium" style={styles.listItem}>✓ Access protected routes</Text>
          <Text variant="bodyMedium" style={styles.listItem}>✓ Log out securely</Text>
        </Card.Content>
      </Card>
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#6200ea',
    marginBottom: 16,
  },
  greeting: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  username: {
    marginBottom: 4,
    color: '#6200ea',
  },
  email: {
    marginBottom: 24,
    color: '#666',
  },
  infoSection: {
    width: '100%',
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#666',
  },
  value: {
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 8,
    width: '100%',
  },
  successText: {
    marginBottom: 12,
  },
  listItem: {
    marginLeft: 8,
    marginBottom: 4,
  },
});
