import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import { AppButton } from "../components/AppButton";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { colors, spacing, typography } from "../theme/tokens";

type LandingScreenProps = {
  onStartSignup: () => void;
  onGoLogin: () => void;
};

export function LandingScreen({ onStartSignup, onGoLogin }: LandingScreenProps) {
  const [requiredAgree, setRequiredAgree] = useState(false);
  const [marketingAgree, setMarketingAgree] = useState(false);

  return (
    <SafeAreaView style={styles.root}>
      <ScreenFadeIn style={styles.content}>
        <View style={styles.brandArea}>
          <Text style={styles.brand}>NightLog</Text>
          <Text style={styles.subtitle}>서비스 이용을 위해 약관에 동의해주세요</Text>
        </View>

        <View style={styles.agreementCard}>
          <Pressable
            style={styles.row}
            onPress={() => setRequiredAgree((prev) => !prev)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: requiredAgree }}
            accessibilityLabel={`필수 약관 동의 ${requiredAgree ? "선택됨" : "선택 안됨"}`}
          >
            <View style={[styles.circle, requiredAgree && styles.circleChecked]} />
            <Text style={styles.rowText}>
              <Text style={styles.required}>[필수] </Text>이용 약관 및 개인정보 처리방침에 동의합니다.
            </Text>
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={() => setMarketingAgree((prev) => !prev)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marketingAgree }}
            accessibilityLabel={`선택 약관 동의 ${marketingAgree ? "선택됨" : "선택 안됨"}`}
          >
            <View style={[styles.circle, marketingAgree && styles.circleChecked]} />
            <Text style={styles.rowText}>
              <Text style={styles.optional}>[선택] </Text>마케팅 정보 수신에 동의합니다.
            </Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <AppButton
            label="동의하고 시작하기"
            onPress={onStartSignup}
            disabled={!requiredAgree}
            style={styles.primaryButton}
          />
          <AppButton label="이미 계정이 있어요" onPress={onGoLogin} variant="ghost" />
        </View>
      </ScreenFadeIn>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + 6,
    paddingBottom: spacing.xxl,
    justifyContent: "space-between",
  },
  brandArea: {
    gap: spacing.sm,
  },
  brand: {
    color: colors.primaryDeep,
    fontSize: 52,
    fontFamily: typography.family.bold,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 35,
    fontFamily: typography.family.medium,
  },
  agreementCard: {
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  circle: {
    marginTop: 3,
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: "transparent",
  },
  circleChecked: {
    backgroundColor: "#DCEDE6",
  },
  rowText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.subtitle,
    lineHeight: 28,
    fontFamily: typography.family.regular,
  },
  required: {
    color: colors.primaryDeep,
    fontFamily: typography.family.medium,
  },
  optional: {
    color: colors.mutedText,
    fontFamily: typography.family.medium,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    minHeight: 64,
  },
});
