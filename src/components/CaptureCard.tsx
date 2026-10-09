import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {RotateCw} from 'lucide-react-native';
import {FieldCapture, CAPTURE_TYPE_LABELS, PRIORITY_LABELS} from '../types';
import {SyncBadge} from './SyncBadge';
import {AttachmentThumb} from './AttachmentThumb';
import {Button, CaptureTypeIcon} from './ui';
import {formatTimestamp} from '../utils/helpers';
import {useTheme} from '../theme';
import {useCaptureCardStyles} from '../styles/components/CaptureCard.styles';

interface Props {
  capture: FieldCapture;
  /** Media upload progress (0…1) while this capture is syncing. */
  progress?: number;
  onPress: () => void;
  onRetry: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const CaptureCard: React.FC<Props> = ({
  capture,
  progress,
  onPress,
  onRetry,
  style,
}) => {
  const styles = useCaptureCardStyles();
  const {colors} = useTheme();
  const navigation = useNavigation();
  const attachments = capture.attachments ?? [];
  const percent = progress != null ? Math.round(progress * 100) : null;
  const showProgress = capture.syncStatus === 'syncing' && percent != null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${CAPTURE_TYPE_LABELS[capture.captureType]}, ${
        capture.projectName
      }`}
      style={({pressed}) => [styles.card, pressed && styles.pressed, style]}>
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
        <SyncBadge
          status={capture.syncStatus}
          retryCount={capture.retryCount}
        />
      </View>

      {capture.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {capture.notes}
        </Text>
      ) : null}

      {attachments.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbRow}
          style={styles.thumbScroller}>
          {attachments.map((a, index) => (
            <Pressable
              key={a.id}
              onPress={() =>
                navigation.navigate('MediaViewer', {
                  captureId: capture.id,
                  index,
                })
              }
              accessibilityRole="imagebutton"
              accessibilityLabel={`View ${a.kind} ${index + 1} of ${
                attachments.length
              }`}
              style={({pressed}) => pressed && styles.thumbPressed}>
              <AttachmentThumb attachment={a} size={64} />
            </Pressable>
          ))}
        </ScrollView>
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
        {capture.updatedAt ? '  ·  Edited' : ''}
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
