import React, {useLayoutEffect} from 'react';
import {Alert, Image, ScrollView, Text, View} from 'react-native';
import Video from 'react-native-video';
import {MapPin, RotateCw, Trash2} from 'lucide-react-native';
import {useSyncContext} from '../context/SyncContext';
import {RootStackScreenProps} from '../navigation/types';
import {SyncBadge} from '../components/SyncBadge';
import {Button, CaptureTypeIcon, ICON_STROKE, SectionHeader} from '../components/ui';
import {Attachment, CAPTURE_TYPE_LABELS, FieldCapture, PRIORITY_LABELS} from '../types';
import {formatBytes, formatDuration, formatTimestamp} from '../utils/helpers';
import {attachmentUri} from '../services/MediaService';
import {makeStyles, radius, spacing, type, useTheme} from '../theme';

const statusDetail = (c: FieldCapture, isOnline: boolean): string => {
  switch (c.syncStatus) {
    case 'synced':
      return c.syncedAt ? `Uploaded ${formatTimestamp(c.syncedAt).toLowerCase()}` : 'Uploaded';
    case 'syncing':
      return 'Uploading now…';
    case 'error':
      return c.errorMessage ?? 'Upload failed.';
    case 'pending':
      if (c.retryCount > 0) {
        return `Attempt ${c.retryCount} failed — trying again shortly.`;
      }
      return isOnline ? 'Queued for upload.' : 'Saved on this device. Uploads when you reconnect.';
  }
};

export const CaptureDetailScreen: React.FC<RootStackScreenProps<'CaptureDetail'>> = ({
  navigation,
  route,
}) => {
  const styles = useStyles();
  const {colors} = useTheme();
  const {captures, progress, isOnline, retryCapture, deleteCapture} = useSyncContext();
  const capture = captures.find(c => c.id === route.params.captureId);

  useLayoutEffect(() => {
    if (capture) {
      navigation.setOptions({title: CAPTURE_TYPE_LABELS[capture.captureType]});
    }
  }, [navigation, capture]);

  if (!capture) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This capture no longer exists.</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete this capture?', 'It will be removed from this device. This can’t be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          navigation.goBack();
          await deleteCapture(capture.id);
        },
      },
    ]);
  };

  const percent = progress[capture.id] != null ? Math.round(progress[capture.id] * 100) : null;
  const details: [string, string, string?][] = [
    ['Priority', PRIORITY_LABELS[capture.priority], colors.priority[capture.priority]],
    ...(capture.workerCount
      ? ([['Workers on site', String(capture.workerCount)]] as [string, string][])
      : []),
    ...(capture.weather ? ([['Weather', capture.weather]] as [string, string][]) : []),
    ['Captured', formatTimestamp(capture.capturedAt)],
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Title */}
      <View style={styles.titleBlock}>
        <CaptureTypeIcon captureType={capture.captureType} size={44} />
        <View style={styles.titleText}>
          <Text style={styles.title}>{capture.projectName}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color={colors.textSecondary} strokeWidth={ICON_STROKE} />
            <Text style={styles.location}>{capture.location}</Text>
          </View>
        </View>
      </View>

      {/* Sync status */}
      <View style={styles.card}>
        <SyncBadge status={capture.syncStatus} retryCount={capture.retryCount} />
        <Text
          style={[
            styles.statusDetail,
            capture.syncStatus === 'error' && {color: colors.status.error},
          ]}>
          {statusDetail(capture, isOnline)}
        </Text>
        {capture.syncStatus === 'syncing' && percent != null ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${percent}%`}]} />
          </View>
        ) : null}
        {capture.syncStatus === 'error' ? (
          <Button
            title="Retry upload"
            icon={RotateCw}
            onPress={() => retryCapture(capture.id)}
            style={styles.retryButton}
          />
        ) : null}
      </View>

      {/* Details */}
      <View style={styles.section}>
        <SectionHeader title="Details" />
        <View style={styles.group}>
          {details.map(([label, value, color], i) => (
            <View key={label} style={[styles.row, i > 0 && styles.rowDivider]}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={[styles.rowValue, color ? {color} : null]}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Notes */}
      {capture.notes ? (
        <View style={styles.section}>
          <SectionHeader title="Notes" />
          <View style={styles.card}>
            <Text style={styles.notes}>{capture.notes}</Text>
          </View>
        </View>
      ) : null}

      {/* Media */}
      {capture.attachments?.length ? (
        <View style={styles.section}>
          <SectionHeader title={`Photos & videos · ${capture.attachments.length}`} />
          <View style={styles.mediaList}>
            {capture.attachments.map(a => (
              <MediaItem key={a.id} attachment={a} />
            ))}
          </View>
        </View>
      ) : null}

      <Button
        title="Delete capture"
        icon={Trash2}
        variant="destructive"
        onPress={handleDelete}
        style={styles.deleteButton}
      />
    </ScrollView>
  );
};

const MediaItem: React.FC<{attachment: Attachment}> = ({attachment: a}) => {
  const styles = useStyles();
  const {colors} = useTheme();
  const aspectRatio =
    a.width && a.height ? a.width / a.height : a.kind === 'video' ? 16 / 9 : 4 / 3;
  const uri = attachmentUri(a);
  const meta = [
    a.kind === 'video' ? 'Video' : 'Photo',
    a.durationSec != null ? formatDuration(a.durationSec) : null,
    a.sizeBytes ? formatBytes(a.sizeBytes) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View>
      {a.kind === 'video' ? (
        <Video
          source={{uri}}
          style={[styles.media, {aspectRatio}]}
          controls
          paused
          resizeMode="contain"
        />
      ) : (
        <Image source={{uri}} style={[styles.media, {aspectRatio}]} resizeMode="cover" />
      )}
      <View style={styles.mediaMeta}>
        <Text style={styles.mediaMetaText}>{meta}</Text>
        <Text
          style={[
            styles.mediaMetaText,
            {color: a.remoteUrl ? colors.status.synced : colors.textTertiary},
          ]}>
          {a.remoteUrl ? 'Uploaded' : 'Not uploaded'}
        </Text>
      </View>
    </View>
  );
};

const useStyles = makeStyles(c => ({
  screen: {flex: 1, backgroundColor: c.background},
  content: {padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.xl},
  titleBlock: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  titleText: {flex: 1},
  title: {...type.title, fontSize: 22, lineHeight: 28, color: c.text},
  locationRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2},
  location: {...type.subhead, color: c.textSecondary},
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statusDetail: {...type.subhead, color: c.textBody},
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: c.surfaceMuted,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {height: 4, borderRadius: 2, backgroundColor: c.status.syncing},
  retryButton: {marginTop: spacing.sm},
  section: {},
  group: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    gap: spacing.lg,
  },
  rowDivider: {borderTopWidth: 1, borderTopColor: c.border},
  rowLabel: {...type.callout, color: c.textSecondary},
  rowValue: {...type.callout, fontWeight: '500', color: c.text, flexShrink: 1, textAlign: 'right'},
  notes: {...type.body, color: c.textBody},
  mediaList: {gap: spacing.lg},
  media: {
    width: '100%',
    maxHeight: 440,
    borderRadius: radius.md,
    backgroundColor: c.surfaceMuted,
  },
  mediaMeta: {flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm},
  mediaMetaText: {...type.caption, color: c.textSecondary},
  deleteButton: {marginTop: spacing.sm},
  missing: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background},
  missingText: {...type.callout, color: c.textTertiary},
}));
