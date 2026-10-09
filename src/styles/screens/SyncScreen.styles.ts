import {makeStyles, radius, spacing, type} from '../../theme';
import {READING_WIDTH} from '../../theme/layout';

export const useSyncScreenStyles = makeStyles(c => ({
  safe: {flex: 1, backgroundColor: c.background},
  headerBlock: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  largeTitle: {...type.largeTitle, color: c.text},
  statusCard: {
    maxWidth: READING_WIDTH,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  statusRow: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md},
  statusText: {flex: 1},
  statusTitle: {...type.title, color: c.text},
  statusDetail: {...type.subhead, color: c.textBody, marginTop: 2},
  footerBlock: {marginTop: spacing.xxl, maxWidth: READING_WIDTH},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
  },
  settingText: {flex: 1},
  settingTitle: {...type.callout, fontWeight: '500', color: c.text},
  settingDetail: {...type.footnote, color: c.textSecondary, marginTop: 2},
}));
