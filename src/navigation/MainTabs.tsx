import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from './types';
import {HomeScreen} from '../screens/HomeScreen';
import {SyncScreen} from '../screens/SyncScreen';
import {useSyncContext} from '../context/SyncContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcon =
  (glyph: string) =>
  ({focused}: {focused: boolean}) =>
    <Text style={[styles.icon, !focused && styles.iconInactive]}>{glyph}</Text>;

export const MainTabs: React.FC = () => {
  const {captures} = useSyncContext();
  const pendingCount = captures.filter(
    c => c.syncStatus === 'pending' || c.syncStatus === 'error',
  ).length;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E3B02F',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {backgroundColor: '#0F172A', borderTopColor: '#1E293B'},
        tabBarLabelStyle: {fontSize: 11, fontWeight: '700'},
      }}>
      <Tab.Screen
        name="Captures"
        component={HomeScreen}
        options={{tabBarIcon: tabIcon('📋')}}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{
          tabBarIcon: tabIcon('🔄'),
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: {backgroundColor: '#F59E0B', color: '#0F172A'},
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  icon: {fontSize: 20},
  iconInactive: {opacity: 0.5},
});
