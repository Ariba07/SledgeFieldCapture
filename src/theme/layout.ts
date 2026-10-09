/**
 * Responsive layout. Size classes follow window width (not device type), so
 * iPad split view, Android multi-window, foldables and phone landscape all get
 * the layout that fits the space they actually have.
 *
 *   compact   < 600pt   phones in portrait
 *   medium    600–1023  phone landscape, small tablets, split view
 *   expanded  ≥ 1024    tablets, desktop-class windows
 */
import {useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {spacing} from './index';

export type SizeClass = 'compact' | 'medium' | 'expanded';

const MEDIUM = 600;
const EXPANDED = 1024;

export const MAX_LIST_WIDTH = 1280;
export const READING_WIDTH = 680;

/**
 * Layout metrics for a given available width. Pass the width of the container
 * you're laying out (e.g. from onLayout) — the window can be wider than the
 * space a screen actually gets, for example beside a navigation rail.
 */
export const computeLayout = (available: number) => {
  const sizeClass: SizeClass =
    available >= EXPANDED
      ? 'expanded'
      : available >= MEDIUM
      ? 'medium'
      : 'compact';
  const compact = sizeClass === 'compact';

  const gutter = compact
    ? spacing.lg
    : sizeClass === 'medium'
    ? spacing.xl
    : spacing.xxl;
  const gap = compact ? spacing.md : spacing.lg;
  const columns = compact ? 1 : sizeClass === 'medium' ? 2 : 3;

  const listWidth = Math.min(available, MAX_LIST_WIDTH);
  const itemWidth = Math.floor(
    (listWidth - gutter * 2 - gap * (columns - 1)) / columns,
  );

  return {
    sizeClass,
    isCompact: compact,
    gutter,
    gap,
    columns,
    listWidth,
    itemWidth,
  };
};

/** Window-level layout (window width minus safe-area insets). */
export const useLayout = () => {
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return {
    ...computeLayout(width - insets.left - insets.right),
    isLandscape: width > height,
    insets,
  };
};
