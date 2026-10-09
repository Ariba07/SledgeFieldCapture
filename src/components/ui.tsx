import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  ListChecks,
  LucideIcon,
  TriangleAlert,
} from 'lucide-react-native';
import {CaptureType} from '../types';
import {TOUCH_TARGET, makeStyles, radius, spacing, type, useTheme} from '../theme';

export const ICON_STROKE = 2;

export const CAPTURE_TYPE_ICONS: Record<CaptureType, LucideIcon> = {
  daily_log: ClipboardList,
  rfi: CircleHelp,
  punchlist: ListChecks,
  issue: TriangleAlert,
  inspection: ClipboardCheck,
};

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
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
  loading,
  style,
  accessibilityLabel,
}) => {
  const styles = useStyles();
  const {colors} = useTheme();
  const fg = {
    primary: colors.onPrimary,
    secondary: colors.text,
    destructive: colors.danger,
    ghost: colors.text,
  }[variant];
  const small = size === 'sm';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{disabled: !!(disabled || loading)}}
      style={({pressed}) => [
        styles.button,
        small && styles.buttonSmall,
        styles[variant],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {Icon ? <Icon size={small ? 16 : 18} color={fg} strokeWidth={ICON_STROKE} /> : null}
          <Text style={[small ? styles.labelSmall : styles.label, {color: fg}]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

export const IconButton: React.FC<{
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
}> = ({icon: Icon, onPress, accessibilityLabel, color}) => {
  const styles = useStyles();
  const {colors} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({pressed}) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
      <Icon size={22} color={color ?? colors.text} strokeWidth={ICON_STROKE} />
    </Pressable>
  );
};

export const CaptureTypeIcon: React.FC<{captureType: CaptureType; size?: number}> = ({
  captureType,
  size = 36,
}) => {
  const styles = useStyles();
  const {colors} = useTheme();
  const Icon = CAPTURE_TYPE_ICONS[captureType];
  return (
    <View style={[styles.typeIcon, {width: size, height: size}]}>
      <Icon size={size * 0.5} color={colors.primary} strokeWidth={ICON_STROKE} />
    </View>
  );
};

export const SectionHeader: React.FC<{title: string; right?: React.ReactNode}> = ({
  title,
  right,
}) => {
  const styles = useStyles();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
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
  const styles = useStyles();
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

const useStyles = makeStyles(c => ({
  button: {
    minHeight: TOUCH_TARGET + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonSmall: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    gap: 6,
  },
  primary: {backgroundColor: c.primary},
  secondary: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  destructive: {backgroundColor: c.dangerMuted},
  ghost: {backgroundColor: 'transparent'},
  pressed: {opacity: 0.75},
  disabled: {opacity: 0.4},
  label: {...type.headline},
  labelSmall: {...type.label},
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {backgroundColor: c.surfaceMuted},
  typeIcon: {
    borderRadius: radius.sm,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {...type.label, color: c.textSecondary},
  segmented: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.sm + 2,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  segmentSelected: {backgroundColor: c.surfaceRaised},
  segmentLabel: {...type.label, color: c.textSecondary},
  segmentLabelSelected: {color: c.text},
}));
