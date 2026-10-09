import React, {useMemo, useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ClipboardList, Plus} from 'lucide-react-native';
import {useSyncContext} from '../context/SyncContext';
import {CaptureGrid} from '../components/CaptureGrid';
import {NetworkBanner} from '../components/NetworkBanner';
import {Button, ICON_STROKE, SegmentedControl} from '../components/ui';
import {MainTabScreenProps} from '../navigation/types';
import {useTheme} from '../theme';
import {useLayout} from '../theme/layout';
import {useHomeScreenStyles} from '../styles/screens/HomeScreen.styles';

type Filter = 'all' | 'unsynced' | 'synced';

export const HomeScreen: React.FC<MainTabScreenProps<'Captures'>> = ({navigation}) => {
  const styles = useHomeScreenStyles();
  const {colors} = useTheme();
  const {captures, progress, isOnline, retryCapture} = useSyncContext();
  const {isCompact, gutter, insets} = useLayout();
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
        <View style={!isCompact && styles.filterWide}>
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          segments={[
            {value: 'all', label: `All ${captures.length}`},
            {value: 'unsynced', label: `Not synced ${unsynced.length}`},
            {value: 'synced', label: `Synced ${syncedCount}`},
          ]}
        />
        </View>
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
      <CaptureGrid
        data={visible}
        progress={progress}
        onOpen={id => navigation.navigate('CaptureDetail', {captureId: id})}
        onRetry={retryCapture}
        header={header}
        empty={empty}
        bottomPadding={112}
      />

      {captures.length > 0 ? (
        <Pressable
          onPress={openNew}
          accessibilityRole="button"
          accessibilityLabel="New capture"
          style={({pressed}) => [
            styles.fab,
            {right: gutter + insets.right},
            pressed && styles.fabPressed,
          ]}>
          <Plus size={20} color={colors.onPrimary} strokeWidth={2.5} />
          <Text style={styles.fabLabel}>New capture</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
};
