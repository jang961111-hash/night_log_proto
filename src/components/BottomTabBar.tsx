import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadows, spacing, touchTarget, typography } from "../theme/tokens";

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

const icons: Record<BottomTabKey, string> = {
  home: "⌂",
  journal: "◉",
  calendar: "▦",
  settings: "⚙",
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
              <View style={styles.iconWrap}>
                <Text style={[styles.icon, selected && styles.iconSelected]}>{icons[tab]}</Text>
                {badgeCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeCount > 9 ? "9+" : `${badgeCount}`}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.itemText, selected && styles.itemTextSelected]}>{labels[tab]}</Text>
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
    borderTopColor: "#DCE6EE",
  },
  inner: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    ...shadows.soft,
  },
  item: {
    flex: 1,
    minHeight: touchTarget.minSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    gap: 2,
  },
  itemSelected: {
    backgroundColor: "#E3F1F9",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  iconWrap: {
    minHeight: 18,
    minWidth: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    color: colors.mutedText,
    fontSize: 15,
    fontFamily: typography.family.medium,
    lineHeight: 18,
  },
  iconSelected: {
    color: colors.primaryDeep,
    fontFamily: typography.family.bold,
  },
  itemText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  itemTextSelected: {
    color: colors.primaryDeep,
    fontFamily: typography.family.bold,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: typography.family.bold,
    lineHeight: 12,
  },
});
