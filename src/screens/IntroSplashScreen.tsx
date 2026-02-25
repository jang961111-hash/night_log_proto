import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { BrandMark } from "../components/BrandMark";
import { colors, spacing, typography } from "../theme/tokens";

type IntroSplashScreenProps = {
  onDone: () => void;
};

export function IntroSplashScreen({ onDone }: IntroSplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 1200);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View style={styles.root}>
      <BrandMark size={170} labelSize={52} />
      <Text style={styles.brand}>NightLog</Text>
      <Text style={styles.tagline}>밤 3분, 오늘 감정 정리와 내일 실행 1개 확정</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  brand: {
    color: colors.text,
    fontSize: 36,
    fontFamily: typography.family.bold,
    letterSpacing: 0.4,
  },
  tagline: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
    textAlign: "center",
    lineHeight: 22,
  },
});
