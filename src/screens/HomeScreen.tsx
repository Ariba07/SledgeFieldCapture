import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSyncContext} from '../context/SyncContext';
import {CaptureCard} from '../components/CaptureCard';
import {NetworkBanner} from '../components/NetworkBanner';
import {MainTabScreenProps} from '../navigation/types';

export const HomeScreen: React.FC<MainTabScreenProps<'Captures'>> = ({
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

  const pendingCount = captures.filter(
    c => c.syncStatus === 'pending' || c.syncStatus === 'error',
  ).length;
  const syncedCount = captures.filter(c => c.syncStatus === 'synced').length;

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No captures yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to record a field observation
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Slide-in network banner */}
      <NetworkBanner
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>⚡ Sledge</Text>
          <Text style={styles.headerSub}>Field Capture</Text>
        </View>

        {/* Online / Offline pill */}
        <View
          style={[
            styles.statusPill,
            isOnline ? styles.statusPillOnline : styles.statusPillOffline,
          ]}>
          <View
            style={[
              styles.statusDot,
              isOnline ? styles.statusDotOnline : styles.statusDotOffline,
            ]}
          />
          <Text
            style={[
              styles.statusLabel,
              isOnline ? styles.statusLabelOnline : styles.statusLabelOffline,
            ]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{captures.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, styles.pendingColor]}>
            {pendingCount}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, styles.syncedColor]}>
            {syncedCount}
          </Text>
          <Text style={styles.statLabel}>Synced</Text>
        </View>

        {/* Manual sync button */}
        {isOnline && pendingCount > 0 && !isSyncing && (
          <TouchableOpacity
            style={styles.syncNowBtn}
            onPress={flushPendingCaptures}
            accessibilityLabel="Sync now">
            <Text style={styles.syncNowText}>Sync now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Capture list ── */}
      <FlatList
        data={captures}
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
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewCapture')}
        accessibilityLabel="New capture">
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#0F172A'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: -0.5,
  },
  headerSub: {fontSize: 13, color: '#64748B', marginTop: 1},
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {width: 7, height: 7, borderRadius: 4},
  statusLabel: {fontSize: 13, fontWeight: '700'},
  statusPillOnline: {backgroundColor: '#064E3B'},
  statusPillOffline: {backgroundColor: '#450A0A'},
  statusDotOnline: {backgroundColor: '#34D399'},
  statusDotOffline: {backgroundColor: '#F87171'},
  statusLabelOnline: {color: '#6EE7B7'},
  statusLabelOffline: {color: '#FCA5A5'},
  pendingColor: {color: '#FBBF24'},
  syncedColor: {color: '#34D399'},
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1E293B',
    gap: 20,
  },
  statBox: {alignItems: 'center'},
  statValue: {fontSize: 22, fontWeight: '800', color: '#F1F5F9'},
  statLabel: {fontSize: 11, color: '#64748B', marginTop: 1},
  syncNowBtn: {
    marginLeft: 'auto',
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  syncNowText: {color: '#BFDBFE', fontWeight: '700', fontSize: 13},
  list: {padding: 16, flexGrow: 1},
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {fontSize: 48, marginBottom: 12},
  emptyTitle: {fontSize: 18, fontWeight: '700', color: '#475569'},
  emptySubtitle: {
    fontSize: 14,
    color: '#334155',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {fontSize: 28, color: '#fff', fontWeight: '300', lineHeight: 34},
});
