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
import {useTheme} from '../theme';
import {
  useMediaCarouselStyles,
  GAP,
} from '../styles/components/MediaCarousel.styles';

interface Props {
  attachments: Attachment[];
  onOpen: (index: number) => void;
}

const MAX_HEIGHT = 440;

export const MediaCarousel: React.FC<Props> = ({attachments, onOpen}) => {
  const styles = useMediaCarouselStyles();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const multiple = attachments.length > 1;

  const itemWidth = multiple ? Math.round(width * 0.86) : width;
  const single = attachments[0];
  const singleRatio =
    single?.width && single?.height
      ? single.width / single.height
      : single?.kind === 'video'
      ? 16 / 9
      : 4 / 3;
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
        <View
          style={styles.dots}
          accessibilityLabel={`Item ${active + 1} of ${attachments.length}`}>
          {attachments.map((a, i) => (
            <View
              key={a.id}
              style={[styles.dot, i === active && styles.dotActive]}
            />
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
  const styles = useMediaCarouselStyles();
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
          <Video
            source={{uri}}
            style={styles.fill}
            controls
            paused
            resizeMode="contain"
          />
          {/* Tapping a video drives its controls, so full screen gets its own button. */}
          <Pressable
            onPress={onOpen}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="View video full screen"
            style={({pressed}) => [
              styles.expand,
              pressed && styles.expandPressed,
            ]}>
            <Maximize2 size={16} color="#FFFFFF" strokeWidth={2.25} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onOpen}
          accessibilityRole="imagebutton"
          accessibilityLabel="View photo full screen"
          style={({pressed}) => [
            styles.frame,
            {height},
            pressed && styles.pressed,
          ]}>
          <Image source={{uri}} style={styles.fill} resizeMode="cover" />
        </Pressable>
      )}
      <View style={styles.meta}>
        <Text style={styles.metaText} numberOfLines={1}>
          {meta}
        </Text>
        <Text
          style={[
            styles.metaText,
            {color: a.remoteUrl ? colors.status.synced : colors.textTertiary},
          ]}>
          {a.remoteUrl ? 'Uploaded' : 'Not uploaded'}
        </Text>
      </View>
    </View>
  );
};
