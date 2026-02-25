import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme/tokens";

type SelectChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function SelectChip({ label, selected, onPress }: SelectChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} ${selected ? "선택됨" : "선택 안됨"}`}
      style={[styles.chip, selected && styles.selected]}
    >
      <View style={styles.row}>
        {selected ? <Text style={styles.check}>✓</Text> : null}
        <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: "transparent",
  },
  selected: {
    borderWidth: 2,
    backgroundColor: "rgba(57, 166, 209, 0.13)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  check: {
    color: colors.primary,
    fontSize: typography.subtitle,
    fontFamily: typography.family.bold,
  },
  text: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontFamily: typography.family.medium,
  },
  selectedText: {
    color: colors.primaryDeep,
  },
});
