import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { colors, spacing, typography } from "../theme/tokens";
import type { Gender, SignupForm } from "../types/app";

type SignupScreenProps = {
  loading: boolean;
  onSubmit: (form: SignupForm) => Promise<string | null>;
  onBack: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
};

const genders: Gender[] = ["남", "여", "기타"];

export function SignupScreen({
  loading,
  onSubmit,
  onBack,
  onOpenTerms,
  onOpenPrivacy,
}: SignupScreenProps) {
  const [form, setForm] = useState<SignupForm>({
    userId: "",
    password: "",
    passwordConfirm: "",
    name: "",
    birthDate: "",
    gender: "남",
    job: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const passwordConfirmRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const birthDateRef = useRef<TextInput>(null);
  const jobRef = useRef<TextInput>(null);

  const inlineError = useMemo(() => {
    if (form.password && form.password.length < 6) {
      return "비밀번호는 6자 이상이어야 합니다.";
    }
    if (form.passwordConfirm && form.password !== form.passwordConfirm) {
      return "비밀번호 확인이 일치하지 않습니다.";
    }
    return null;
  }, [form.password, form.passwordConfirm]);

  const handleSubmit = async () => {
    setError(null);
    if (!form.userId || !form.password || !form.passwordConfirm || !form.name || !form.birthDate || !form.job) {
      setError("필수 항목을 모두 입력해주세요.");
      return;
    }
    if (inlineError) {
      setError(inlineError);
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setError("이용약관과 개인정보 처리방침 동의가 필요합니다.");
      return;
    }

    const submitError = await onSubmit({
      ...form,
      userId: form.userId.trim(),
      name: form.name.trim(),
      birthDate: form.birthDate.trim(),
      job: form.job.trim(),
    });
    if (submitError) {
      setError(submitError);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.root}
    >
      <ScreenFadeIn style={styles.content}>
        <Text style={styles.title}>회원가입</Text>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppInput
            label="ID"
            value={form.userId}
            onChangeText={(value) => setForm((prev) => ({ ...prev, userId: value }))}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
          <AppInput
            ref={passwordRef}
            label="PASSWORD"
            value={form.password}
            onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))}
            secureTextEntry
            returnKeyType="next"
            onSubmitEditing={() => passwordConfirmRef.current?.focus()}
            blurOnSubmit={false}
          />
          <AppInput
            ref={passwordConfirmRef}
            label="PASSWORD 확인"
            value={form.passwordConfirm}
            onChangeText={(value) => setForm((prev) => ({ ...prev, passwordConfirm: value }))}
            secureTextEntry
            returnKeyType="next"
            onSubmitEditing={() => nameRef.current?.focus()}
            blurOnSubmit={false}
            error={inlineError}
          />
          <AppInput
            ref={nameRef}
            label="이름"
            value={form.name}
            onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
            returnKeyType="next"
            onSubmitEditing={() => birthDateRef.current?.focus()}
            blurOnSubmit={false}
          />

          <View style={styles.row}>
            <AppInput
              ref={birthDateRef}
              label="생년월일"
              value={form.birthDate}
              onChangeText={(value) => setForm((prev) => ({ ...prev, birthDate: value }))}
              placeholder="YYYY-MM-DD"
              returnKeyType="next"
              onSubmitEditing={() => jobRef.current?.focus()}
              blurOnSubmit={false}
              containerStyle={styles.birthInput}
            />
            <View style={styles.genderWrap}>
              <Text style={styles.genderLabel}>성별</Text>
              <View style={styles.genderRow}>
                {genders.map((gender) => {
                  const selected = form.gender === gender;
                  return (
                    <Pressable
                      key={gender}
                      style={styles.genderItem}
                      onPress={() => setForm((prev) => ({ ...prev, gender }))}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`성별 ${gender} ${selected ? "선택됨" : "선택 안됨"}`}
                    >
                      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                        {selected ? <View style={styles.radioInner} /> : null}
                      </View>
                      <Text style={styles.genderText}>{gender}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <AppInput
            ref={jobRef}
            label="직업"
            value={form.job}
            onChangeText={(value) => setForm((prev) => ({ ...prev, job: value }))}
            returnKeyType="done"
            onSubmitEditing={() => {
              void handleSubmit();
            }}
            error={error}
          />

          <View style={styles.policyWrap}>
            <View style={styles.policyRow}>
              <Pressable
                style={styles.checkTapArea}
                onPress={() => setAgreeTerms((prev) => !prev)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreeTerms }}
                accessibilityLabel={`이용약관 동의 ${agreeTerms ? "선택됨" : "선택 안됨"}`}
              >
                <View style={[styles.checkBox, agreeTerms && styles.checkBoxSelected]}>
                  {agreeTerms ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
              </Pressable>
              <Pressable
                onPress={onOpenTerms}
                accessibilityRole="button"
                accessibilityLabel="이용약관 보기"
              >
                <Text style={styles.policyText}>[필수] 이용약관 동의</Text>
              </Pressable>
            </View>
            <View style={styles.policyRow}>
              <Pressable
                style={styles.checkTapArea}
                onPress={() => setAgreePrivacy((prev) => !prev)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreePrivacy }}
                accessibilityLabel={`개인정보 처리방침 동의 ${agreePrivacy ? "선택됨" : "선택 안됨"}`}
              >
                <View style={[styles.checkBox, agreePrivacy && styles.checkBoxSelected]}>
                  {agreePrivacy ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
              </Pressable>
              <Pressable
                onPress={onOpenPrivacy}
                accessibilityRole="button"
                accessibilityLabel="개인정보 처리방침 보기"
              >
                <Text style={styles.policyText}>[필수] 개인정보 처리방침 동의</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton label="뒤로" onPress={onBack} variant="outline" />
            <AppButton
              label={loading ? "가입 중..." : "확인"}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </ScreenFadeIn>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.section,
    color: colors.text,
    fontFamily: typography.family.bold,
  },
  form: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-end",
  },
  birthInput: {
    flex: 1,
  },
  genderWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  genderLabel: {
    color: colors.text,
    fontFamily: typography.family.medium,
    fontSize: typography.subtitle,
  },
  genderRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  genderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#A9B6C3",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF3F6",
  },
  radioOuterSelected: {
    borderColor: colors.primary,
    backgroundColor: "#E3F4FA",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  genderText: {
    fontSize: typography.body,
    color: colors.text,
    fontFamily: typography.family.medium,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  policyWrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8E2EA",
    backgroundColor: "#F5F8FB",
    padding: spacing.sm,
    gap: spacing.xs,
  },
  policyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  checkTapArea: {
    paddingVertical: 2,
    paddingRight: 2,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkBoxSelected: {
    borderColor: colors.primary,
    backgroundColor: "#E2F2FA",
  },
  checkMark: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontFamily: typography.family.bold,
  },
  policyText: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
    textDecorationLine: "underline",
  },
});
