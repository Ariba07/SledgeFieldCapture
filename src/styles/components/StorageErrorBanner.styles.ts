import {makeStyles, radius, spacing, type} from '../../theme';

export const useStorageErrorBannerStyles = makeStyles(c => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: c.dangerMuted,
    borderWidth: 1,
    borderColor: c.danger,
  },
  text: {flex: 1},
  title: {...type.label, color: c.text},
  detail: {...type.footnote, color: c.textBody, marginTop: 1},
}));
