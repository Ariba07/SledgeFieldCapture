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
import {Colors, spacing, useTheme} from '../theme';
import {plural} from '../utils/helpers';
import {MAX_ATTEMPTS} from '../services/SyncEngine';
import {useSyncScreenStyles} from '../styles/screens/SyncScreen.styles';

interface QueueStatus {
  icon: LucideIcon;
  color: string;
  title: string;
  detail: string;
}

const describeQueue = (
  isOnline: boolean,
  isSyncing: boolean,
  waiting: number,
  failed: number,
  colors: Colors,
): QueueStatus => {
  if (!isOnline) {
    return {
      icon: CloudOff,
      color: colors.textSecondary,
      title: 'Offline',
      detail: waiting
        ? `${plural(
            waiting,
            'capture',
          )} will upload automatically when you reconnect.`
        : 'Nothing waiting. New captures will be saved on this device.',
    };
  }
  if (isSyncing) {
    return {
      icon: RefreshCw,
      color: colors.status.syncing,
      title: 'Syncing',
      detail: `Uploading ${plural(waiting, 'capture')}…`,
    };
  }
  if (failed) {
    return {
      icon: CircleAlert,
      color: colors.status.error,
      title: `${failed} failed`,
      detail: `Stopped after ${MAX_ATTEMPTS} attempts. Retry below, or they will retry when you reconnect.`,
    };
  }
  if (waiting) {
    return {
      icon: CloudUpload,
      color: colors.status.pending,
      title: `${waiting} waiting`,
      detail: 'Retrying automatically.',
    };
  }
  return {
    icon: CloudCheck,
    color: colors.status.synced,
    title: 'All synced',
    detail: 'Everything on this device has been uploaded.',
  };
};

export const SyncScreen: React.FC<MainTabScreenProps<'Sync'>> = () => {
  const styles = useSyncScreenStyles();
  const {colors} = useTheme();
  const {
    unsynced,
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

  const queue = unsynced;
  const errorCount = queue.filter(c => c.syncStatus === 'error').length;
  const canSync = isOnline && !isSyncing && queue.length > 0;

  const toggleSimulateErrors = (on: boolean) => {
    SyncService.setSimulateServerErrors(on);
    setSimulateErrors(on);
  };

  const status = describeQueue(
    isOnline,
    isSyncing,
    queue.length,
    errorCount,
    colors,
  );
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
        onRetry={retryCapture}
        header={header}
        footer={footer}
        bottomPadding={spacing.xxl}
      />
    </SafeAreaView>
  );
};
