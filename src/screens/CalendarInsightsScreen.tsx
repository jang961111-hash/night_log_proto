import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  buildMonthMatrix,
  buildWeeklySeries,
  calendarEmotionMap,
  computeStreak,
  formatDateKeyLocal,
  type WeeklyPoint,
} from "../lib/insights";
import type { EmotionTag } from "../lib/schema";
import { WeeklyLineChart } from "../components/charts/WeeklyLineChart";
import { colors, radius, spacing, typography } from "../theme/tokens";
import type { DiaryHistoryRecord } from "../types/app";

type CalendarInsightsScreenProps = {
  userId: string;
  history: DiaryHistoryRecord[];
  onBack: () => void;
};

type InsightMode = "year" | "month";

const emotionLevel: Record<EmotionTag, number> = {
  joy: 85,
  calm: 72,
  stress: 45,
  fatigue: 38,
};

function longestStreak(history: DiaryHistoryRecord[], userId: string): number {
  const keys = Array.from(
    new Set(
      history
        .filter((item) => item.userId === userId)
        .map((item) => formatDateKeyLocal(new Date(item.createdAt))),
    ),
  ).sort();

  if (keys.length === 0) {
    return 0;
  }

  let longest = 1;
  let current = 1;

  for (let i = 1; i < keys.length; i += 1) {
    const prev = new Date(`${keys[i - 1]}T00:00:00`).getTime();
    const next = new Date(`${keys[i]}T00:00:00`).getTime();
    const diffDays = (next - prev) / (24 * 60 * 60 * 1000);

    if (diffDays === 1) {
      current += 1;
    } else {
      current = 1;
    }

    if (current > longest) {
      longest = current;
    }
  }

  return longest;
}

function buildYearBars(records: DiaryHistoryRecord[], year: number): number[] {
  const counts = Array.from({ length: 12 }, () => 0);

  for (const item of records) {
    const date = new Date(item.createdAt);
    if (date.getFullYear() !== year) {
      continue;
    }
    counts[date.getMonth()] += 1;
  }

  return counts;
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes}분`;
  }

  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  if (minute === 0) {
    return `${hour}시간`;
  }
  return `${hour}시간 ${minute}분`;
}

function buildMonthlyEmotionPoints(records: DiaryHistoryRecord[], year: number, month: number): WeeklyPoint[] {
  const dayScores = new Map<number, number[]>();

  for (const item of records) {
    const date = new Date(item.createdAt);
    if (date.getFullYear() !== year || date.getMonth() !== month) {
      continue;
    }

    const day = date.getDate();
    const tags =
      item.emotionTags.length > 0
        ? item.emotionTags
        : item.resultSnapshot.checkInMood
          ? [item.resultSnapshot.checkInMood]
          : [];

    if (tags.length === 0) {
      continue;
    }

    const score = Math.round(
      tags.reduce((sum, tag) => sum + emotionLevel[tag], 0) / tags.length,
    );
    const current = dayScores.get(day) ?? [];
    dayScores.set(day, [...current, score]);
  }

  const labels = [1, 5, 10, 15, 20, 25, 30];

  return labels.map((day) => {
    const entries = dayScores.get(day) ?? [];
    const value = entries.length > 0 ? Math.round(entries.reduce((s, v) => s + v, 0) / entries.length) : 0;

    return {
      label: `${day}`,
      value,
    };
  });
}

function emotionColorForCell(tag: EmotionTag | null | undefined): string {
  if (!tag) {
    return "#E7E5E3";
  }
  if (tag === "joy") {
    return "#7AB39D";
  }
  if (tag === "calm") {
    return "#86C2AF";
  }
  if (tag === "stress") {
    return "#E4A3A3";
  }
  return "#BFCFE2";
}

export function CalendarInsightsScreen({ userId, history, onBack }: CalendarInsightsScreenProps) {
  const [mode, setMode] = useState<InsightMode>("year");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = `${year}년 ${cursor.toLocaleString("ko-KR", { month: "long" })}`;

  const userHistory = useMemo(
    () => history.filter((item) => item.userId === userId),
    [history, userId],
  );

  const currentStreak = useMemo(() => computeStreak(history, userId), [history, userId]);
  const bestStreak = useMemo(() => longestStreak(history, userId), [history, userId]);

  const yearRecords = useMemo(
    () => userHistory.filter((item) => new Date(item.createdAt).getFullYear() === year),
    [userHistory, year],
  );

  const monthRecords = useMemo(
    () =>
      userHistory.filter((item) => {
        const date = new Date(item.createdAt);
        return date.getFullYear() === year && date.getMonth() === month;
      }),
    [month, userHistory, year],
  );

  const yearBars = useMemo(() => buildYearBars(userHistory, year), [userHistory, year]);
  const yearMax = Math.max(1, ...yearBars);

  const monthMatrix = useMemo(() => buildMonthMatrix(year, month), [year, month]);
  const emotionMap = useMemo(() => calendarEmotionMap(userHistory, userId), [userHistory, userId]);

  const yearDailyCount = useMemo(
    () => new Set(yearRecords.map((item) => formatDateKeyLocal(new Date(item.createdAt)))).size,
    [yearRecords],
  );
  const monthDailyCount = useMemo(
    () => new Set(monthRecords.map((item) => formatDateKeyLocal(new Date(item.createdAt)))).size,
    [monthRecords],
  );

  const yearTotalMinutes = yearRecords.length * 6;
  const monthTotalMinutes = monthRecords.length * 6;

  const yearAvgMinutes = yearDailyCount > 0 ? Math.round(yearTotalMinutes / yearDailyCount) : 0;
  const monthAvgMinutes = monthDailyCount > 0 ? Math.round(monthTotalMinutes / monthDailyCount) : 0;

  const yearTrend = useMemo<WeeklyPoint[]>(
    () =>
      yearBars.map((count, index) => ({
        label: `${index + 1}`,
        value: Math.round((count / yearMax) * 100),
      })),
    [yearBars, yearMax],
  );

  const monthTrend = useMemo(
    () => buildMonthlyEmotionPoints(monthRecords, year, month),
    [monthRecords, year, month],
  );

  const recentWeekTrend = useMemo(() => buildWeeklySeries(history, userId), [history, userId]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>인사이트</Text>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8} accessibilityRole="button">
            <Text style={styles.backButtonText}>뒤로</Text>
          </Pressable>
        </View>

        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeItem, mode === "year" && styles.modeItemActive]}
            onPress={() => setMode("year")}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === "year" }}
          >
            <Text style={[styles.modeText, mode === "year" && styles.modeTextActive]}>연간</Text>
          </Pressable>
          <Pressable
            style={[styles.modeItem, mode === "month" && styles.modeItemActive]}
            onPress={() => setMode("month")}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === "month" }}
          >
            <Text style={[styles.modeText, mode === "month" && styles.modeTextActive]}>월간</Text>
          </Pressable>
        </View>

        {mode === "year" ? (
          <>
            <View style={styles.streakCard}>
              <View style={styles.streakCol}>
                <Text style={styles.statLabel}>연속 작성일</Text>
                <Text style={[styles.statValue, styles.valueRed]}>{currentStreak}일</Text>
                <Text style={styles.statSub}>오늘 기준</Text>
              </View>
              <View style={styles.streakCol}>
                <Text style={styles.statLabel}>최장 연속 작성일</Text>
                <Text style={[styles.statValue, styles.valueBlue]}>{bestStreak}일</Text>
                <Text style={styles.statSub}>누적 최고</Text>
              </View>
            </View>

            <View style={styles.periodRow}>
              <Pressable
                style={styles.arrowButton}
                onPress={() => setCursor(new Date(year - 1, month, 1))}
                accessibilityRole="button"
                accessibilityLabel="이전 해"
              >
                <Text style={styles.arrowText}>‹</Text>
              </Pressable>
              <Text style={styles.periodText}>{year}년</Text>
              <Pressable
                style={styles.arrowButton}
                onPress={() => setCursor(new Date(year + 1, month, 1))}
                accessibilityRole="button"
                accessibilityLabel="다음 해"
              >
                <Text style={styles.arrowText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <View style={styles.metricRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>일기 작성일</Text>
                  <Text style={styles.metricValueGreen}>{yearDailyCount}일</Text>
                </View>
                <View style={styles.barWrap}>
                  {yearBars.map((value, index) => (
                    <View key={`${year}-bar-${index}`} style={styles.barCol}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${Math.max(12, Math.round((value / yearMax) * 100))}%`,
                          },
                        ]}
                      />
                      <Text style={styles.barLabel}>{index + 1}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.cardSplit}>
              <View style={styles.splitCol}>
                <Text style={styles.metricLabel}>총 기록 시간</Text>
                <Text style={styles.metricValueBlue}>{formatMinutes(yearTotalMinutes)}</Text>
              </View>
              <View style={styles.splitCol}>
                <Text style={styles.metricLabel}>하루 평균 기록 시간</Text>
                <Text style={styles.metricValueYellow}>{formatMinutes(yearAvgMinutes)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>감정 변화</Text>
              <WeeklyLineChart points={yearTrend} width={300} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.periodRow}>
              <Pressable
                style={styles.arrowButton}
                onPress={() => setCursor(new Date(year, month - 1, 1))}
                accessibilityRole="button"
                accessibilityLabel="이전 달"
              >
                <Text style={styles.arrowText}>‹</Text>
              </Pressable>
              <Text style={styles.periodText}>{monthLabel}</Text>
              <Pressable
                style={styles.arrowButton}
                onPress={() => setCursor(new Date(year, month + 1, 1))}
                accessibilityRole="button"
                accessibilityLabel="다음 달"
              >
                <Text style={styles.arrowText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <View style={styles.metricRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>일기 작성일</Text>
                  <Text style={styles.metricValueGreen}>{monthDailyCount}일</Text>
                </View>
                <View style={styles.heatMapWrap}>
                  {monthMatrix.flat().map((cell) => (
                    <View
                      key={cell.dateKey}
                      style={[
                        styles.heatCell,
                        { backgroundColor: cell.inMonth ? emotionColorForCell(emotionMap[cell.dateKey]) : "#F0EFED" },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.cardSplit}>
              <View style={styles.splitCol}>
                <Text style={styles.metricLabel}>총 기록 시간</Text>
                <Text style={styles.metricValueBlue}>{formatMinutes(monthTotalMinutes)}</Text>
              </View>
              <View style={styles.splitCol}>
                <Text style={styles.metricLabel}>하루 평균 기록 시간</Text>
                <Text style={styles.metricValueYellow}>{formatMinutes(monthAvgMinutes)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>감정 변화</Text>
              <WeeklyLineChart points={monthTrend.some((point) => point.value > 0) ? monthTrend : recentWeekTrend} width={300} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 170,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.text,
    fontSize: 40,
    fontFamily: typography.family.bold,
    letterSpacing: -0.8,
  },
  backButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  backButtonText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  modeToggle: {
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#E8E5E2",
    borderRadius: radius.pill,
    padding: 4,
    marginVertical: spacing.xs,
  },
  modeItem: {
    minWidth: 86,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: spacing.sm,
  },
  modeItemActive: {
    backgroundColor: colors.surface,
  },
  modeText: {
    color: colors.mutedText,
    fontSize: typography.subtitle,
    fontFamily: typography.family.medium,
  },
  modeTextActive: {
    color: colors.text,
    fontFamily: typography.family.bold,
  },
  streakCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
  },
  streakCol: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
  },
  statValue: {
    fontSize: 44,
    lineHeight: 52,
    fontFamily: typography.family.bold,
  },
  statSub: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.regular,
  },
  valueRed: {
    color: "#D17B7B",
  },
  valueBlue: {
    color: "#90A9CE",
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 34,
    fontFamily: typography.family.medium,
  },
  periodText: {
    color: colors.text,
    fontSize: 32,
    letterSpacing: -0.4,
    fontFamily: typography.family.bold,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metricCol: {
    minWidth: 88,
    justifyContent: "center",
    gap: 6,
  },
  metricLabel: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontFamily: typography.family.medium,
  },
  metricValueGreen: {
    color: colors.primaryDeep,
    fontSize: 48,
    lineHeight: 54,
    fontFamily: typography.family.bold,
  },
  metricValueBlue: {
    color: "#90A9CE",
    fontSize: 34,
    lineHeight: 40,
    fontFamily: typography.family.bold,
  },
  metricValueYellow: {
    color: "#D8B46A",
    fontSize: 34,
    lineHeight: 40,
    fontFamily: typography.family.bold,
  },
  barWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 5,
    paddingBottom: 2,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    minHeight: 124,
  },
  bar: {
    width: "100%",
    maxWidth: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    minHeight: 10,
  },
  barLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontFamily: typography.family.regular,
  },
  cardSplit: {
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  splitCol: {
    flex: 1,
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontFamily: typography.family.medium,
  },
  heatMapWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  heatCell: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
});
