import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
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

function isValidBirthDate(value: string): boolean {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }

  const [yearRaw, monthRaw, dayRaw] = trimmed.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

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

  const inlinePasswordError = useMemo(() => {
    if (form.password && form.password.length < 6) {
      return "비밀번호는 6자 이상이어야 합니다.";
    }
    if (form.passwordConfirm && form.password !== form.passwordConfirm) {
      return "비밀번호 확인이 일치하지 않습니다.";
    }
    return null;
  }, [form.password, form.passwordConfirm]);

  const inlineBirthDateError = useMemo(() => {
    if (!form.birthDate) {
      return null;
    }
    if (!isValidBirthDate(form.birthDate)) {
      return "생년월일 형식이 올바르지 않습니다. 예: 1998-04-12";
    }
    return null;
  }, [form.birthDate]);

  const requiredFilled =
    form.userId.trim().length > 0 &&
    form.password.length > 0 &&
    form.passwordConfirm.length > 0 &&
    form.name.trim().length > 0 &&
    form.birthDate.trim().length > 0 &&
    form.job.trim().length > 0;

  const canSubmit =
    requiredFilled &&
    !inlinePasswordError &&
    !inlineBirthDateError &&
    agreeTerms &&
    agreePrivacy &&
    !loading;

  const updateField = <K extends keyof SignupForm>(key: K, value: SignupForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!requiredFilled) {
      setError("필수 항목을 모두 입력해주세요.");
      return;
    }
    if (inlinePasswordError) {
      setError(inlinePasswordError);
      return;
    }
    if (inlineBirthDateError) {
      setError(inlineBirthDateError);
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setError("이용약관과 개인정보 처리방침에 동의해주세요.");
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
      <SafeAreaView style={styles.safeArea}>
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
              onChangeText={(value) => updateField("userId", value)}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />

            <AppInput
              ref={passwordRef}
              label="PASSWORD"
              value={form.password}
              onChangeText={(value) => updateField("password", value)}
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => passwordConfirmRef.current?.focus()}
              blurOnSubmit={false}
            />

            <AppInput
              ref={passwordConfirmRef}
              label="PASSWORD 확인"
              value={form.passwordConfirm}
              onChangeText={(value) => updateField("passwordConfirm", value)}
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => nameRef.current?.focus()}
              blurOnSubmit={false}
              error={inlinePasswordError}
            />

            <AppInput
              ref={nameRef}
              label="이름"
              value={form.name}
              onChangeText={(value) => updateField("name", value)}
              returnKeyType="next"
              onSubmitEditing={() => birthDateRef.current?.focus()}
              blurOnSubmit={false}
            />

            <View style={styles.row}>
              <AppInput
                ref={birthDateRef}
                label="생년월일"
                value={form.birthDate}
                onChangeText={(value) => updateField("birthDate", value)}
                placeholder="YYYY-MM-DD"
                returnKeyType="next"
                onSubmitEditing={() => jobRef.current?.focus()}
                blurOnSubmit={false}
                containerStyle={styles.birthInput}
                error={inlineBirthDateError}
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
                        onPress={() => updateField("gender", gender)}
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
              onChangeText={(value) => updateField("job", value)}
              returnKeyType="done"
              onSubmitEditing={() => {
                void handleSubmit();
              }}
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
                <Pressable onPress={onOpenTerms} accessibilityRole="button" accessibilityLabel="이용약관 보기">
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actions}>
              <AppButton label="뒤로" onPress={onBack} variant="outline" />
              <AppButton
                label={loading ? "가입 중..." : "가입하기"}
                onPress={() => {
                  void handleSubmit();
                }}
                disabled={!canSubmit}
              />
            </View>
          </ScrollView>
        </ScreenFadeIn>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
    paddingTop: spacing.xl,
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
    alignItems: "flex-start",
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
    flexWrap: "wrap",
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
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
});