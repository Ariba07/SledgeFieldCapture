import React from 'react';
import {Text, View} from 'react-native';
import {CloudOff} from 'lucide-react-native';
import {useTheme} from '../theme';
import {ICON_STROKE} from './ui';
import {useNetworkBannerStyles} from '../styles/components/NetworkBanner.styles';

interface Props {
  isOnline: boolean;
  pendingCount: number;
}

export const NetworkBanner: React.FC<Props> = ({isOnline, pendingCount}) => {
  const styles = useNetworkBannerStyles();
  const {colors} = useTheme();
  if (isOnline) {
    return null;
  }

  const detail =
    pendingCount > 0
      ? `${pendingCount} ${
          pendingCount === 1 ? 'capture' : 'captures'
        } will upload when you reconnect.`
      : 'New captures are saved on this device and upload when you reconnect.';

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <CloudOff
        size={18}
        color={colors.textSecondary}
        strokeWidth={ICON_STROKE}
      />
      <View style={styles.text}>
        <Text style={styles.title}>You're offline</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
    </View>
  );
};
