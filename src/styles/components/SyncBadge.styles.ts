import {makeStyles, type} from '../../theme';

export const useSyncBadgeStyles = makeStyles(() => ({
  row: {flexDirection: 'row', alignItems: 'center', gap: 5},
  label: {...type.label, fontSize: 12},
}));
