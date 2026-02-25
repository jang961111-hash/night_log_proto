import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { BrandMark } from "../components/BrandMark";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { colors, radius, spacing, typography } from "../theme/tokens";

type LandingScreenProps = {
  onStartSignup: () => void;
  onGoLogin: () => void;
};

export function LandingScreen({ onStartSignup, onGoLogin }: LandingScreenProps) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#F5FBFF", "#EAF5FB", "#EEF1F4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      <ScreenFadeIn style={styles.content}>
        <View style={styles.hero}>
          <BrandMark size={132} labelSize={44} />
          <Text style={styles.brand}>NightLog</Text>
          <Text style={styles.catchLine}>오늘 감정을 3분 안에 정리하고 내일 행동을 확정하세요.</Text>
          <Text style={styles.subLine}>
            대화형 AI 코치가 요약, 일정 추천, 주간 리포트까지 연결해드립니다.
          </Text>
        </View>

        <View style={styles.valueCard}>
          <Text style={styles.valueTitle}>왜 NightLog인가요?</Text>
          <Text style={styles.valueItem}>1. 타이핑 없이 음성 중심으로 기록</Text>
          <Text style={styles.valueItem}>2. 하루 요약과 감정 리포트를 즉시 확인</Text>
          <Text style={styles.valueItem}>3. 내일 실행 가능한 일정까지 바로 저장</Text>
        </View>

        <View style={styles.actions}>
          <AppButton label="3초 회원가입 시작" onPress={onStartSignup} style={styles.actionButton} />
          <AppButton label="이미 계정이 있어요" onPress={onGoLogin} variant="outline" style={styles.actionButton} />
        </View>
      </ScreenFadeIn>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + 8,
    paddingBottom: spacing.xxl,
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
  },
  brand: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: 42,
    letterSpacing: 0.4,
    fontFamily: typography.family.bold,
  },
  catchLine: {
    color: colors.text,
    fontSize: typography.section,
    textAlign: "center",
    fontFamily: typography.family.bold,
    lineHeight: 34,
  },
  subLine: {
    color: colors.mutedText,
    fontSize: typography.body,
    textAlign: "center",
    fontFamily: typography.family.regular,
    lineHeight: 23,
    paddingHorizontal: spacing.sm,
  },
  valueCard: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#D7E5EF",
    padding: spacing.md,
    gap: spacing.xs,
  },
  valueTitle: {
    color: colors.primaryDeep,
    fontSize: typography.subtitle,
    fontFamily: typography.family.bold,
    marginBottom: 2,
  },
  valueItem: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
    lineHeight: 23,
  },
  actions: {
    gap: spacing.sm,
  },
  actionButton: {
    width: "100%",
  },
});
