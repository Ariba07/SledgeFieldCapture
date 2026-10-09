import React from 'react';
import {Pressable, StyleProp, Text, View, ViewStyle} from 'react-native';
import {
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  ListChecks,
  LucideIcon,
  TriangleAlert,
} from 'lucide-react-native';
import {CaptureType} from '../types';
import {useTheme} from '../theme';
import {useUiStyles} from '../styles/components/ui.styles';

export const ICON_STROKE = 2;

export const CAPTURE_TYPE_ICONS: Record<CaptureType, LucideIcon> = {
  daily_log: ClipboardList,
  rfi: CircleHelp,
  punchlist: ListChecks,
  issue: TriangleAlert,
  inspection: ClipboardCheck,
};

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: LucideIcon;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled,
  style,
  accessibilityLabel,
}) => {
  const styles = useUiStyles();
  const {colors} = useTheme();
  const fg = {
    primary: colors.onPrimary,
    secondary: colors.text,
    destructive: colors.danger,
  }[variant];
  const small = size === 'sm';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{disabled: !!disabled}}
      style={({pressed}) => [
        styles.button,
        small && styles.buttonSmall,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {Icon ? (
        <Icon size={small ? 16 : 18} color={fg} strokeWidth={ICON_STROKE} />
      ) : null}
      <Text style={[small ? styles.labelSmall : styles.label, {color: fg}]}>
        {title}
      </Text>
    </Pressable>
  );
};

export const IconButton: React.FC<{
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
}> = ({icon: Icon, onPress, accessibilityLabel}) => {
  const styles = useUiStyles();
  const {colors} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({pressed}) => [
        styles.iconButton,
        pressed && styles.iconButtonPressed,
      ]}>
      <Icon size={22} color={colors.text} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
};

export const CaptureTypeIcon: React.FC<{
  captureType: CaptureType;
  size?: number;
}> = ({captureType, size = 36}) => {
  const styles = useUiStyles();
  const {colors} = useTheme();
  const Icon = CAPTURE_TYPE_ICONS[captureType];
  return (
    <View style={[styles.typeIcon, {width: size, height: size}]}>
      <Icon
        size={size * 0.5}
        color={colors.primary}
        strokeWidth={ICON_STROKE}
      />
    </View>
  );
};

export const SectionHeader: React.FC<{title: string}> = ({title}) => {
  const styles = useUiStyles();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
};

export interface Segment<T extends string> {
  value: T;
  label: string;
  color?: string; // tint for the selected label, e.g. priority colours
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useUiStyles();
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {segments.map(s => {
        const selected = s.value === value;
        return (
          <Pressable
            key={s.value}
            onPress={() => onChange(s.value)}
            accessibilityRole="tab"
            accessibilityState={{selected}}
            style={[styles.segment, selected && styles.segmentSelected]}>
            <Text
              style={[
                styles.segmentLabel,
                selected && styles.segmentLabelSelected,
                selected && s.color ? {color: s.color} : null,
              ]}
              numberOfLines={1}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const Chip: React.FC<{
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onPress: () => void;
}> = ({label, icon: Icon, selected, onPress}) => {
  const styles = useUiStyles();
  const {colors} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{selected}}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Icon
        size={16}
        color={selected ? colors.onPrimary : colors.textSecondary}
        strokeWidth={ICON_STROKE}
      />
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
};

export const ProgressBar: React.FC<{
  progress: number;
  showPercent?: boolean;
}> = ({progress, showPercent}) => {
  const styles = useUiStyles();
  const percent = Math.round(progress * 100);
  return (
    <View
      style={styles.progressRow}
      accessibilityLabel={`Uploading ${percent}%`}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, {width: `${percent}%`}]} />
      </View>
      {showPercent ? <Text style={styles.progressText}>{percent}%</Text> : null}
    </View>
  );
};

export const Banner: React.FC<{
  tone: 'neutral' | 'danger';
  icon: LucideIcon;
  title: string;
  detail: string;
}> = ({tone, icon: Icon, title, detail}) => {
  const styles = useUiStyles();
  const {colors} = useTheme();
  const danger = tone === 'danger';
  return (
    <View
      style={[
        styles.banner,
        danger ? styles.bannerDanger : styles.bannerNeutral,
      ]}
      accessibilityRole="alert">
      <Icon
        size={18}
        color={danger ? colors.danger : colors.textSecondary}
        strokeWidth={ICON_STROKE}
      />
      <View style={styles.bannerText}>
        <Text style={styles.bannerTitle}>{title}</Text>
        <Text style={styles.bannerDetail}>{detail}</Text>
      </View>
    </View>
  );
};
