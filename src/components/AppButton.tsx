import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, spacing, touchTarget, typography } from "../theme/tokens";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  onPress,
  variant = "primary",
  size = "md",
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
        size === "sm" && styles.buttonSm,
        size === "md" && styles.buttonMd,
        size === "lg" && styles.buttonLg,
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
          size === "sm" && styles.labelSm,
          size === "lg" && styles.labelLg,
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
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  buttonSm: {
    minHeight: touchTarget.minSize,
    paddingHorizontal: spacing.md,
  },
  buttonMd: {
    minHeight: touchTarget.comfortable,
    paddingHorizontal: spacing.lg,
  },
  buttonLg: {
    minHeight: 62,
    paddingHorizontal: spacing.lg,
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
    fontSize: typography.body,
    fontFamily: typography.family.medium,
  },
  labelSm: {
    fontSize: typography.caption,
  },
  labelLg: {
    fontSize: typography.subtitle,
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
