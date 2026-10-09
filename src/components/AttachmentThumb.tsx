import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Attachment} from '../types';
import {attachmentUri} from '../services/MediaService';
import {formatDuration} from '../utils/helpers';

interface Props {
  attachment: Attachment;
  size: number;
  onRemove?: (attachment: Attachment) => void;
}

/** Square preview: the photo itself, or a play tile with the video's length. */
export const AttachmentThumb: React.FC<Props> = ({attachment, size, onRemove}) => (
  <View style={[styles.thumb, {width: size, height: size}]}>
    {attachment.kind === 'photo' ? (
      <Image source={{uri: attachmentUri(attachment)}} style={StyleSheet.absoluteFill} />
    ) : (
      <View style={[StyleSheet.absoluteFill, styles.videoTile]}>
        <Text style={[styles.play, {fontSize: size * 0.3}]}>▶</Text>
      </View>
    )}

    {attachment.kind === 'video' && attachment.durationSec != null && size >= 56 ? (
      <Text style={styles.duration}>{formatDuration(attachment.durationSec)}</Text>
    ) : null}

    {attachment.remoteUrl ? (
      <View style={styles.uploadedDot} accessibilityLabel="Uploaded" />
    ) : null}

    {onRemove ? (
      <TouchableOpacity
        style={styles.remove}
        onPress={() => onRemove(attachment)}
        hitSlop={8}
        accessibilityLabel={`Remove ${attachment.kind}`}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  thumb: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  videoTile: {
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {color: '#E2E8F0'},
  duration: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    fontSize: 10,
    fontWeight: '700',
    color: '#F1F5F9',
    backgroundColor: '#00000099',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  uploadedDot: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#000000B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {color: '#F1F5F9', fontSize: 11, fontWeight: '800'},
});
