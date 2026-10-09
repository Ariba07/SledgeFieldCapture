import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {FieldCapture} from '../types';
import {SyncBadge} from './SyncBadge';
import {formatTimestamp} from '../utils/helpers';

interface Props {
  capture: FieldCapture;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CaptureCard: React.FC<Props> = ({capture, onRetry, onDelete}) => {
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 7,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.card, {transform: [{scale: scaleAnim}]}]}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.projectName} numberOfLines={1}>
            {capture.projectName}
          </Text>
          <Text style={styles.timestamp}>
            📍 {capture.location} · {formatTimestamp(capture.capturedAt)}
          </Text>
        </View>
        <SyncBadge
          status={capture.syncStatus}
          errorMessage={capture.errorMessage}
        />
      </View>

      {/* Notes */}
      {capture.notes ? (
        <Text style={styles.notes} numberOfLines={3}>
          {capture.notes}
        </Text>
      ) : null}

      {/* Action buttons */}
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 10,
  },
  headerLeft: {flex: 1, marginRight: 8},
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  timestamp: {fontSize: 12, color: '#94A3B8'},
  notes: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  retryBtn: {backgroundColor: '#1D4ED8'},
  retryBtnText: {color: '#BFDBFE', fontWeight: '600', fontSize: 13},
  deleteBtn: {backgroundColor: '#374151'},
  deleteBtnText: {color: '#9CA3AF', fontWeight: '600', fontSize: 13},
});
