import { useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  answerFromJournal,
  buildMonthMatrix,
  buildWeeklyHighlights,
  buildWeeklyReport,
  buildWeeklySeries,
  calendarEmotionMap,
} from "../lib/insights";
import type { EmotionTag } from "../lib/schema";
import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { SelectChip } from "../components/SelectChip";
import { WeeklyLineChart } from "../components/charts/WeeklyLineChart";
import { colors, radius, shadows, spacing, typography } from "../theme/tokens";
import type { DiaryHistoryRecord } from "../types/app";

type CalendarInsightsScreenProps = {
  userId: string;
  history: DiaryHistoryRecord[];
  onBack: () => void;
};

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

const emotionColor: Record<EmotionTag, string> = {
  stress: "#F08E8E",
  joy: "#F5BC56",
  fatigue: "#8BB0E8",
  calm: "#70C7B6",
};

const emotionFilterLabel: Record<EmotionTag | "all", string> = {
  all: "전체",
  stress: "스트레스",
  joy: "좋음",
  fatigue: "피곤",
  calm: "차분",
};

export function CalendarInsightsScreen({ userId, history, onBack }: CalendarInsightsScreenProps) {
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [emotionFilter, setEmotionFilter] = useState<EmotionTag | "all">("all");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const year = monthCursor.getFullYear();
  const monthIndex = monthCursor.getMonth();

  const filteredHistory = useMemo(() => {
    if (emotionFilter === "all") {
      return history;
    }
    return history.filter((item) => {
      if (item.userId !== userId) {
        return false;
      }

      const hasTag = item.emotionTags.includes(emotionFilter);
      const hasCheckIn = item.resultSnapshot.checkInMood === emotionFilter;
      return hasTag || hasCheckIn;
    });
  }, [emotionFilter, history, userId]);

  const monthMatrix = useMemo(() => buildMonthMatrix(year, monthIndex), [monthIndex, year]);
  const weeklySeries = useMemo(
    () => buildWeeklySeries(filteredHistory, userId),
    [filteredHistory, userId],
  );
  const highlights = useMemo(
    () => buildWeeklyHighlights(filteredHistory, userId),
    [filteredHistory, userId],
  );
  const emotionMap = useMemo(
    () => calendarEmotionMap(filteredHistory, userId),
    [filteredHistory, userId],
  );
  const report = useMemo(() => buildWeeklyReport(history, userId), [history, userId]);

  const chartWidth = Math.max(280, Dimensions.get("window").width - spacing.xl * 2);

  const monthLabel = `${year}년 ${monthCursor.toLocaleString("ko-KR", { month: "long" })}`;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenFadeIn>
          <AppHeader
            title="캘린더 인사이트"
            subtitle="기록 흐름과 반복 감정을 주간 단위로 확인하세요"
            onBack={onBack}
          />
          <View style={styles.monthRow}>
            <Text style={styles.month}>{monthLabel}</Text>
            <View style={styles.arrowRow}>
              <Pressable
                style={styles.arrowButton}
                onPress={() => setMonthCursor(new Date(year, monthIndex - 1, 1))}
                accessibilityRole="button"
                accessibilityLabel="이전 달"
                hitSlop={8}
              >
                <Text style={styles.arrowText}>‹</Text>
              </Pressable>
              <Pressable
                style={styles.arrowButton}
                onPress={() => setMonthCursor(new Date(year, monthIndex + 1, 1))}
                accessibilityRole="button"
                accessibilityLabel="다음 달"
                hitSlop={8}
              >
                <Text style={styles.arrowText}>›</Text>
              </Pressable>
            </View>
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={60}>
          <View style={styles.filterRow}>
            {(["all", "joy", "calm", "stress", "fatigue"] as const).map((filter) => (
              <View key={filter} style={styles.filterCell}>
                <SelectChip
                  label={emotionFilterLabel[filter]}
                  selected={emotionFilter === filter}
                  onPress={() => setEmotionFilter(filter)}
                />
              </View>
            ))}
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={70}>
          <View style={styles.calendarCard}>
            <View style={styles.weekHeader}>
              {weekdays.map((day) => (
                <Text key={day} style={styles.weekLabel}>
                  {day}
                </Text>
              ))}
            </View>

            {monthMatrix.map((week, index) => (
              <View key={`${week[0].dateKey}-${index}`} style={styles.weekRow}>
                {week.map((cell) => {
                  const emotion = emotionMap[cell.dateKey];
                  return (
                    <View key={cell.dateKey} style={styles.dayCell}>
                      <Text style={[styles.dayText, !cell.inMonth && styles.dayTextDim]}>{cell.day}</Text>
                      {emotion ? <View style={[styles.dot, { backgroundColor: emotionColor[emotion] }]} /> : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={110}>
          <View style={styles.reportCard}>
            <Text style={styles.sectionTitle}>주간 AI 리포트</Text>
            <View style={styles.reportRow}>
              <Text style={styles.reportKey}>기록 수</Text>
              <Text style={styles.reportValue}>{report.totalEntries}회</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={styles.reportKey}>지배 감정</Text>
              <Text style={styles.reportValue}>
                {report.dominantEmotion ? emotionFilterLabel[report.dominantEmotion] : "없음"}
              </Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={styles.reportKey}>반복된 첫 행동</Text>
              <Text style={styles.reportValue} numberOfLines={2}>
                {report.topAction}
              </Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={styles.reportKey}>기록 일관성</Text>
              <Text style={styles.reportValue}>{report.consistencyScore}%</Text>
            </View>
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={120}>
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>주간 감정 그래프</Text>
            <WeeklyLineChart points={weeklySeries} width={chartWidth} />
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={170}>
          <View style={styles.highlightCard}>
            <Text style={styles.sectionTitle}>주간 하이라이트</Text>
            {highlights.map((line) => (
              <Text key={line} style={styles.highlightLine}>
                {line}
              </Text>
            ))}
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={210}>
          <View style={styles.highlightCard}>
            <Text style={styles.sectionTitle}>내 기록에게 묻기</Text>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="예: 이번 주에 내가 가장 자주 미룬 일은 뭐야?"
              placeholderTextColor={colors.mutedText}
              style={styles.questionInput}
              accessibilityLabel="저널 질문 입력"
            />
            <AppButton
              label="AI 답변 보기"
              onPress={() => setAnswer(answerFromJournal(history, userId, question))}
            />
            {answer ? <Text style={styles.answerText}>{answer}</Text> : null}
          </View>
        </ScreenFadeIn>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label="돌아가기" onPress={onBack} style={styles.backButton} />
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
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  month: {
    color: colors.text,
    fontSize: typography.section,
    fontFamily: typography.family.bold,
  },
  arrowRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowText: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 28,
    fontFamily: typography.family.bold,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  filterCell: {
    width: "31%",
  },
  calendarCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.soft,
  },
  weekHeader: {
    flexDirection: "row",
  },
  weekLabel: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: typography.subtitle,
    fontFamily: typography.family.medium,
    paddingBottom: spacing.xs,
  },
  weekRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dayText: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontFamily: typography.family.regular,
  },
  dayTextDim: {
    color: "#BAC5CF",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  reportCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.soft,
  },
  reportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  reportKey: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
  },
  reportValue: {
    color: colors.text,
    flex: 1,
    textAlign: "right",
    fontSize: typography.body,
    fontFamily: typography.family.bold,
  },
  chartCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.soft,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontFamily: typography.family.medium,
  },
  highlightCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadows.soft,
  },
  highlightLine: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 22,
    fontFamily: typography.family.regular,
  },
  questionInput: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontFamily: typography.family.regular,
    fontSize: typography.body,
  },
  answerText: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
    lineHeight: 22,
    backgroundColor: "#EAF3FA",
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  footer: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxl + 48,
  },
  backButton: {
    width: "100%",
  },
});
