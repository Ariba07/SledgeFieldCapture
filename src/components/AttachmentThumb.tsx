import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {Check, Play, X} from 'lucide-react-native';
import {Attachment} from '../types';
import {attachmentUri} from '../services/MediaService';
import {formatDuration} from '../utils/helpers';
import {makeStyles, radius} from '../theme';

interface Props {
  attachment: Attachment;
  size: number;
  onRemove?: (attachment: Attachment) => void;
}

/** Square preview: the photo itself, or a dark tile with a play glyph and the video's length. */
export const AttachmentThumb: React.FC<Props> = ({attachment, size, onRemove}) => {
  const styles = useStyles();
  const showMeta = size >= 56;

  return (
    <View style={[styles.thumb, {width: size, height: size}]}>
      {attachment.kind === 'photo' ? (
        <Image source={{uri: attachmentUri(attachment)}} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.videoTile]}>
          <Play size={size * 0.28} color="#FFFFFF" fill="#FFFFFF" />
        </View>
      )}

      {attachment.kind === 'video' && attachment.durationSec != null && showMeta ? (
        <Text style={styles.duration}>{formatDuration(attachment.durationSec)}</Text>
      ) : null}

      {attachment.remoteUrl && showMeta ? (
        <View style={styles.uploaded} accessibilityLabel="Uploaded">
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      ) : null}

      {onRemove ? (
        <Pressable
          style={styles.remove}
          onPress={() => onRemove(attachment)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${attachment.kind}`}>
          <X size={12} color="#FFFFFF" strokeWidth={3} />
        </Pressable>
      ) : null}
    </View>
  );
};

const useStyles = makeStyles(c => ({
  thumb: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: c.surfaceMuted,
  },
  videoTile: {
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: 4,
    left: 5,
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  uploaded: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: c.status.synced,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
