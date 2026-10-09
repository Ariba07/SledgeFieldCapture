import React, {useState} from 'react';
import {
  Switch,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSyncContext} from '../context/SyncContext';
import {CaptureCard} from '../components/CaptureCard';
import {MainTabScreenProps} from '../navigation/types';
import {SyncService} from '../services/SyncService';

export const SyncScreen: React.FC<MainTabScreenProps<'Sync'>> = ({
  navigation,
}) => {
  const {
    captures,
    progress,
    isOnline,
    isSyncing,
    retryCapture,
    deleteCapture,
    flushPendingCaptures,
  } = useSyncContext();
  const [simulateErrors, setSimulateErrors] = useState(
    SyncService.getSimulateServerErrors,
  );

  const toggleSimulateErrors = (on: boolean) => {
    SyncService.setSimulateServerErrors(on);
    setSimulateErrors(on);
  };

  const queue = captures.filter(c => c.syncStatus !== 'synced');
  const errorCount = queue.filter(c => c.syncStatus === 'error').length;
  const canSync = isOnline && !isSyncing && queue.length > 0;

  const statusText = isSyncing
    ? 'Syncing…'
    : !isOnline
    ? 'Offline — captures will sync when you reconnect'
    : queue.length === 0
    ? 'All captures synced'
    : `${queue.length} waiting to sync`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Sync Queue</Text>
        <View style={styles.statusRow}>
          {isSyncing ? (
            <ActivityIndicator size="small" color="#60A5FA" />
          ) : (
            <View
              style={[
                styles.statusDot,
                isOnline ? styles.statusDotOnline : styles.statusDotOffline,
              ]}
            />
          )}
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
        {errorCount > 0 && (
          <Text style={styles.errorText}>
            {errorCount} failed after max retries — tap Retry on each item
          </Text>
        )}

        <TouchableOpacity
          style={[styles.syncBtn, !canSync && styles.syncBtnDisabled]}
          onPress={flushPendingCaptures}
          disabled={!canSync}
          accessibilityLabel="Sync now">
          <Text style={[styles.syncBtnText, !canSync && styles.syncBtnTextDisabled]}>
            Sync now
          </Text>
        </TouchableOpacity>

        <View style={styles.demoRow}>
          <View style={styles.demoTextCol}>
            <Text style={styles.demoTitle}>Simulate server errors</Text>
            <Text style={styles.demoHint}>
              Demo only — uploads fail with 503 so you can see retry and error states
            </Text>
          </View>
          <Switch
            value={simulateErrors}
            onValueChange={toggleSimulateErrors}
            trackColor={{true: '#B91C1C', false: '#334155'}}
            accessibilityLabel="Simulate server errors"
          />
        </View>
      </View>

      <FlatList
        data={queue}
        keyExtractor={item => item.id}
        extraData={progress}
        renderItem={({item}) => (
          <CaptureCard
            capture={item}
            progress={progress[item.id]}
            onPress={() =>
              navigation.navigate('CaptureDetail', {captureId: item.id})
            }
            onRetry={retryCapture}
            onDelete={deleteCapture}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>Nothing to sync</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#0F172A'},
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  statusDot: {width: 8, height: 8, borderRadius: 4},
  statusDotOnline: {backgroundColor: '#34D399'},
  statusDotOffline: {backgroundColor: '#F87171'},
  statusText: {fontSize: 14, color: '#CBD5E1', flex: 1},
  errorText: {fontSize: 12, color: '#FCA5A5', marginTop: 8},
  syncBtn: {
    marginTop: 14,
    backgroundColor: '#1D4ED8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  syncBtnDisabled: {backgroundColor: '#1E293B'},
  syncBtnText: {color: '#BFDBFE', fontWeight: '700', fontSize: 15},
  syncBtnTextDisabled: {color: '#475569'},
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#334155',
  },
  demoTextCol: {flex: 1},
  demoTitle: {fontSize: 14, fontWeight: '700', color: '#E2E8F0'},
  demoHint: {fontSize: 11, color: '#64748B', marginTop: 2},
  list: {padding: 16, flexGrow: 1},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80},
  emptyIcon: {fontSize: 48, marginBottom: 12},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: '#475569'},
});
