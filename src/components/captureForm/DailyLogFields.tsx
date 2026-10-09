import React from 'react';
import {View} from 'react-native';
import {
  Cloud,
  CloudRain,
  LucideIcon,
  Snowflake,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react-native';
import {Chip} from '../ui';
import {Field, FieldLabel} from './FormField';
import {useCaptureFormStyles} from '../../styles/components/CaptureForm.styles';

const WEATHER: {label: string; icon: LucideIcon}[] = [
  {label: 'Clear', icon: Sun},
  {label: 'Cloudy', icon: Cloud},
  {label: 'Rain', icon: CloudRain},
  {label: 'Windy', icon: Wind},
  {label: 'Hot', icon: Thermometer},
  {label: 'Cold', icon: Snowflake},
];

interface Props {
  workerCount: string;
  onWorkerCountChange: (value: string) => void;
  weather: string;
  onWeatherChange: (value: string) => void;
}

/** Extra fields shown only for daily logs: headcount and weather. */
export const DailyLogFields: React.FC<Props> = ({
  workerCount,
  onWorkerCountChange,
  weather,
  onWeatherChange,
}) => {
  const styles = useCaptureFormStyles();
  return (
    <>
      <Field
        label="Workers on site"
        value={workerCount}
        onChangeText={t => onWorkerCountChange(t.replace(/[^0-9]/g, ''))}
        placeholder="0"
        keyboardType="number-pad"
        containerStyle={styles.workersField}
      />
      <FieldLabel text="Weather" />
      <View style={styles.wrapRow}>
        {WEATHER.map(w => (
          <Chip
            key={w.label}
            label={w.label}
            icon={w.icon}
            selected={weather === w.label}
            onPress={() => onWeatherChange(weather === w.label ? '' : w.label)}
          />
        ))}
      </View>
    </>
  );
};
