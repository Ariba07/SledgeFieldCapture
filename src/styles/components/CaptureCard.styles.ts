import {makeStyles, radius, spacing, type} from '../../theme';

export const useCaptureCardStyles = makeStyles(c => ({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pressed: {backgroundColor: c.surfaceMuted},
  header: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  headerText: {flex: 1},
  title: {...type.headline, color: c.text},
  subtitle: {...type.footnote, color: c.textSecondary, marginTop: 1},
  notes: {...type.subhead, color: c.textBody},
  // Bleed to the card edges so thumbnails scroll under the padding.
  thumbScroller: {marginHorizontal: -spacing.lg, flexGrow: 0},
  thumbRow: {gap: spacing.sm, paddingHorizontal: spacing.lg},
  thumbPressed: {opacity: 0.75},
  meta: {...type.caption, color: c.textTertiary},
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  errorText: {...type.footnote, color: c.status.error, flex: 1},
}));
