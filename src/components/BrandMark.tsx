import React from 'react';
import Svg, {Path, Rect} from 'react-native-svg';
import {useTheme} from '../theme';

/** The app icon's clipboard mark; geometry matches assets/brand/mark.svg. */
export const BrandMark: React.FC<{size: number}> = ({size}) => {
  const {colors} = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Rect
        x={96}
        y={80}
        width={320}
        height={400}
        rx={56}
        fill={colors.primary}
      />
      <Rect
        x={176}
        y={48}
        width={160}
        height={88}
        rx={28}
        fill={colors.background}
      />
      <Rect
        x={204}
        y={72}
        width={104}
        height={40}
        rx={14}
        fill={colors.primary}
      />
      <Path
        d="M176 296 L236 356 L344 240"
        fill="none"
        stroke={colors.background}
        strokeWidth={48}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
