import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {RotateCw} from 'lucide-react-native';
import {FieldCapture, CAPTURE_TYPE_LABELS, PRIORITY_LABELS} from '../types';
import {SyncBadge} from './SyncBadge';
import {AttachmentThumb} from './AttachmentThumb';
import {Button, CaptureTypeIcon} from './ui';
import {formatTimestamp} from '../utils/helpers';
import {makeStyles, radius, spacing, type, useTheme} from '../theme';

interface Props {
  capture: FieldCapture;
  /** Media upload progress (0…1) while this capture is syncing. */
  progress?: number;
  onPress: () => void;
  onRetry: (id: string) => void;
}

const MAX_THUMBS = 4;

export const CaptureCard: React.FC<Props> = ({capture, progress, onPress, onRetry}) => {
  const styles = useStyles();
  const {colors} = useTheme();
  const attachments = capture.attachments ?? [];
  const extraCount = attachments.length - MAX_THUMBS;
  const percent = progress != null ? Math.round(progress * 100) : null;
  const showProgress = capture.syncStatus === 'syncing' && percent != null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${CAPTURE_TYPE_LABELS[capture.captureType]}, ${capture.projectName}`}
      style={({pressed}) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <CaptureTypeIcon captureType={capture.captureType} />
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {capture.projectName}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {CAPTURE_TYPE_LABELS[capture.captureType]} · {capture.location}
          </Text>
        </View>
        <SyncBadge status={capture.syncStatus} retryCount={capture.retryCount} />
      </View>

      {capture.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {capture.notes}
        </Text>
      ) : null}

      {attachments.length > 0 ? (
        <View style={styles.thumbRow}>
          {attachments.slice(0, MAX_THUMBS).map(a => (
            <AttachmentThumb key={a.id} attachment={a} size={56} />
          ))}
          {extraCount > 0 ? (
            <View style={styles.moreTile}>
              <Text style={styles.moreText}>+{extraCount}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {showProgress ? (
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${percent}%`}]} />
          </View>
          <Text style={styles.progressText}>{percent}%</Text>
        </View>
      ) : null}

      <Text style={styles.meta} numberOfLines={1}>
        {formatTimestamp(capture.capturedAt)}
        {capture.priority !== 'low' ? (
          <Text style={{color: colors.priority[capture.priority]}}>
            {'  ·  '}
            {PRIORITY_LABELS[capture.priority]} priority
          </Text>
        ) : null}
      </Text>

      {capture.syncStatus === 'error' ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText} numberOfLines={2}>
            {capture.errorMessage ?? 'Upload failed.'}
          </Text>
          <Button
            title="Retry"
            icon={RotateCw}
            size="sm"
            variant="secondary"
            onPress={() => onRetry(capture.id)}
            accessibilityLabel="Retry sync"
          />
        </View>
      ) : null}
    </Pressable>
  );
};

const useStyles = makeStyles(c => ({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pressed: {backgroundColor: c.surfaceMuted},
  header: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  headerText: {flex: 1},
  title: {...type.headline, color: c.text},
  subtitle: {...type.footnote, color: c.textSecondary, marginTop: 1},
  notes: {...type.subhead, color: c.textBody},
  thumbRow: {flexDirection: 'row', gap: 6},
  moreTile: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {...type.label, color: c.textSecondary},
  progressRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {height: 4, borderRadius: 2, backgroundColor: c.status.syncing},
  progressText: {
    ...type.caption,
    color: c.textSecondary,
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'right',
  },
  meta: {...type.caption, color: c.textTertiary},
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  errorText: {...type.footnote, color: c.status.error, flex: 1},
}));
