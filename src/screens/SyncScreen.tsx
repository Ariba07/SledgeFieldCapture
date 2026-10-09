import React, {useState} from 'react';
import {FlatList, Switch, Text, View} from 'react-native';
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
import {CaptureCard} from '../components/CaptureCard';
import {Button, ICON_STROKE, SectionHeader} from '../components/ui';
import {MainTabScreenProps} from '../navigation/types';
import {SyncService} from '../services/SyncService';
import {makeStyles, radius, spacing, type, useTheme} from '../theme';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const SyncScreen: React.FC<MainTabScreenProps<'Sync'>> = ({navigation}) => {
  const styles = useStyles();
  const {colors} = useTheme();
  const {captures, progress, isOnline, isSyncing, retryCapture, flushPendingCaptures} =
    useSyncContext();
  const [simulateErrors, setSimulateErrors] = useState(SyncService.getSimulateServerErrors);

  const queue = captures.filter(c => c.syncStatus !== 'synced');
  const errorCount = queue.filter(c => c.syncStatus === 'error').length;
  const canSync = isOnline && !isSyncing && queue.length > 0;

  const toggleSimulateErrors = (on: boolean) => {
    SyncService.setSimulateServerErrors(on);
    setSimulateErrors(on);
  };

  const status: {icon: LucideIcon; color: string; title: string; detail: string} = !isOnline
    ? {
        icon: CloudOff,
        color: colors.textSecondary,
        title: 'Offline',
        detail:
          queue.length > 0
            ? `${plural(queue.length, 'capture')} will upload automatically when you reconnect.`
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
        detail: 'Stopped after 3 attempts. Retry below, or they will retry when you reconnect.',
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

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <StatusIcon size={24} color={status.color} strokeWidth={ICON_STROKE} />
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

      {queue.length > 0 ? <SectionHeader title={`Queue · ${queue.length}`} /> : null}
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
      <FlatList
        data={queue}
        keyExtractor={item => item.id}
        extraData={progress}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ItemSeparatorComponent={Separator}
        renderItem={({item}) => (
          <CaptureCard
            capture={item}
            progress={progress[item.id]}
            onPress={() => navigation.navigate('CaptureDetail', {captureId: item.id})}
            onRetry={retryCapture}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const Separator = () => <View style={{height: spacing.md}} />;

const useStyles = makeStyles(c => ({
  safe: {flex: 1, backgroundColor: c.background},
  list: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1},
  headerBlock: {gap: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs},
  largeTitle: {...type.largeTitle, color: c.text},
  statusCard: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  statusRow: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md},
  statusText: {flex: 1},
  statusTitle: {...type.title, color: c.text},
  statusDetail: {...type.subhead, color: c.textBody, marginTop: 2},
  footerBlock: {marginTop: spacing.xxl},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
  },
  settingText: {flex: 1},
  settingTitle: {...type.callout, fontWeight: '500', color: c.text},
  settingDetail: {...type.footnote, color: c.textSecondary, marginTop: 2},
}));
