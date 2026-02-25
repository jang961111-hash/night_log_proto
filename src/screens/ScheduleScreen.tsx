import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { makeId, normalizeTime } from "../lib/insights";
import { colors, radius, shadows, spacing, typography } from "../theme/tokens";
import type { ScheduleDraftItem } from "../types/app";

type ScheduleScreenProps = {
  items: ScheduleDraftItem[];
  onChangeItems: (items: ScheduleDraftItem[]) => void;
  onGoHome: () => void;
};

export function ScheduleScreen({ items, onChangeItems, onGoHome }: ScheduleScreenProps) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const dateLabel = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 일정`;

  const updateItem = (id: string, patch: Partial<ScheduleDraftItem>) => {
    onChangeItems(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    const next = [
      ...items,
      {
        id: makeId(),
        title: `할 일 ${items.length + 1}`,
        time: "09:00",
        selected: true,
        source: "manual" as const,
      },
    ];
    onChangeItems(next);
  };

  const removeItem = (id: string) => {
    onChangeItems(items.filter((item) => item.id !== id));
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AppHeader
          title="일정 조절"
          subtitle="추천 일정을 내일 실행 가능한 시간표로 정리하세요"
          onBack={onGoHome}
          backLabel="메인"
        />

        <Text style={styles.title}>{dateLabel}</Text>

        {items.map((item, index) => (
          <View key={item.id} style={styles.card}>
            <TextInput
              value={item.title}
              onChangeText={(value) => updateItem(item.id, { title: value })}
              style={styles.titleInput}
              placeholder={`할 일 ${index + 1}`}
              placeholderTextColor={colors.mutedText}
              accessibilityLabel={`일정 제목 ${index + 1}`}
            />
            <View style={styles.rightRow}>
              <TextInput
                value={item.time}
                onChangeText={(value) => updateItem(item.id, { time: value })}
                onBlur={() => updateItem(item.id, { time: normalizeTime(item.time) })}
                keyboardType="numbers-and-punctuation"
                style={styles.timeInput}
                placeholder="00:00"
                placeholderTextColor={colors.mutedText}
                accessibilityLabel={`${item.title} 시간`}
              />
              <Pressable
                style={styles.removeButton}
                onPress={() => removeItem(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title} 삭제`}
                hitSlop={10}
              >
                <Text style={styles.removeText}>삭제</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.empty}>아직 선택된 일정이 없습니다.</Text>
            <Pressable
              style={styles.emptyAction}
              onPress={addItem}
              accessibilityRole="button"
              accessibilityLabel="첫 일정 추가"
              hitSlop={8}
            >
              <Text style={styles.emptyActionText}>첫 일정 추가</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.fabRow}>
        <Pressable
          style={styles.homeFab}
          onPress={onGoHome}
          accessibilityRole="button"
          accessibilityLabel="홈으로 이동"
          hitSlop={10}
        >
          <Text style={styles.homeIcon}>⌂</Text>
        </Pressable>
        <Pressable
          style={styles.plusFab}
          onPress={addItem}
          accessibilityRole="button"
          accessibilityLabel="일정 항목 추가"
          hitSlop={10}
        >
          <Text style={styles.plusIcon}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: 190,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.section,
    fontFamily: typography.family.bold,
  },
  card: {
    minHeight: 108,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.soft,
  },
  titleInput: {
    flex: 1,
    marginRight: spacing.md,
    fontSize: 22,
    color: colors.text,
    fontFamily: typography.family.bold,
  },
  rightRow: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  timeInput: {
    width: 110,
    textAlign: "right",
    fontSize: 30,
    color: colors.text,
    fontFamily: typography.family.bold,
  },
  removeButton: {
    minWidth: 54,
    minHeight: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF3F7",
  },
  removeText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  emptyCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  empty: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  emptyAction: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  emptyActionText: {
    color: colors.primaryDeep,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
  },
  fabRow: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  homeFab: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: "#D2D9DE",
    alignItems: "center",
    justifyContent: "center",
  },
  plusFab: {
    width: 86,
    height: 86,
    borderRadius: 999,
    backgroundColor: "#D2D9DE",
    alignItems: "center",
    justifyContent: "center",
  },
  homeIcon: {
    fontSize: 54,
    color: colors.text,
    fontFamily: typography.family.bold,
    marginTop: -4,
  },
  plusIcon: {
    fontSize: 54,
    color: colors.text,
    fontFamily: typography.family.medium,
    marginTop: -4,
  },
});
