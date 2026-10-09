import React from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {SyncStatus} from '../types';

interface Props {
  status: SyncStatus;
  errorMessage?: string;
  retryCount?: number;
}

const STATUS_CONFIG: Record<
  SyncStatus,
  {label: string; color: string; bg: string; icon: string}
> = {
  pending: {label: 'Pending', color: '#F59E0B', bg: '#FEF3C7', icon: '⏳'},
  syncing: {label: 'Syncing…', color: '#3B82F6', bg: '#DBEAFE', icon: '🔄'},
  synced:  {label: 'Synced',   color: '#10B981', bg: '#D1FAE5', icon: '✓'},
  error:   {label: 'Error',    color: '#EF4444', bg: '#FEE2E2', icon: '✕'},
};

export const SyncBadge: React.FC<Props> = ({status, errorMessage, retryCount = 0}) => {
  const cfg = STATUS_CONFIG[status];
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (status === 'syncing') {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }
  }, [status, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.badge, {backgroundColor: cfg.bg}]}>
        {status === 'syncing' ? (
          <Animated.Text
            style={[styles.icon, {transform: [{rotate: spin}]}]}>
            {cfg.icon}
          </Animated.Text>
        ) : (
          <Text style={styles.icon}>{cfg.icon}</Text>
        )}
        <Text style={[styles.label, {color: cfg.color}]}>{cfg.label}</Text>
      </View>
      {status === 'error' && errorMessage ? (
        <Text style={styles.errorText} numberOfLines={1}>
          {errorMessage}
        </Text>
      ) : null}
      {status === 'pending' && retryCount > 0 ? (
        <Text style={styles.retryText} numberOfLines={1}>
          {retryCount} failed · retrying
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {alignItems: 'flex-end'},
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  icon: {fontSize: 11},
  label: {fontSize: 11, fontWeight: '600'},
  errorText: {
    marginTop: 2,
    fontSize: 10,
    color: '#EF4444',
    maxWidth: 160,
  },
  retryText: {
    marginTop: 2,
    fontSize: 10,
    color: '#F59E0B',
  },
});
