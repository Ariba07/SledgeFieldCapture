import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {Check, Play, X} from 'lucide-react-native';
import {Attachment} from '../types';
import {attachmentUri} from '../services/MediaService';
import {formatDuration} from '../utils/helpers';
import {useAttachmentThumbStyles} from '../styles/components/AttachmentThumb.styles';

interface Props {
  attachment: Attachment;
  size: number;
  onRemove?: (attachment: Attachment) => void;
}

export const AttachmentThumb: React.FC<Props> = ({attachment, size, onRemove}) => {
  const styles = useAttachmentThumbStyles();
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
