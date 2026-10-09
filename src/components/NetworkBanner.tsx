import React from 'react';
import {Text, StyleSheet, Animated} from 'react-native';

interface Props {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}

export const NetworkBanner: React.FC<Props> = ({
  isOnline,
  isSyncing,
  pendingCount,
}) => {
  const slideAnim = React.useRef(new Animated.Value(-50)).current;
  const wasOnline = React.useRef<boolean | null>(null);

  React.useEffect(() => {
    if (wasOnline.current === null) {
      wasOnline.current = isOnline;
      return;
    }

    if (wasOnline.current !== isOnline) {
      wasOnline.current = isOnline;
      // Animate banner in/out on network change
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOnline, slideAnim]);

  const bg = isOnline ? '#10B981' : '#EF4444';
  const label = isOnline
    ? isSyncing
      ? `Syncing ${pendingCount} item${pendingCount !== 1 ? 's' : ''}…`
      : 'Back online – all clear!'
    : `Offline · ${pendingCount} item${pendingCount !== 1 ? 's' : ''} queued`;

  return (
    <Animated.View
      style={[styles.banner, {backgroundColor: bg, transform: [{translateY: slideAnim}]}]}>
      <Text style={styles.text}>{label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: 'center',
    zIndex: 100,
  },
  text: {color: '#fff', fontWeight: '700', fontSize: 13},
});
