import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Text, View} from 'react-native';
import {CircleAlert, Clock, CloudCheck, LucideIcon, RefreshCw} from 'lucide-react-native';
import {SyncStatus} from '../types';
import {makeStyles, type, useTheme} from '../theme';
import {ICON_STROKE} from './ui';

interface Props {
  status: SyncStatus;
  retryCount?: number;
}

const CONFIG: Record<SyncStatus, {label: string; icon: LucideIcon}> = {
  pending: {label: 'Pending', icon: Clock},
  syncing: {label: 'Syncing', icon: RefreshCw},
  synced: {label: 'Synced', icon: CloudCheck},
  error: {label: 'Sync failed', icon: CircleAlert},
};

export const SyncBadge: React.FC<Props> = ({status, retryCount = 0}) => {
  const styles = useStyles();
  const {colors} = useTheme();
  const {icon: Icon, label} = CONFIG[status];
  const color = colors.status[status];
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== 'syncing') {
      spin.stopAnimation();
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [status, spin]);

  const rotate = spin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
  const text = status === 'pending' && retryCount > 0 ? 'Retrying' : label;

  return (
    <View style={styles.row} accessibilityLabel={`Sync status: ${text}`}>
      <Animated.View style={{transform: [{rotate}]}}>
        <Icon size={14} color={color} strokeWidth={ICON_STROKE + 0.25} />
      </Animated.View>
      <Text style={[styles.label, {color}]}>{text}</Text>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  row: {flexDirection: 'row', alignItems: 'center', gap: 5},
  label: {...type.label, fontSize: 12},
}));
