import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, spacing, touchTarget } from "../theme/tokens";

type BottomTabKey = "home" | "journal" | "calendar" | "settings";

type BottomTabBarProps = {
  active: BottomTabKey;
  onPress: (tab: BottomTabKey) => void;
  badges?: Partial<Record<BottomTabKey, number>>;
};

const labels: Record<BottomTabKey, string> = {
  home: "메인",
  journal: "대화",
  calendar: "캘린더",
  settings: "설정",
};

const iconName: Record<BottomTabKey, keyof typeof Ionicons.glyphMap> = {
  home: "sparkles-outline",
  journal: "book-outline",
  calendar: "bar-chart-outline",
  settings: "person-outline",
};

const iconNameFilled: Record<BottomTabKey, keyof typeof Ionicons.glyphMap> = {
  home: "sparkles",
  journal: "book",
  calendar: "bar-chart",
  settings: "person",
};

export function BottomTabBar({ active, onPress, badges }: BottomTabBarProps) {
  const tabs: BottomTabKey[] = ["home", "journal", "calendar", "settings"];

  return (
    <View style={styles.wrap}>
      <View style={styles.inner}>
        {tabs.map((tab) => {
          const selected = active === tab;
          const badgeCount = badges?.[tab] ?? 0;
          return (
            <Pressable
              key={tab}
              onPress={() => onPress(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${labels[tab]} 탭${badgeCount > 0 ? `, 새 항목 ${badgeCount}개` : ""}`}
              hitSlop={8}
              style={[styles.item, selected && styles.itemSelected]}
            >
              <Ionicons
                name={selected ? iconNameFilled[tab] : iconName[tab]}
                size={24}
                color={selected ? colors.text : colors.mutedText}
              />
              {badgeCount > 0 ? <View style={styles.badge} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inner: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
  },
  item: {
    flex: 1,
    minHeight: touchTarget.minSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  itemSelected: {
    backgroundColor: "#F0F5F2",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: "33%",
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
});
