import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFriendRequests } from '@/src/context/FriendRequestContext';

export default function TabLayout() {
  const { pendingCount } = useFriendRequests();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#C9A227',
        tabBarInactiveTintColor: '#047857',
        tabBarStyle: {
          backgroundColor: '#D4EDE1',
          borderTopColor: '#B2D8C4',
          borderTopWidth: 1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Check In',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="checkmark.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="prayer-times"
        options={{
          title: 'Prayer Times',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Statistics',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gear" color={color} />,
        }}
      />
    </Tabs>
  );
}
