import React, {useState} from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Video from 'react-native-video';
import {Maximize2} from 'lucide-react-native';
import {Attachment} from '../types';
import {attachmentUri} from '../services/MediaService';
import {formatBytes, formatDuration} from '../utils/helpers';
import {makeStyles, radius, spacing, type, useTheme} from '../theme';

interface Props {
  attachments: Attachment[];
  /** Open the full-screen viewer at this index. */
  onOpen: (index: number) => void;
}

const GAP = spacing.md;
const MAX_HEIGHT = 440;

/**
 * One item: full width at its natural aspect ratio.
 * Several: a horizontal carousel that snaps per item, with the next item
 * peeking in so it's obvious there's more, plus page dots.
 */
export const MediaCarousel: React.FC<Props> = ({attachments, onOpen}) => {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const multiple = attachments.length > 1;

  const itemWidth = multiple ? Math.round(width * 0.86) : width;
  const single = attachments[0];
  const singleRatio =
    single?.width && single?.height ? single.width / single.height : single?.kind === 'video' ? 16 / 9 : 4 / 3;
  const itemHeight = multiple
    ? Math.min(Math.round((itemWidth * 3) / 4), MAX_HEIGHT)
    : Math.min(Math.round(itemWidth / singleRatio), MAX_HEIGHT);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setActive(Math.round(e.nativeEvent.contentOffset.x / (itemWidth + GAP)));

  return (
    <View onLayout={e => setWidth(Math.round(e.nativeEvent.layout.width))}>
      {width > 0 ? (
        <ScrollView
          horizontal
          scrollEnabled={multiple}
          snapToInterval={itemWidth + GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          contentContainerStyle={styles.track}>
          {attachments.map((a, i) => (
            <MediaTile
              key={a.id}
              attachment={a}
              width={itemWidth}
              height={itemHeight}
              onOpen={() => onOpen(i)}
            />
          ))}
        </ScrollView>
      ) : null}

      {multiple ? (
        <View style={styles.dots} accessibilityLabel={`Item ${active + 1} of ${attachments.length}`}>
          {attachments.map((a, i) => (
            <View key={a.id} style={[styles.dot, i === active && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const MediaTile: React.FC<{
  attachment: Attachment;
  width: number;
  height: number;
  onOpen: () => void;
}> = ({attachment: a, width, height, onOpen}) => {
  const styles = useStyles();
  const {colors} = useTheme();
  const uri = attachmentUri(a);
  const meta = [
    a.kind === 'video' ? 'Video' : 'Photo',
    a.durationSec != null ? formatDuration(a.durationSec) : null,
    a.sizeBytes ? formatBytes(a.sizeBytes) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={{width}}>
      {a.kind === 'video' ? (
        <View style={[styles.frame, {height}]}>
          <Video source={{uri}} style={styles.fill} controls paused resizeMode="contain" />
          {/* Tapping a video drives its controls, so full screen gets its own button. */}
          <Pressable
            onPress={onOpen}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="View video full screen"
            style={({pressed}) => [styles.expand, pressed && styles.expandPressed]}>
            <Maximize2 size={16} color="#FFFFFF" strokeWidth={2.25} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onOpen}
          accessibilityRole="imagebutton"
          accessibilityLabel="View photo full screen"
          style={({pressed}) => [styles.frame, {height}, pressed && styles.pressed]}>
          <Image source={{uri}} style={styles.fill} resizeMode="cover" />
        </Pressable>
      )}
      <View style={styles.meta}>
        <Text style={styles.metaText} numberOfLines={1}>
          {meta}
        </Text>
        <Text
          style={[styles.metaText, {color: a.remoteUrl ? colors.status.synced : colors.textTertiary}]}>
          {a.remoteUrl ? 'Uploaded' : 'Not uploaded'}
        </Text>
      </View>
    </View>
  );
};

const useStyles = makeStyles(c => ({
  track: {gap: GAP},
  frame: {
    width: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: c.surfaceMuted,
  },
  fill: {flex: 1},
  pressed: {opacity: 0.85},
  expand: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandPressed: {backgroundColor: 'rgba(0,0,0,0.75)'},
  meta: {flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.sm},
  metaText: {...type.caption, color: c.textSecondary},
  dots: {flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md},
  dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: c.borderStrong},
  dotActive: {backgroundColor: c.primary, width: 18},
}));
