import React, {useState} from 'react';
import {Text, TextInput, TextInputProps, View} from 'react-native';
import {useTheme} from '../../theme';
import {useCaptureFormStyles} from '../../styles/components/CaptureForm.styles';

export const FieldLabel: React.FC<{text: string; first?: boolean}> = ({
  text,
  first,
}) => {
  const styles = useCaptureFormStyles();
  return <Text style={[styles.label, first && styles.labelFirst]}>{text}</Text>;
};

/** A labelled text input with focus and error styling. */
export const Field: React.FC<
  TextInputProps & {
    label: string;
    error?: string;
    containerStyle?: object;
    inputStyle?: object;
  }
> = ({label, error, containerStyle, inputStyle, ...input}) => {
  const styles = useCaptureFormStyles();
  const {colors} = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={containerStyle}>
      <FieldLabel text={label} />
      <TextInput
        {...input}
        onFocus={e => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel={label}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          inputStyle,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};
