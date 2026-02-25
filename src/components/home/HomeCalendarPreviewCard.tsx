import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../AppButton";
import { colors, radius, shadows, spacing, touchTarget, typography } from "../../theme/tokens";
import type { HomeCalendarPreview } from "../../types/app";

type HomeCalendarPreviewCardProps = {
  preview: HomeCalendarPreview;
  hasLatestResult: boolean;
  onOpenCalendar: () => void;
  onOpenLatestResult: () => void;
};

const emotionLabel = {
  stress: "스트레스",
  joy: "좋음",
  fatigue: "피곤",
  calm: "차분",
} as const;

export function HomeCalendarPreviewCard({
  preview,
  hasLatestResult,
  onOpenCalendar,
  onOpenLatestResult,
}: HomeCalendarPreviewCardProps) {
  const hasWeeklyData = preview.weekEntryCount > 0;
  const hasNextSchedule = Boolean(preview.nextScheduleTitle && preview.nextScheduleTime);
  const dominantEmotionText = preview.dominantEmotion ? emotionLabel[preview.dominantEmotion] : "없음";

  return (
    <View style={styles.card}>
      <Text style={styles.title}>이번 주 캘린더 미리보기</Text>

      {hasWeeklyData ? (
        <View style={styles.metricRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>기록 수</Text>
            <Text style={styles.metricValue}>{preview.weekEntryCount}회</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>일관성</Text>
            <Text style={styles.metricValue}>{preview.consistencyScore}%</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>대표 감정</Text>
            <Text style={styles.metricValue}>{dominantEmotionText}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>이번 주 첫 기록을 시작해보세요.</Text>
          <Text style={styles.emptySub}>대화를 1회만 완료해도 주간 그래프가 바로 표시됩니다.</Text>
        </View>
      )}

      <View style={styles.scheduleBox}>
        <Text style={styles.scheduleLabel}>내일 첫 일정</Text>
        <Text style={styles.scheduleValue} numberOfLines={1}>
          {hasNextSchedule
            ? `${preview.nextScheduleTime} · ${preview.nextScheduleTitle}`
            : "아직 등록된 일정이 없습니다."}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <AppButton label="캘린더 열기" onPress={onOpenCalendar} variant="outline" style={styles.calendarButton} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="최근 결과 보기"
          accessibilityState={{ disabled: !hasLatestResult }}
          disabled={!hasLatestResult}
          onPress={onOpenLatestResult}
          hitSlop={8}
          style={styles.linkButton}
        >
          <Text style={[styles.linkText, !hasLatestResult && styles.linkTextDisabled]}>
            {hasLatestResult ? "최근 결과 보기" : "최근 결과 없음"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#C8DDE9",
    backgroundColor: "rgba(249, 251, 252, 0.94)",
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  title: {
    color: colors.primaryDeep,
    fontSize: typography.subtitle,
    fontFamily: typography.family.bold,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  metricBox: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: "#EAF3FA",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    minHeight: 74,
    justifyContent: "space-between",
  },
  metricLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontFamily: typography.family.bold,
  },
  emptyBox: {
    borderRadius: radius.md,
    backgroundColor: "#EAF3FA",
    padding: spacing.sm,
    gap: 4,
  },
  emptyText: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
  },
  emptySub: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.regular,
    lineHeight: 18,
  },
  scheduleBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#D5E4EE",
    backgroundColor: "#F4F8FB",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  scheduleLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  scheduleValue: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.bold,
  },
  actionRow: {
    gap: spacing.xs,
  },
  calendarButton: {
    width: "100%",
  },
  linkButton: {
    minHeight: touchTarget.minSize,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  linkText: {
    color: colors.primaryDeep,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
    textDecorationLine: "underline",
  },
  linkTextDisabled: {
    color: colors.mutedText,
    textDecorationLine: "none",
  },
});
