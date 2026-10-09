import React, {useLayoutEffect} from 'react';
import {Alert, ScrollView, Text, View} from 'react-native';
import {MapPin, Pencil, RotateCw, Trash2} from 'lucide-react-native';
import {useSyncContext} from '../context/SyncContext';
import {RootStackScreenProps} from '../navigation/types';
import {SyncBadge} from '../components/SyncBadge';
import {MediaCarousel} from '../components/MediaCarousel';
import {
  Button,
  CaptureTypeIcon,
  ICON_STROKE,
  ProgressBar,
  SectionHeader,
} from '../components/ui';
import {CAPTURE_TYPE_LABELS, FieldCapture, PRIORITY_LABELS} from '../types';
import {formatTimestamp} from '../utils/helpers';
import {useTheme} from '../theme';
import {READING_WIDTH, useLayout} from '../theme/layout';
import {useCaptureDetailScreenStyles} from '../styles/screens/CaptureDetailScreen.styles';

const WIDE_WIDTH = 1180;

const statusDetail = (c: FieldCapture, isOnline: boolean): string => {
  switch (c.syncStatus) {
    case 'synced':
      return c.syncedAt
        ? `Uploaded ${formatTimestamp(c.syncedAt).toLowerCase()}`
        : 'Uploaded';
    case 'syncing':
      return 'Uploading now…';
    case 'error':
      return c.errorMessage ?? 'Upload failed.';
    case 'pending':
      if (c.retryCount > 0) {
        return `Attempt ${c.retryCount} failed — trying again shortly.`;
      }
      if (c.syncedVersion != null) {
        return isOnline
          ? 'Your changes are queued for upload.'
          : 'Changes saved on this device. They upload when you reconnect.';
      }
      return isOnline
        ? 'Queued for upload.'
        : 'Saved on this device. Uploads when you reconnect.';
  }
};

export const CaptureDetailScreen: React.FC<
  RootStackScreenProps<'CaptureDetail'>
> = ({navigation, route}) => {
  const styles = useCaptureDetailScreenStyles();
  const {colors} = useTheme();
  const {captures, progress, isOnline, retryCapture, deleteCapture} =
    useSyncContext();
  const {sizeClass, gutter} = useLayout();
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
    Alert.alert(
      'Delete this capture?',
      'It will be removed from this device. This can’t be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            navigation.goBack();
            await deleteCapture(capture.id);
          },
        },
      ],
    );
  };

  const attachments = capture.attachments ?? [];
  const twoColumn = sizeClass === 'expanded' && attachments.length > 0;
  const details = [
    {
      label: 'Priority',
      value: PRIORITY_LABELS[capture.priority],
      color: colors.priority[capture.priority],
    },
    capture.workerCount && {
      label: 'Workers on site',
      value: String(capture.workerCount),
    },
    capture.weather && {label: 'Weather', value: capture.weather},
    {label: 'Captured', value: formatTimestamp(capture.capturedAt)},
    capture.updatedAt && {
      label: 'Last edited',
      value: formatTimestamp(capture.updatedAt),
    },
  ].filter(Boolean) as {label: string; value: string; color?: string}[];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          padding: gutter,
          maxWidth: twoColumn ? WIDE_WIDTH : READING_WIDTH + gutter * 2,
        },
      ]}>
      <View style={[styles.columns, twoColumn && styles.columnsWide]}>
        <View style={[styles.column, twoColumn && styles.infoColumn]}>
          <View style={styles.titleBlock}>
            <CaptureTypeIcon captureType={capture.captureType} size={44} />
            <View style={styles.titleText}>
              <Text style={styles.title}>{capture.projectName}</Text>
              <View style={styles.locationRow}>
                <MapPin
                  size={14}
                  color={colors.textSecondary}
                  strokeWidth={ICON_STROKE}
                />
                <Text style={styles.location}>{capture.location}</Text>
              </View>
            </View>
            <Button
              title="Edit"
              icon={Pencil}
              size="sm"
              variant="secondary"
              onPress={() =>
                navigation.navigate('EditCapture', {captureId: capture.id})
              }
              accessibilityLabel="Edit capture"
            />
          </View>

          <View style={styles.card}>
            <SyncBadge
              status={capture.syncStatus}
              retryCount={capture.retryCount}
            />
            <Text
              style={[
                styles.statusDetail,
                capture.syncStatus === 'error' && {color: colors.status.error},
              ]}>
              {statusDetail(capture, isOnline)}
            </Text>
            {capture.syncStatus === 'syncing' &&
            progress[capture.id] != null ? (
              <ProgressBar progress={progress[capture.id]} />
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

          <View style={styles.section}>
            <SectionHeader title="Details" />
            <View style={styles.group}>
              {details.map(({label, value, color}, i) => (
                <View
                  key={label}
                  style={[styles.row, i > 0 && styles.rowDivider]}>
                  <Text style={styles.rowLabel}>{label}</Text>
                  <Text style={[styles.rowValue, color ? {color} : null]}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {capture.notes ? (
            <View style={styles.section}>
              <SectionHeader title="Notes" />
              <View style={styles.card}>
                <Text style={styles.notes}>{capture.notes}</Text>
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
        </View>
        {attachments.length > 0 ? (
          <View style={[styles.column, twoColumn && styles.mediaColumn]}>
            <SectionHeader title={`Photos & videos · ${attachments.length}`} />
            <MediaCarousel
              attachments={attachments}
              onOpen={index =>
                navigation.navigate('MediaViewer', {
                  captureId: capture.id,
                  index,
                })
              }
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};
