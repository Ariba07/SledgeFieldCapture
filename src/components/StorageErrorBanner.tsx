import React from 'react';
import {Text, View} from 'react-native';
import {TriangleAlert} from 'lucide-react-native';
import {useTheme} from '../theme';
import {ICON_STROKE} from './ui';
import {useStorageErrorBannerStyles} from '../styles/components/StorageErrorBanner.styles';

export const StorageErrorBanner: React.FC<{error: string | null}> = ({error}) => {
  const styles = useStorageErrorBannerStyles();
  const {colors} = useTheme();
  if (!error) {
    return null;
  }
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <TriangleAlert size={18} color={colors.danger} strokeWidth={ICON_STROKE} />
      <View style={styles.text}>
        <Text style={styles.title}>Couldn't save to this device</Text>
        <Text style={styles.detail}>
          Recent changes are kept while the app is open and saved on your next change. Free up
          storage, and avoid closing the app until this goes away.
        </Text>
      </View>
    </View>
  );
};
