import React, {useLayoutEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import Video from 'react-native-video';
import {useSyncContext} from '../context/SyncContext';
import {RootStackScreenProps} from '../navigation/types';
import {SyncBadge} from '../components/SyncBadge';
import {Attachment, CAPTURE_TYPE_LABELS, PRIORITY_LABELS} from '../types';
import {formatBytes, formatDuration, formatTimestamp} from '../utils/helpers';
import {attachmentUri} from '../services/MediaService';

export const CaptureDetailScreen: React.FC<
  RootStackScreenProps<'CaptureDetail'>
> = ({navigation, route}) => {
  const {captures, retryCapture, deleteCapture} = useSyncContext();
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

  const priorityCfg = PRIORITY_LABELS[capture.priority];

  const handleDelete = () => {
    Alert.alert('Delete capture?', 'This cannot be undone.', [
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

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.headerRow}>
        <Text style={styles.projectName}>{capture.projectName}</Text>
        <SyncBadge
          status={capture.syncStatus}
          errorMessage={capture.errorMessage}
          retryCount={capture.retryCount}
        />
      </View>

      <Row label="Location" value={`📍 ${capture.location}`} />
      <Row
        label="Priority"
        value={priorityCfg.label}
        valueStyle={{color: priorityCfg.color}}
      />
      {capture.workerCount ? (
        <Row label="Workers on Site" value={`👷 ${capture.workerCount}`} />
      ) : null}
      {capture.weather ? <Row label="Weather" value={capture.weather} /> : null}
      <Row label="Captured" value={formatTimestamp(capture.capturedAt)} />
      {capture.syncedAt ? (
        <Row label="Synced" value={formatTimestamp(capture.syncedAt)} />
      ) : null}
      {capture.errorMessage && capture.syncStatus !== 'synced' ? (
        <Row
          label="Last Error"
          value={capture.errorMessage}
          valueStyle={styles.errorText}
        />
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Notes</Text>
        <Text style={styles.notes}>{capture.notes || '—'}</Text>
      </View>

      {capture.attachments?.length ? (
        <View style={styles.field}>
          <Text style={styles.label}>
            Photos & Videos ({capture.attachments.length})
          </Text>
          {capture.attachments.map(a => (
            <MediaItem key={a.id} attachment={a} />
          ))}
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        {capture.syncStatus === 'error' && (
          <TouchableOpacity
            style={[styles.btn, styles.retryBtn]}
            onPress={() => retryCapture(capture.id)}
            accessibilityLabel="Retry sync">
            <Text style={styles.retryBtnText}>↺ Retry Sync</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.btn, styles.deleteBtn]}
          onPress={handleDelete}
          accessibilityLabel="Delete capture">
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const MediaItem: React.FC<{attachment: Attachment}> = ({attachment: a}) => {
  const aspectRatio = a.width && a.height ? a.width / a.height : a.kind === 'video' ? 16 / 9 : 4 / 3;
  const uri = attachmentUri(a);
  const meta = [
    a.kind === 'video' ? 'Video' : 'Photo',
    a.durationSec != null ? formatDuration(a.durationSec) : null,
    a.sizeBytes ? formatBytes(a.sizeBytes) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.mediaItem}>
      {a.kind === 'video' ? (
        <Video
          source={{uri}}
          style={[styles.media, {aspectRatio}]}
          controls
          paused
          resizeMode="contain"
        />
      ) : (
        <Image source={{uri}} style={[styles.media, {aspectRatio}]} resizeMode="contain" />
      )}
      <View style={styles.mediaMetaRow}>
        <Text style={styles.mediaMeta}>{meta}</Text>
        <Text style={[styles.mediaMeta, a.remoteUrl ? styles.uploaded : styles.notUploaded]}>
          {a.remoteUrl ? '☁️ Uploaded' : '⏳ Not uploaded yet'}
        </Text>
      </View>
    </View>
  );
};

const Row: React.FC<{
  label: string;
  value: string;
  valueStyle?: object;
}> = ({label, value, valueStyle}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, valueStyle]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: {padding: 20, paddingBottom: 48},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  projectName: {fontSize: 22, fontWeight: '800', color: '#F1F5F9', flex: 1},
  field: {marginBottom: 16},
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {fontSize: 15, color: '#F1F5F9'},
  errorText: {color: '#FCA5A5'},
  notes: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 22,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
  },
  mediaItem: {marginBottom: 12},
  media: {
    width: '100%',
    maxHeight: 420,
    borderRadius: 12,
    backgroundColor: '#020617',
  },
  mediaMetaRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 6},
  mediaMeta: {fontSize: 12, color: '#94A3B8'},
  uploaded: {color: '#34D399'},
  notUploaded: {color: '#F59E0B'},
  buttonRow: {flexDirection: 'row', gap: 12, marginTop: 8},
  btn: {flex: 1, paddingVertical: 15, borderRadius: 14, alignItems: 'center'},
  retryBtn: {backgroundColor: '#1D4ED8'},
  retryBtnText: {color: '#BFDBFE', fontWeight: '700', fontSize: 15},
  deleteBtn: {backgroundColor: '#450A0A', borderWidth: 1, borderColor: '#7F1D1D'},
  deleteBtnText: {color: '#FCA5A5', fontWeight: '700', fontSize: 15},
  missing: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  missingText: {color: '#64748B', fontSize: 15},
});
