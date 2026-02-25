import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors, radius, spacing, touchTarget, typography } from "../theme/tokens";

type ButtonVariant = "primary" | "outline" | "ghost";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
};

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  accessibilityHint,
  style,
}: AppButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={8}
      style={[
        styles.button,
        variant === "primary" && styles.primary,
        variant === "outline" && styles.outline,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "primary" ? styles.labelPrimary : styles.labelOutline,
          disabled && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget.comfortable,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  primary: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  outline: {
    borderColor: colors.primary,
    backgroundColor: "transparent",
  },
  ghost: {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: typography.subtitle,
    fontFamily: typography.family.medium,
  },
  labelPrimary: {
    color: "#fff",
  },
  labelOutline: {
    color: colors.text,
  },
  labelDisabled: {
    color: colors.mutedText,
  },
});
