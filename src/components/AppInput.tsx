import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, radius, spacing, typography } from "../theme/tokens";

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
};

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  {
    label,
    error,
    containerStyle,
    style,
    placeholderTextColor = colors.mutedText,
    ...props
  },
  ref,
) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        ref={ref}
        accessibilityLabel={label ?? props.placeholder ?? "입력 필드"}
        accessibilityHint={error ? `오류: ${error}` : undefined}
        placeholderTextColor={placeholderTextColor}
        style={[styles.input, Boolean(error) && styles.errorInput, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.subtitle,
    color: colors.text,
    fontFamily: typography.family.medium,
  },
  input: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    color: colors.text,
    fontFamily: typography.family.regular,
  },
  errorInput: {
    borderColor: colors.danger,
  },
  error: {
    fontSize: typography.caption,
    color: colors.danger,
    fontFamily: typography.family.regular,
  },
});
