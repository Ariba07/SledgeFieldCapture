import {makeStyles, radius, spacing, type} from '../../theme';

export const GAP = spacing.md;

export const useMediaCarouselStyles = makeStyles(c => ({
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
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaText: {...type.caption, color: c.textSecondary},
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: c.borderStrong},
  dotActive: {backgroundColor: c.primary, width: 18},
}));
