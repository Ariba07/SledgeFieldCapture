import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {FieldCapture, CAPTURE_TYPE_LABELS, PRIORITY_LABELS} from '../types';
import {SyncBadge} from './SyncBadge';
import {formatTimestamp} from '../utils/helpers';

interface Props {
  capture: FieldCapture;
  onPress: () => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CaptureCard: React.FC<Props> = ({
  capture,
  onPress,
  onRetry,
  onDelete,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 7,
    }).start();
  }, [scaleAnim]);

  const priorityCfg = PRIORITY_LABELS[capture.priority];

  return (
    <Animated.View style={[styles.card, {transform: [{scale: scaleAnim}]}]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${capture.projectName}`}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Capture type pill */}
          <View style={styles.typePill}>
            <Text style={styles.typeText}>
              {CAPTURE_TYPE_LABELS[capture.captureType]}
            </Text>
          </View>
          <Text style={styles.projectName} numberOfLines={1}>
            {capture.projectName}
          </Text>
        </View>
        <SyncBadge
          status={capture.syncStatus}
          errorMessage={capture.errorMessage}
        />
      </View>

      {/* Meta row: location + priority + timestamp */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText} numberOfLines={1}>
          📍 {capture.location}
        </Text>
        <View style={[styles.priorityDot, {backgroundColor: priorityCfg.color}]} />
        <Text style={[styles.priorityLabel, {color: priorityCfg.color}]}>
          {priorityCfg.label}
        </Text>
      </View>

      {/* Daily log extras */}
      {capture.captureType === 'daily_log' &&
        (capture.workerCount || capture.weather) ? (
        <View style={styles.logExtras}>
          {capture.workerCount ? (
            <Text style={styles.extrasText}>👷 {capture.workerCount} workers</Text>
          ) : null}
          {capture.weather ? (
            <Text style={styles.extrasText}>{capture.weather}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Notes */}
      {capture.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {capture.notes}
        </Text>
      ) : null}

      </TouchableOpacity>

      {/* Footer: timestamp + actions */}
      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          {formatTimestamp(capture.capturedAt)}
          {capture.syncedAt ? ` · synced ${formatTimestamp(capture.syncedAt)}` : ''}
        </Text>
        <View style={styles.actions}>
          {capture.syncStatus === 'error' && (
            <TouchableOpacity
              style={[styles.btn, styles.retryBtn]}
              onPress={() => onRetry(capture.id)}
              accessibilityLabel="Retry sync">
              <Text style={styles.retryBtnText}>↺ Retry</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.btn, styles.deleteBtn]}
            onPress={() => onDelete(capture.id)}
            accessibilityLabel="Delete capture">
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerLeft: {flex: 1, marginRight: 8},
  typePill: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeText: {fontSize: 11, color: '#94A3B8', fontWeight: '600'},
  projectName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metaText: {fontSize: 12, color: '#64748B', flex: 1},
  priorityDot: {width: 6, height: 6, borderRadius: 3},
  priorityLabel: {fontSize: 11, fontWeight: '700'},
  logExtras: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  extrasText: {fontSize: 12, color: '#94A3B8'},
  notes: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 19,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {fontSize: 11, color: '#475569', flex: 1},
  actions: {flexDirection: 'row', gap: 6},
  btn: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8},
  retryBtn: {backgroundColor: '#1D4ED8'},
  retryBtnText: {color: '#BFDBFE', fontWeight: '600', fontSize: 12},
  deleteBtn: {backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155'},
  deleteBtnText: {color: '#6B7280', fontWeight: '600', fontSize: 12},
});
