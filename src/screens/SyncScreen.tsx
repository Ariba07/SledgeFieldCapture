import React, {useState} from 'react';
import {Switch, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  CircleAlert,
  CloudCheck,
  CloudOff,
  CloudUpload,
  LucideIcon,
  RefreshCw,
} from 'lucide-react-native';
import {useSyncContext} from '../context/SyncContext';
import {CaptureGrid} from '../components/CaptureGrid';
import {StorageErrorBanner} from '../components/StorageErrorBanner';
import {Button, ICON_STROKE, SectionHeader} from '../components/ui';
import {MainTabScreenProps} from '../navigation/types';
import {SyncService} from '../services/SyncService';
import {spacing, useTheme} from '../theme';
import {useSyncScreenStyles} from '../styles/screens/SyncScreen.styles';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const SyncScreen: React.FC<MainTabScreenProps<'Sync'>> = ({
  navigation,
}) => {
  const styles = useSyncScreenStyles();
  const {colors} = useTheme();
  const {
    captures,
    progress,
    isOnline,
    isSyncing,
    storageError,
    retryCapture,
    flushPendingCaptures,
  } = useSyncContext();
  const [simulateErrors, setSimulateErrors] = useState(
    SyncService.getSimulateServerErrors,
  );

  const queue = captures.filter(c => c.syncStatus !== 'synced');
  const errorCount = queue.filter(c => c.syncStatus === 'error').length;
  const canSync = isOnline && !isSyncing && queue.length > 0;

  const toggleSimulateErrors = (on: boolean) => {
    SyncService.setSimulateServerErrors(on);
    setSimulateErrors(on);
  };

  const status: {
    icon: LucideIcon;
    color: string;
    title: string;
    detail: string;
  } = !isOnline
    ? {
        icon: CloudOff,
        color: colors.textSecondary,
        title: 'Offline',
        detail:
          queue.length > 0
            ? `${plural(
                queue.length,
                'capture',
              )} will upload automatically when you reconnect.`
            : 'Nothing waiting. New captures will be saved on this device.',
      }
    : isSyncing
    ? {
        icon: RefreshCw,
        color: colors.status.syncing,
        title: 'Syncing',
        detail: `Uploading ${plural(queue.length, 'capture')}…`,
      }
    : errorCount > 0
    ? {
        icon: CircleAlert,
        color: colors.status.error,
        title: `${errorCount} failed`,
        detail:
          'Stopped after 3 attempts. Retry below, or they will retry when you reconnect.',
      }
    : queue.length > 0
    ? {
        icon: CloudUpload,
        color: colors.status.pending,
        title: `${queue.length} waiting`,
        detail: 'Retrying automatically.',
      }
    : {
        icon: CloudCheck,
        color: colors.status.synced,
        title: 'All synced',
        detail: 'Everything on this device has been uploaded.',
      };
  const StatusIcon = status.icon;

  const header = (
    <View style={styles.headerBlock}>
      <Text style={styles.largeTitle} accessibilityRole="header">
        Sync
      </Text>

      <StorageErrorBanner error={storageError} />

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <StatusIcon
            size={24}
            color={status.color}
            strokeWidth={ICON_STROKE}
          />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{status.title}</Text>
            <Text style={styles.statusDetail}>{status.detail}</Text>
          </View>
        </View>
        {queue.length > 0 ? (
          <Button
            title="Sync now"
            icon={RefreshCw}
            variant="secondary"
            onPress={flushPendingCaptures}
            disabled={!canSync}
          />
        ) : null}
      </View>

      {queue.length > 0 ? (
        <SectionHeader title={`Queue · ${queue.length}`} />
      ) : null}
    </View>
  );

  const footer = (
    <View style={styles.footerBlock}>
      <SectionHeader title="Testing" />
      <View style={styles.settingRow}>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>Simulate server errors</Text>
          <Text style={styles.settingDetail}>
            Uploads fail with a 503 so you can see retries and the failed state.
          </Text>
        </View>
        <Switch
          value={simulateErrors}
          onValueChange={toggleSimulateErrors}
          accessibilityLabel="Simulate server errors"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <CaptureGrid
        data={queue}
        progress={progress}
        onOpen={id => navigation.navigate('CaptureDetail', {captureId: id})}
        onRetry={retryCapture}
        header={header}
        footer={footer}
        bottomPadding={spacing.xxl}
      />
    </SafeAreaView>
  );
};
