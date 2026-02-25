import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppHeader } from "../components/AppHeader";
import { AppInput } from "../components/AppInput";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { colors, radius, shadows, spacing, typography } from "../theme/tokens";
import type { UserAccount } from "../types/app";

type SettingsScreenProps = {
  account: UserAccount;
  loading: boolean;
  historyCount: number;
  scheduleCount: number;
  hasLatestResult: boolean;
  onBack: () => void;
  onSaveProfile: (patch: { name: string; job: string }) => Promise<string | null>;
  onOpenInterests: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onResetUserData: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onLogout: () => void;
};

export function SettingsScreen({
  account,
  loading,
  historyCount,
  scheduleCount,
  hasLatestResult,
  onBack,
  onSaveProfile,
  onOpenInterests,
  onOpenTerms,
  onOpenPrivacy,
  onResetUserData,
  onDeleteAccount,
  onLogout,
}: SettingsScreenProps) {
  const [name, setName] = useState(account.name);
  const [job, setJob] = useState(account.job);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(account.name);
    setJob(account.job);
  }, [account.job, account.name]);

  const handleSave = async () => {
    setMessage(null);
    setError(null);

    const nextName = name.trim();
    const nextJob = job.trim();

    if (!nextName || !nextJob) {
      setError("이름과 직업을 입력해주세요.");
      return;
    }

    const result = await onSaveProfile({ name: nextName, job: nextJob });
    if (result) {
      setError(result);
      return;
    }

    setMessage("프로필이 저장되었습니다.");
  };

  const confirmResetData = () => {
    Alert.alert(
      "내 기록 초기화",
      "이 계정의 일기 기록, 결과, 일정 초안을 모두 삭제합니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "초기화",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setMessage(null);
              setError(null);
              await onResetUserData();
              setMessage("내 기록이 초기화되었습니다.");
            })();
          },
        },
      ],
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "계정 삭제",
      "계정과 관련된 로컬 데이터가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "계정 삭제",
          style: "destructive",
          onPress: () => {
            void onDeleteAccount();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenFadeIn>
          <AppHeader
            title="설정"
            subtitle="내 정보, 개인화, 데이터 정책을 관리합니다"
            onBack={onBack}
          />
        </ScreenFadeIn>

        <ScreenFadeIn delay={70}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>계정 정보</Text>
            <Text style={styles.metaLabel}>ID</Text>
            <Text style={styles.metaValue}>{account.userId}</Text>
            <Text style={styles.metaLabel}>가입일</Text>
            <Text style={styles.metaValue}>{new Date(account.createdAt).toLocaleDateString("ko-KR")}</Text>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>{historyCount}</Text>
                <Text style={styles.metricLabel}>누적 기록</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>{scheduleCount}</Text>
                <Text style={styles.metricLabel}>내일 일정</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>{hasLatestResult ? "ON" : "OFF"}</Text>
                <Text style={styles.metricLabel}>최근 결과</Text>
              </View>
            </View>
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={120}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>프로필 편집</Text>
            <AppInput label="이름" value={name} onChangeText={setName} />
            <AppInput label="직업" value={job} onChangeText={setJob} error={error} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <AppButton label={loading ? "저장 중..." : "프로필 저장"} onPress={() => void handleSave()} disabled={loading} />
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={170}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>개인화</Text>
            <AppButton label="관심사 다시 선택" onPress={onOpenInterests} variant="outline" />
            <View style={styles.twoButtons}>
              <AppButton label="이용약관" onPress={onOpenTerms} variant="outline" style={styles.half} />
              <AppButton label="개인정보 정책" onPress={onOpenPrivacy} variant="outline" style={styles.half} />
            </View>
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={220}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>데이터 관리</Text>
            <Text style={styles.warnText}>초기화/삭제 동작은 되돌릴 수 없습니다.</Text>
            <AppButton
              label="내 기록 초기화"
              onPress={confirmResetData}
              variant="outline"
              disabled={loading}
            />
            <AppButton
              label="로그아웃"
              onPress={onLogout}
              variant="outline"
              disabled={loading}
            />
            <AppButton
              label="계정 삭제"
              onPress={confirmDeleteAccount}
              variant="ghost"
              disabled={loading}
            />
          </View>
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
  cardTitle: {
    color: colors.primaryDeep,
    fontSize: typography.subtitle,
    fontFamily: typography.family.bold,
  },
  metaLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  metaValue: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metricItem: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#EFF4F8",
    paddingVertical: spacing.sm,
    alignItems: "center",
    gap: 2,
  },
  metricNumber: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontFamily: typography.family.bold,
  },
  metricLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.regular,
  },
  message: {
    color: colors.success,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  twoButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  warnText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: typography.family.regular,
  },
});
