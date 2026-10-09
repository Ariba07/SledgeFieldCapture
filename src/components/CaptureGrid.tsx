import React from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {FieldCapture} from '../types';
import {CaptureCard} from './CaptureCard';
import {useLayout} from '../theme/layout';

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

/**
 * Capture list that becomes a 2- or 3-column grid as the window widens.
 * Content is centred and capped in width; cards in a row share a height.
 */
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
  const {columns, gap, gutter, listWidth, itemWidth} = useLayout();

  return (
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
            style={styles.fill}
          />
        </View>
      )}
      contentContainerStyle={[
        styles.content,
        {width: listWidth, paddingHorizontal: gutter, paddingBottom: bottomPadding},
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  content: {alignSelf: 'center', flexGrow: 1},
  fill: {flex: 1},
});
