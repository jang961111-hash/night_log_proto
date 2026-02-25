import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "./AppButton";
import { colors, spacing, typography } from "../theme/tokens";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function AppHeader({
  title,
  subtitle,
  backLabel = "뒤로",
  onBack,
  right,
}: AppHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        {onBack ? (
          <AppButton label={backLabel} onPress={onBack} variant="outline" />
        ) : null}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: typography.section,
    fontFamily: typography.family.bold,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.regular,
  },
  right: {
    alignItems: "flex-end",
  },
});
