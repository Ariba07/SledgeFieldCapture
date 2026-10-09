import {makeStyles, spacing, type} from '../../theme';

export const useSplashScreenStyles = makeStyles(c => ({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: c.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {...type.title, fontSize: 26, color: c.text, marginTop: spacing.xl},
  subtitle: {...type.subhead, color: c.textSecondary, marginTop: spacing.xs},
}));
