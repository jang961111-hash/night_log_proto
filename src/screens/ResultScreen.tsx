import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { EmotionRadar } from "../components/charts/EmotionRadar";
import { colors, radius, shadows, spacing, typography } from "../theme/tokens";
import type { ResultBundle, ScheduleDraftItem } from "../types/app";

type ResultScreenProps = {
  bundle: ResultBundle | null;
  onChangeScheduleItems: (items: ScheduleDraftItem[]) => void;
  onGoMain: () => void;
  onGoSchedule: () => void;
  onOpenCalendar: () => void;
};

const moodKoreanLabel = {
  joy: "좋음",
  calm: "차분",
  stress: "스트레스",
  fatigue: "피곤",
} as const;

function SectionHeader({
  title,
  open,
  onPress,
}: {
  title: string;
  open: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`${title} ${open ? "접기" : "펼치기"}`}
      hitSlop={8}
      style={styles.sectionHeader}
    >
      <Text style={styles.sectionHeaderText}>{title}</Text>
      <Text style={styles.sectionHeaderIcon}>{open ? "△" : "▽"}</Text>
    </Pressable>
  );
}

export function ResultScreen({
  bundle,
  onChangeScheduleItems,
  onGoMain,
  onGoSchedule,
  onOpenCalendar,
}: ResultScreenProps) {
  const [openDiary, setOpenDiary] = useState(true);
  const [openReview, setOpenReview] = useState(false);
  const [openCoach, setOpenCoach] = useState(true);

  const selectedCount = useMemo(
    () => bundle?.scheduleItems.filter((item) => item.selected).length ?? 0,
    [bundle],
  );
  const adoptionRate = useMemo(() => {
    if (!bundle || bundle.scheduleItems.length === 0) {
      return 0;
    }
    return Math.round((selectedCount / bundle.scheduleItems.length) * 100);
  }, [bundle, selectedCount]);

  if (!bundle) {
    return (
      <View style={styles.emptyRoot}>
        <Text style={styles.emptyTitle}>결과</Text>
        <Text style={styles.emptyText}>아직 생성된 결과가 없습니다. 대화를 마친 뒤 결과를 확인해주세요.</Text>
        <View style={styles.emptyActions}>
          <AppButton label="메인" onPress={onGoMain} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenFadeIn>
          <AppHeader
            title="결과"
            subtitle="오늘 기록을 요약하고 내일 실행으로 연결합니다"
            onBack={onGoMain}
            backLabel="메인"
            right={<AppButton label="캘린더" onPress={onOpenCalendar} variant="outline" />}
          />
        </ScreenFadeIn>

        <ScreenFadeIn delay={80}>
          <View style={styles.panel}>
            <SectionHeader title="일기" open={openDiary} onPress={() => setOpenDiary((prev) => !prev)} />
            {openDiary ? (
              <View style={styles.diaryBox}>
                {bundle.result.finalDiary3Lines.map((line, index) => (
                  <Text key={`${line}-${index}`} style={styles.diaryLine}>
                    {index + 1}. {line}
                  </Text>
                ))}
              </View>
            ) : null}

            <SectionHeader
              title="오늘의 하루 돌아보기"
              open={openReview}
              onPress={() => setOpenReview((prev) => !prev)}
            />
            {openReview ? (
              <View style={styles.reviewBox}>
                <Text style={styles.reviewLabel}>감정 육각형 그래프</Text>
                <EmotionRadar metrics={bundle.emotionMetrics} />
                <Text style={styles.reviewSummary}>{bundle.emotionSummary}</Text>
              </View>
            ) : null}

            <SectionHeader
              title="AI 코치 리포트"
              open={openCoach}
              onPress={() => setOpenCoach((prev) => !prev)}
            />
            {openCoach ? (
              <View style={styles.reviewBox}>
                <View style={styles.coachRow}>
                  <Text style={styles.coachKey}>기록 방식</Text>
                  <Text style={styles.coachValue}>
                    {bundle.entryMode === "chat" ? "대화 모드" : "로그 모드"}
                  </Text>
                </View>
                <View style={styles.coachRow}>
                  <Text style={styles.coachKey}>체크인 감정</Text>
                  <Text style={styles.coachValue}>
                    {bundle.checkInMood ? moodKoreanLabel[bundle.checkInMood] : "선택 안함"}
                  </Text>
                </View>
                <View style={styles.coachRow}>
                  <Text style={styles.coachKey}>추천 수용률</Text>
                  <Text style={styles.coachValue}>{adoptionRate}%</Text>
                </View>
                <View style={styles.coachRow}>
                  <Text style={styles.coachKey}>사용 프롬프트</Text>
                  <Text style={styles.coachValue} numberOfLines={2}>
                    {bundle.promptUsed ?? "직접 입력"}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={120}>
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>내일 할일 추천목록</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scheduleRow}>
              {bundle.scheduleItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.scheduleCard, item.selected && styles.scheduleCardSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.selected }}
                  accessibilityLabel={`${item.title} ${item.time} ${item.selected ? "선택됨" : "선택 안됨"}`}
                  onPress={() => {
                    const next = bundle.scheduleItems.map((candidate) =>
                      candidate.id === item.id
                        ? { ...candidate, selected: !candidate.selected }
                        : candidate,
                    );
                    onChangeScheduleItems(next);
                  }}
                >
                  <Text style={styles.scheduleTitle}>{item.title}</Text>
                  <Text style={styles.scheduleTime}>{item.time}</Text>
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkBadgeText}>{item.selected ? "✓" : ""}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.selectionText}>선택된 일정 {selectedCount}개</Text>
          </View>
        </ScreenFadeIn>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label="메인" onPress={onGoMain} variant="outline" style={styles.footerButton} />
        <AppButton label="내일의 일정 조절하기" onPress={onGoSchedule} style={styles.footerButton} />
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
  panel: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  sectionHeaderText: {
    fontSize: typography.section,
    color: colors.text,
    fontFamily: typography.family.medium,
  },
  sectionHeaderIcon: {
    fontSize: typography.section,
    color: colors.text,
    fontFamily: typography.family.regular,
  },
  diaryBox: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    padding: spacing.md,
    gap: spacing.sm,
  },
  diaryLine: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
    lineHeight: 22,
  },
  reviewBox: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    padding: spacing.md,
    gap: spacing.sm,
  },
  reviewLabel: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontFamily: typography.family.medium,
  },
  reviewSummary: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
    textAlign: "center",
  },
  coachRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  coachKey: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
  },
  coachValue: {
    color: colors.text,
    flex: 1,
    textAlign: "right",
    fontSize: typography.body,
    fontFamily: typography.family.bold,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontFamily: typography.family.medium,
  },
  scheduleRow: {
    gap: spacing.sm,
  },
  scheduleCard: {
    width: 150,
    minHeight: 180,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  scheduleCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: "#E5F3FA",
  },
  scheduleTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
  },
  scheduleTime: {
    color: colors.mutedText,
    fontSize: typography.subtitle,
    fontFamily: typography.family.bold,
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  checkBadgeText: {
    color: "#fff",
    fontSize: 22,
    fontFamily: typography.family.bold,
  },
  selectionText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  footer: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxl + 48,
    flexDirection: "row",
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
  emptyRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontFamily: typography.family.bold,
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  emptyActions: {
    marginTop: spacing.sm,
  },
});
