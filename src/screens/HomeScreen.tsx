import React, {useMemo, useState} from 'react';
import {FlatList, Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ClipboardList, Plus} from 'lucide-react-native';
import {useSyncContext} from '../context/SyncContext';
import {CaptureCard} from '../components/CaptureCard';
import {NetworkBanner} from '../components/NetworkBanner';
import {Button, ICON_STROKE, SegmentedControl} from '../components/ui';
import {MainTabScreenProps} from '../navigation/types';
import {makeStyles, radius, spacing, type, useTheme} from '../theme';

type Filter = 'all' | 'unsynced' | 'synced';

export const HomeScreen: React.FC<MainTabScreenProps<'Captures'>> = ({navigation}) => {
  const styles = useStyles();
  const {colors} = useTheme();
  const {captures, progress, isOnline, retryCapture} = useSyncContext();
  const [filter, setFilter] = useState<Filter>('all');

  const unsynced = useMemo(() => captures.filter(c => c.syncStatus !== 'synced'), [captures]);
  const syncedCount = captures.length - unsynced.length;
  const visible =
    filter === 'all'
      ? captures
      : filter === 'unsynced'
      ? unsynced
      : captures.filter(c => c.syncStatus === 'synced');

  const openNew = () => navigation.navigate('NewCapture');

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <Text style={styles.largeTitle} accessibilityRole="header">
          Captures
        </Text>
        <View style={styles.connection}>
          <View
            style={[
              styles.dot,
              {backgroundColor: isOnline ? colors.status.synced : colors.textTertiary},
            ]}
          />
          <Text style={styles.connectionText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <NetworkBanner isOnline={isOnline} pendingCount={unsynced.length} />

      {captures.length > 0 ? (
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          segments={[
            {value: 'all', label: `All ${captures.length}`},
            {value: 'unsynced', label: `Not synced ${unsynced.length}`},
            {value: 'synced', label: `Synced ${syncedCount}`},
          ]}
        />
      ) : null}
    </View>
  );

  const empty =
    captures.length === 0 ? (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <ClipboardList size={28} color={colors.primary} strokeWidth={ICON_STROKE} />
        </View>
        <Text style={styles.emptyTitle}>No captures yet</Text>
        <Text style={styles.emptyBody}>
          Record daily logs, RFIs, punch items and issues on site — with or without
          signal.
        </Text>
        <Button title="New capture" icon={Plus} onPress={openNew} style={styles.emptyButton} />
      </View>
    ) : (
      <Text style={styles.filterEmpty}>
        {filter === 'unsynced' ? 'Everything is synced.' : 'Nothing has synced yet.'}
      </Text>
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={visible}
        keyExtractor={item => item.id}
        extraData={progress}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
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

      {captures.length > 0 ? (
        <Pressable
          onPress={openNew}
          accessibilityRole="button"
          accessibilityLabel="New capture"
          style={({pressed}) => [styles.fab, pressed && styles.fabPressed]}>
          <Plus size={20} color={colors.onPrimary} strokeWidth={2.5} />
          <Text style={styles.fabLabel}>New capture</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
};

const Separator = () => <View style={{height: spacing.md}} />;

const useStyles = makeStyles(c => ({
  safe: {flex: 1, backgroundColor: c.background},
  list: {paddingHorizontal: spacing.lg, paddingBottom: 112, flexGrow: 1},
  headerBlock: {gap: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg},
  titleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  largeTitle: {...type.largeTitle, color: c.text},
  connection: {flexDirection: 'row', alignItems: 'center', gap: 6},
  dot: {width: 8, height: 8, borderRadius: 4},
  connectionText: {...type.footnote, color: c.textSecondary},
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {...type.title, color: c.text},
  emptyBody: {
    ...type.callout,
    color: c.textBody,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  emptyButton: {marginTop: spacing.xl, alignSelf: 'stretch'},
  filterEmpty: {
    ...type.callout,
    color: c.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    height: 52,
    paddingHorizontal: spacing.xl - 4,
    borderRadius: radius.pill,
    backgroundColor: c.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },
  fabPressed: {opacity: 0.85},
  fabLabel: {...type.headline, color: c.onPrimary},
}));
