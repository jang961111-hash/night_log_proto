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
  View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { colors, spacing, typography } from "../theme/tokens";

type LoginScreenProps = {
  loading: boolean;
  onLogin: (userId: string, password: string) => Promise<string | null>;
  onGoSignup: () => void;
  onBackToLanding: () => void;
};

export function LoginScreen({
  loading,
  onLogin,
  onGoSignup,
  onBackToLanding,
}: LoginScreenProps) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const trimmedUserId = userId.trim();
  const canSubmit = trimmedUserId.length > 0 && password.length > 0 && !loading;

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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenFadeIn style={styles.content}>
            <View style={styles.brandArea}>
              <Text style={styles.brand}>NightLog</Text>
              <Text style={styles.brandTagline}>오늘 하루, 편하게 말해보세요</Text>
            </View>

            <View style={styles.formArea}>
              <AppButton
                label="Google로 계속하기"
                onPress={() => {
                  // 소셜 로그인은 MVP 범위 밖. 시안 참고용 버튼만 노출.
                }}
                variant="outline"
                disabled
                style={styles.googleButton}
              />

              <View style={styles.separatorRow}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>또는</Text>
                <View style={styles.separatorLine} />
              </View>

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
                style={styles.loginButton}
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
  brandTagline: {
    color: colors.text,
    fontSize: 20,
    fontFamily: typography.family.medium,
  },
  formArea: {
    gap: spacing.md,
  },
  googleButton: {
    minHeight: 58,
    borderColor: colors.border,
  },
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
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
    minHeight: 60,
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
