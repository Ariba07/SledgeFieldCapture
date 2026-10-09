import React, {useRef, useState} from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Video from 'react-native-video';
import {X} from 'lucide-react-native';
import {useSyncContext} from '../context/SyncContext';
import {RootStackScreenProps} from '../navigation/types';
import {Attachment} from '../types';
import {attachmentUri} from '../services/MediaService';
import {formatDuration} from '../utils/helpers';
import {makeStyles, spacing, type} from '../theme';

export const MediaViewerScreen: React.FC<RootStackScreenProps<'MediaViewer'>> = ({
  navigation,
  route,
}) => {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const {captures} = useSyncContext();
  const attachments = captures.find(c => c.id === route.params.captureId)?.attachments ?? [];
  const [requested, setIndex] = useState(route.params.index);
  // Clamp at render: the list can be empty for a moment while captures load.
  const index = Math.min(requested, Math.max(0, attachments.length - 1));
  const listRef = useRef<FlatList<Attachment>>(null);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  const current = attachments[index];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={listRef}
        // Remount on rotation (pages stay full width) and once media has loaded,
        // so initialScrollIndex lands on the current item.
        key={`viewer-${width}-${attachments.length}`}
        data={attachments}
        keyExtractor={a => a.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={index}
        getItemLayout={(_, i) => ({length: width, offset: width * i, index: i})}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({item, index: i}) => (
          <View style={{width, height}}>
            {item.kind === 'photo' ? (
              <ZoomablePhoto uri={attachmentUri(item)} width={width} height={height} />
            ) : (
              <Video
                source={{uri: attachmentUri(item)}}
                style={styles.fill}
                controls
                paused={i !== index}
                resizeMode="contain"
              />
            )}
          </View>
        )}
      />

      <View style={[styles.topBar, {paddingTop: insets.top + spacing.sm}]} pointerEvents="box-none">
        <Pressable
          onPress={navigation.goBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({pressed}) => [styles.close, pressed && styles.closePressed]}>
          <X size={22} color="#FFFFFF" strokeWidth={2.25} />
        </Pressable>
        <View style={styles.titleBlock} pointerEvents="none">
          {attachments.length > 1 ? (
            <Text style={styles.counter}>
              {index + 1} / {attachments.length}
            </Text>
          ) : null}
          {current ? (
            <Text style={styles.caption}>
              {current.kind === 'video'
                ? `Video${current.durationSec != null ? ` · ${formatDuration(current.durationSec)}` : ''}`
                : 'Photo'}
              {current.remoteUrl ? ' · Uploaded' : ' · Not uploaded yet'}
            </Text>
          ) : null}
        </View>
        <View style={styles.closeSpacer} />
      </View>
    </View>
  );
};

/** iOS ScrollView zooms natively; Android shows the photo fitted without zoom. */
const ZoomablePhoto: React.FC<{uri: string; width: number; height: number}> = ({
  uri,
  width,
  height,
}) => {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={{width, height}}
      maximumZoomScale={Platform.OS === 'ios' ? 4 : 1}
      minimumZoomScale={1}
      centerContent
      bouncesZoom
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}>
      <Image source={{uri}} style={{width, height}} resizeMode="contain" accessibilityRole="image" />
    </ScrollView>
  );
};

const useStyles = makeStyles(() => ({
  screen: {flex: 1, backgroundColor: '#000000'},
  fill: {flex: 1},
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: {backgroundColor: 'rgba(255,255,255,0.28)'},
  closeSpacer: {width: 40},
  counter: {...type.label, color: '#FFFFFF', fontVariant: ['tabular-nums']},
  titleBlock: {flex: 1, alignItems: 'center'},
  caption: {...type.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2},
}));
