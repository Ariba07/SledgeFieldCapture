import React, {useState} from 'react';
import {FlatList, View} from 'react-native';
import {FieldCapture} from '../types';
import {CaptureCard} from './CaptureCard';
import {MAX_LIST_WIDTH, computeLayout, useLayout} from '../theme/layout';
import {captureGridStyles} from '../styles/components/CaptureGrid.styles';

interface Props {
  data: FieldCapture[];
  progress: Record<string, number>;
  onOpen: (id: string) => void;
  onRetry: (id: string) => void;
  header?: React.ReactElement;
  footer?: React.ReactElement;
  empty?: React.ReactElement;
  bottomPadding?: number;
}

export const CaptureGrid: React.FC<Props> = ({
  data,
  progress,
  onOpen,
  onRetry,
  header,
  footer,
  empty,
  bottomPadding = 0,
}) => {
  // Measure the wrapper, not the list: the wrapper's width comes from its
  // parent (which may sit beside a nav rail), so it can't feed back into
  // itself. Fall back to the window until the first layout pass.
  const windowLayout = useLayout();
  const [width, setWidth] = useState<number | null>(null);
  const {columns, gap, gutter, itemWidth} = width ? computeLayout(width) : windowLayout;
  const available = width ?? windowLayout.listWidth;
  // Centre with padding rather than a fixed content width.
  const sidePadding = gutter + Math.max(0, (available - MAX_LIST_WIDTH) / 2);

  return (
    <View style={captureGridStyles.fill} onLayout={e => setWidth(Math.round(e.nativeEvent.layout.width))}>
      <FlatList
        // numColumns can't change on a mounted FlatList; remount on rotation / resize.
        key={`grid-${columns}`}
        numColumns={columns}
        data={data}
        keyExtractor={item => item.id}
        extraData={progress}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={empty}
        columnWrapperStyle={columns > 1 ? {gap} : undefined}
        renderItem={({item}) => (
          <View style={{width: itemWidth, marginBottom: gap}}>
            <CaptureCard
              capture={item}
              progress={progress[item.id]}
              onPress={() => onOpen(item.id)}
              onRetry={onRetry}
              style={captureGridStyles.fill}
            />
          </View>
        )}
        contentContainerStyle={[
          captureGridStyles.content,
          {paddingHorizontal: sidePadding, paddingBottom: bottomPadding},
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
