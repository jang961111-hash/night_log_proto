import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { BrandMark } from "../components/BrandMark";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { HomeCalendarPreviewCard } from "../components/home/HomeCalendarPreviewCard";
import { HomeStudioBackdrop } from "../components/home/HomeStudioBackdrop";
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
  const { height } = useWindowDimensions();
  const compact = height < 760;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#F2F5F8", "#E8EDF2", "#DFE6EC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <HomeStudioBackdrop compact={compact} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          compact && styles.scrollContentCompact,
          { minHeight: height + 70 },
        ]}
      >
        <ScreenFadeIn style={styles.topBlock}>
          <Text style={styles.kicker}>NIGHT STUDIO</Text>
          <Text style={styles.welcome}>{userName}님, 오늘 밤 한 번에 정리해볼까요?</Text>
          <Text style={styles.meta}>연속 기록 {streak}일 · 누적 기록 {historyCount}회</Text>
        </ScreenFadeIn>

        <ScreenFadeIn delay={70} style={[styles.centerArea, compact && styles.centerAreaCompact]}>
          <View style={styles.brandWrap}>
            <BrandMark size={compact ? 94 : 106} labelSize={compact ? 33 : 38} />
          </View>
          <Text style={styles.centerTitle}>대화 시작하기</Text>
          <Text style={styles.centerSub}>손을 쓰지 않아도 됩니다. 지금 말하면 AI가 오늘을 정리하고 내일 일정까지 이어줍니다.</Text>
          <AppButton
            label="대화 시작하기"
            onPress={onStartChat}
            style={styles.ctaButton}
            accessibilityHint="저널 대화 화면으로 이동합니다."
          />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + 8,
    paddingBottom: 190,
    justifyContent: "center",
    gap: spacing.lg,
  },
  scrollContentCompact: {
    paddingTop: spacing.xl,
  },
  topBlock: {
    gap: 4,
  },
  kicker: {
    color: colors.primaryDeep,
    letterSpacing: 1.2,
    fontSize: typography.caption,
    fontFamily: typography.family.bold,
  },
  welcome: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 38,
    fontFamily: typography.family.bold,
  },
  meta: {
    marginTop: 2,
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
  },
  centerArea: {
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: "rgba(249,251,252,0.92)",
    borderWidth: 1,
    borderColor: "#C8DDE8",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  centerAreaCompact: {
    paddingVertical: spacing.lg,
  },
  brandWrap: {
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  centerTitle: {
    color: colors.text,
    fontSize: 32,
    textAlign: "center",
    fontFamily: typography.family.bold,
  },
  centerSub: {
    color: colors.mutedText,
    fontSize: typography.body,
    textAlign: "center",
    fontFamily: typography.family.regular,
    lineHeight: 23,
  },
  ctaButton: {
    width: "100%",
    minHeight: 62,
    marginTop: spacing.md,
  },
});
