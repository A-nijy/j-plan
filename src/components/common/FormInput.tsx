import React from 'react';
import { StyleSheet, Text, View, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../../constants/theme';

interface FormInputProps extends TextInputProps {
  label: string;
  containerStyle?: object;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  label, 
  containerStyle, 
  style, 
  ...props 
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input, 
          { 
            backgroundColor: colors.surface, 
            color: colors.text, 
            borderColor: colors.border 
          },
          style
        ]}
        placeholderTextColor={colors.textSecondary + '80'}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    borderWidth: 1,
  },
});
