import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { BrandMark } from "../components/BrandMark";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { colors, radius, spacing, typography } from "../theme/tokens";

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
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    setError(null);
    const nextError = await onLogin(userId.trim(), password);
    if (nextError) {
      setError(nextError);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenFadeIn style={styles.content}>
          <View style={styles.brandArea}>
            <BrandMark size={122} labelSize={40} />
            <Text style={styles.brandName}>NightLog</Text>
            <Text style={styles.brandTagline}>밤 3분, 오늘 감정을 정리하고 내일 행동을 확정하세요.</Text>
          </View>

          <View style={styles.formCard}>
            <AppInput
              label="ID"
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            <AppInput
              ref={passwordRef}
              label="PASSWORD"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={() => {
                void handleLogin();
              }}
              error={error}
            />

            <View style={styles.actions}>
              <AppButton
                label={loading ? "로그인 중..." : "로그인"}
                onPress={() => {
                  void handleLogin();
                }}
                disabled={loading}
                style={styles.actionButton}
              />
              <AppButton
                label="3초 회원가입"
                onPress={onGoSignup}
                variant="outline"
                style={styles.actionButton}
                disabled={loading}
              />
            </View>

            <AppButton
              label="처음 화면으로"
              onPress={onBackToLanding}
              variant="ghost"
              disabled={loading}
            />
          </View>
        </ScreenFadeIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    minHeight: "100%",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  content: {
    gap: spacing.lg,
  },
  brandArea: {
    alignItems: "center",
    gap: spacing.xs,
  },
  brandName: {
    color: colors.text,
    fontSize: 36,
    fontFamily: typography.family.bold,
  },
  brandTagline: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
    textAlign: "center",
    lineHeight: 23,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "#D7E5EF",
  },
  actions: {
    marginTop: spacing.xs,
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
