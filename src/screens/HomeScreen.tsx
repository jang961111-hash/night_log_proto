import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { HomeCalendarPreviewCard } from "../components/home/HomeCalendarPreviewCard";
import { colors, radius, spacing, typography } from "../theme/tokens";
import type { HomeCalendarPreview } from "../types/app";

type HomeScreenProps = {
  userName: string;
  streak: number;
  historyCount: number;
  onStartChat: () => void;
  onOpenCalendar: () => void;
  onOpenLatestResult: () => void;
  hasLatestResult: boolean;
  calendarPreview: HomeCalendarPreview;
};

export function HomeScreen({
  userName,
  streak,
  historyCount,
  onStartChat,
  onOpenCalendar,
  onOpenLatestResult,
  hasLatestResult,
  calendarPreview,
}: HomeScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenFadeIn>
          <View style={styles.heroCard}>
            <Text style={styles.kicker}>HOME</Text>
            <Text style={styles.welcome}>{userName}님, 오늘 하루를 정리해볼까요?</Text>
            <Text style={styles.subCopy}>대화로 기록하고, 내일 실행할 일정까지 한 번에 정리할 수 있어요.</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>연속 기록</Text>
                <Text style={styles.statValue}>{streak}일</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>누적 기록</Text>
                <Text style={styles.statValue}>{historyCount}회</Text>
              </View>
            </View>
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={70}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>대화 시작하기</Text>
            <Text style={styles.ctaDesc}>지금 떠오르는 생각을 짧게 말해보세요. AI가 핵심을 정리해드립니다.</Text>
            <AppButton
              label="대화 시작하기"
              onPress={onStartChat}
              style={styles.ctaButton}
              accessibilityHint="저널 대화 화면으로 이동합니다"
            />
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={120}>
          <HomeCalendarPreviewCard
            preview={calendarPreview}
            hasLatestResult={hasLatestResult}
            onOpenCalendar={onOpenCalendar}
            onOpenLatestResult={onOpenLatestResult}
          />
        </ScreenFadeIn>
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
    paddingBottom: 190,
    gap: spacing.md,
  },
  heroCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#D8E3EC",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  kicker: {
    color: colors.primaryDeep,
    letterSpacing: 1,
    fontSize: typography.caption,
    fontFamily: typography.family.bold,
  },
  welcome: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 37,
    fontFamily: typography.family.bold,
  },
  subCopy: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 23,
    fontFamily: typography.family.regular,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statItem: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#D8E3EC",
    backgroundColor: "#F3F7FA",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: 2,
  },
  statLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  statValue: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontFamily: typography.family.bold,
  },
  ctaCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#D8E3EC",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  ctaTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontFamily: typography.family.bold,
  },
  ctaDesc: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 23,
    fontFamily: typography.family.regular,
  },
  ctaButton: {
    marginTop: spacing.sm,
    width: "100%",
    minHeight: 58,
  },
});
