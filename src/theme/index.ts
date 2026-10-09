/**
 * Design tokens. Every colour, size and text style in the app comes from here.
 *
 * One dark palette with a single yellow accent for primary actions; other
 * colour is reserved for meaning (sync state, priority). Values marked
 * "derived" fill gaps between the brand palette's steps.
 */
import {useMemo} from 'react';
import {ImageStyle, StyleSheet, TextStyle, ViewStyle} from 'react-native';
import {Priority, SyncStatus} from '../types';

const palette = {
  background: '#121110',
  surface: '#1E1D1B', // cards, inputs
  surfaceMuted: '#262522', // derived — icon tiles, progress tracks
  surfaceRaised: '#33322E', // derived — selected segment
  border: '#2E2D2A',
  borderStrong: '#3D3C38', // derived — secondary button outline
  text: '#FFFFFF', // headlines, titles, values
  textBody: '#D9D9D9', // paragraphs, notes, input text
  textSecondary: '#8A8A8A', // muted — labels, subtitles
  textTertiary: '#6B6A66', // derived — placeholders, timestamps
  primary: '#E8B530', // accent yellow
  onPrimary: '#1A1A1A',
  danger: '#F2675F',
  dangerMuted: '#3A1F1D',
  overlay: 'rgba(0,0,0,0.65)',
  status: {
    pending: '#F2994A', // orange, kept distinct from the yellow accent
    syncing: '#6E9BF5',
    synced: '#4CBF7A',
    error: '#F2675F',
  } as Record<SyncStatus, string>,
  priority: {
    low: '#8A8A8A',
    medium: '#F2994A',
    high: '#F2675F',
  } as Record<Priority, string>,
};

export type Colors = typeof palette;

export const spacing = {xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32} as const;
export const radius = {sm: 8, md: 12, lg: 16, pill: 999} as const;

/** Minimum touch target — larger than the 44pt guideline for gloved hands. */
export const TOUCH_TARGET = 48;

export const type = {
  largeTitle: {fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.4},
  title: {fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.2},
  headline: {fontSize: 16, lineHeight: 21, fontWeight: '600'},
  body: {fontSize: 16, lineHeight: 22, fontWeight: '400'},
  callout: {fontSize: 15, lineHeight: 20, fontWeight: '400'},
  subhead: {fontSize: 14, lineHeight: 19, fontWeight: '400'},
  footnote: {fontSize: 13, lineHeight: 18, fontWeight: '400'},
  caption: {fontSize: 12, lineHeight: 16, fontWeight: '400'},
  label: {fontSize: 13, lineHeight: 18, fontWeight: '600'},
} satisfies Record<string, TextStyle>;

export interface Theme {
  dark: boolean;
  colors: Colors;
}

const THEME: Theme = {dark: true, colors: palette};

export const useTheme = (): Theme => THEME;

type Styles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export const makeStyles =
  // `S & Styles` gives the factory's object literal contextual typing, as
  // StyleSheet.create does, so 'row' stays 'row' rather than widening to string.
  <S extends Styles>(factory: (colors: Colors) => S & Styles) =>
  (): Readonly<S> => {
    const {colors} = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
