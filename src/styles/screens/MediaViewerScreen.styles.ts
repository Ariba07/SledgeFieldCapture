import {makeStyles, spacing, type} from '../../theme';

export const useMediaViewerScreenStyles = makeStyles(() => ({
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
