import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { colors, spacing, typography } from "../theme/tokens";

type LoginScreenProps = {
  loading: boolean;
  knownUserIds: string[];
  onLogin: (userId: string, password: string) => Promise<string | null>;
  onGoSignup: () => void;
  onBackToLanding: () => void;
};

export function LoginScreen({
  loading,
  knownUserIds,
  onLogin,
  onGoSignup,
  onBackToLanding,
}: LoginScreenProps) {
  const { width, height } = useWindowDimensions();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const trimmedUserId = userId.trim();
  const canSubmit = trimmedUserId.length > 0 && password.length > 0 && !loading;
  const compact = height < 760;
  const narrow = width < 360;
  const quickIds = knownUserIds.slice(0, 4);

  const fillKnownAccount = (knownId: string) => {
    setUserId(knownId);
    if (/^test\d+$/i.test(knownId) && password.length === 0) {
      setPassword("123456");
    }
    if (error) {
      setError(null);
    }
  };

  const handleLogin = async () => {
    if (!canSubmit) {
      return;
    }

    setError(null);
    const nextError = await onLogin(trimmedUserId, password);
    if (nextError) {
      setError(nextError);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.root}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenFadeIn style={styles.content}>
            <View style={styles.brandArea}>
              <Text style={[styles.brand, compact && styles.brandCompact]}>NightLog</Text>
              <Text style={[styles.brandTagline, compact && styles.brandTaglineCompact]}>
                오늘 하루, 편하게 말해보세요
              </Text>
              {quickIds.length > 0 ? (
                <View style={styles.quickAccountWrap}>
                  <Text style={styles.quickAccountLabel}>저장된 계정</Text>
                  <View style={styles.quickAccountRow}>
                    {quickIds.map((knownId) => (
                      <Pressable
                        key={knownId}
                        style={styles.quickAccountChip}
                        onPress={() => fillKnownAccount(knownId)}
                        accessibilityRole="button"
                        accessibilityLabel={`${knownId} 계정 입력`}
                        hitSlop={8}
                      >
                        <Text style={styles.quickAccountChipText}>{knownId}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.quickAccountHint}>테스트 계정 비밀번호 기본값: 123456</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.formArea}>
              <AppInput
                value={userId}
                onChangeText={(value) => {
                  setUserId(value);
                  if (error) {
                    setError(null);
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                placeholder="nightlog@gmail.com"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                containerStyle={styles.inputWrap}
              />

              <View style={styles.passwordWrap}>
                <AppInput
                  ref={passwordRef}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (error) {
                      setError(null);
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  placeholder="비밀번호"
                  onSubmitEditing={() => {
                    void handleLogin();
                  }}
                  error={error}
                  containerStyle={styles.passwordInputContainer}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  <Text style={styles.eyeText}>{showPassword ? "숨김" : "보기"}</Text>
                </Pressable>
              </View>

              <Pressable onPress={onBackToLanding} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.backText}>약관 화면으로 돌아가기</Text>
              </Pressable>

              <AppButton
                label={loading ? "로그인 중..." : "로그인"}
                onPress={() => {
                  void handleLogin();
                }}
                disabled={!canSubmit}
                size={narrow ? "md" : "lg"}
                style={styles.loginButton}
                accessibilityHint="입력한 계정으로 로그인합니다"
              />

              <Pressable onPress={onGoSignup} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.signupText}>
                  계정이 없으신가요? <Text style={styles.signupAccent}>회원 가입</Text>
                </Text>
              </Pressable>
            </View>
          </ScreenFadeIn>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  scrollContentCompact: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    gap: spacing.xl,
  },
  brandArea: {
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  brand: {
    color: colors.primaryDeep,
    fontSize: 52,
    letterSpacing: -1,
    fontFamily: typography.family.bold,
  },
  brandCompact: {
    fontSize: 44,
  },
  brandTagline: {
    color: colors.text,
    fontSize: 20,
    fontFamily: typography.family.medium,
  },
  brandTaglineCompact: {
    fontSize: 18,
  },
  quickAccountWrap: {
    marginTop: spacing.sm,
    alignItems: "center",
    gap: spacing.xs,
  },
  quickAccountLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  quickAccountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xs,
  },
  quickAccountChip: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAccountChipText: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
  },
  quickAccountHint: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.regular,
  },
  formArea: {
    gap: spacing.md,
  },
  inputWrap: {
    gap: 0,
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInputContainer: {
    gap: 0,
  },
  eyeButton: {
    position: "absolute",
    right: spacing.md,
    top: 16,
    padding: 4,
  },
  eyeText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  backText: {
    textAlign: "right",
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  loginButton: {
    width: "100%",
    marginTop: spacing.xs,
  },
  signupText: {
    textAlign: "center",
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  signupAccent: {
    color: "#5E8FBE",
    fontFamily: typography.family.bold,
  },
});
