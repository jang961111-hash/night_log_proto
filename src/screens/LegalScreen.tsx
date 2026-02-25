import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { colors, radius, shadows, spacing, typography } from "../theme/tokens";
import type { LegalDocType } from "../types/app";

type LegalScreenProps = {
  docType: LegalDocType;
  onBack: () => void;
};

function termsContent(): string[] {
  return [
    "1. NightLog는 사용자의 개인 회고를 돕는 서비스이며, 의학적 진단/치료를 대체하지 않습니다.",
    "2. 회원은 본인 계정 정보를 정확하게 입력해야 하며, 계정 관리 책임은 회원에게 있습니다.",
    "3. 서비스 내 콘텐츠(요약/추천)는 참고 정보이며, 실제 실행 여부는 사용자 판단에 따릅니다.",
    "4. 앱은 안정성을 위해 업데이트될 수 있으며, 중대한 변경 시 공지합니다.",
    "5. 사용자 정책 위반 또는 시스템 보호가 필요한 경우 서비스 이용이 제한될 수 있습니다.",
  ];
}

function privacyContent(): string[] {
  return [
    "1. NightLog는 로컬 저장소를 기반으로 계정/기록 데이터를 기기에 저장합니다.",
    "2. 수집 항목: ID, 이름, 생년월일, 성별, 직업, 관심사, 일기 결과/감정/일정 데이터.",
    "3. 목적: 개인화 추천, 기록 복원, 캘린더/리포트 통계 제공.",
    "4. 사용자는 설정에서 기록 초기화 또는 계정 삭제를 실행할 수 있습니다.",
    "5. 향후 서버 동기화가 도입될 경우, 별도 동의와 정책 업데이트 후 적용됩니다.",
  ];
}

export function LegalScreen({ docType, onBack }: LegalScreenProps) {
  const title = docType === "terms" ? "이용약관" : "개인정보 처리방침";
  const subtitle =
    docType === "terms"
      ? "서비스 이용 조건과 사용자 책임 범위를 안내합니다."
      : "데이터 수집·이용·보관·삭제 정책을 안내합니다.";
  const content = docType === "terms" ? termsContent() : privacyContent();

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenFadeIn>
          <AppHeader title={title} subtitle={subtitle} onBack={onBack} />
        </ScreenFadeIn>

        <ScreenFadeIn delay={70}>
          <View style={styles.card}>
            {content.map((line) => (
              <Text key={line} style={styles.line}>
                {line}
              </Text>
            ))}
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={120}>
          <View style={styles.card}>
            <Text style={styles.footTitle}>문의</Text>
            <Text style={styles.line}>- 이메일: support@nightlog.app</Text>
            <Text style={styles.line}>- 마지막 업데이트: 2026-02-24</Text>
          </View>
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
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  line: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 23,
    fontFamily: typography.family.regular,
  },
  footTitle: {
    color: colors.primaryDeep,
    fontSize: typography.subtitle,
    fontFamily: typography.family.bold,
  },
});