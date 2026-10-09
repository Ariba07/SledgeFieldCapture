import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {ClipboardList, RefreshCw} from 'lucide-react-native';
import {MainTabParamList} from './types';
import {HomeScreen} from '../screens/HomeScreen';
import {SyncScreen} from '../screens/SyncScreen';
import {useSyncContext} from '../context/SyncContext';
import {ICON_STROKE} from '../components/ui';
import {useTheme} from '../theme';
import {useLayout} from '../theme/layout';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconProps = {color: string; size: number};
const CapturesIcon = ({color, size}: TabIconProps) => (
  <ClipboardList size={size} color={color} strokeWidth={ICON_STROKE} />
);
const SyncIcon = ({color, size}: TabIconProps) => (
  <RefreshCw size={size} color={color} strokeWidth={ICON_STROKE} />
);

export const MainTabs: React.FC = () => {
  const {colors} = useTheme();
  const rail = useLayout().sizeClass === 'expanded';
  const unsyncedCount = useSyncContext().unsynced.length;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarPosition: rail ? 'left' : 'bottom',
        tabBarVariant: rail ? 'material' : 'uikit',
        // Icon above label keeps the rail ~80pt wide instead of a full sidebar.
        tabBarLabelPosition: rail ? 'below-icon' : undefined,
        tabBarStyle: rail
          ? {
              backgroundColor: colors.background,
              borderRightColor: colors.border,
            }
          : {backgroundColor: colors.background, borderTopColor: colors.border},
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
      }}>
      <Tab.Screen
        name="Captures"
        component={HomeScreen}
        options={{
          tabBarIcon: CapturesIcon,
        }}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{
          tabBarIcon: SyncIcon,
          tabBarBadge: unsyncedCount > 0 ? unsyncedCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: colors.onPrimary,
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      />
    </Tab.Navigator>
  );
};
