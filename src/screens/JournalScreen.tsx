import * as Speech from "expo-speech";
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionErrorEvent,
  type ExpoSpeechRecognitionResultEvent,
} from "expo-speech-recognition";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import { SelectChip } from "../components/SelectChip";
import {
  buildEmotionMetrics,
  buildEmotionSummary,
  buildScheduleItems,
  makeId,
  normalizeTime,
} from "../lib/insights";
import { apiChatEnd, apiChatStart, apiChatTurn } from "../lib/mockApi";
import type { ChatState, DiaryMode, EmotionTag, EndResponse } from "../lib/schema";
import { colors, radius, shadows, spacing, typography } from "../theme/tokens";
import type { ResultBundle, ScheduleDraftItem } from "../types/app";

type JournalScreenProps = {
  userName: string;
  streak: number;
  autoStartToken: number;
  onComplete: (bundle: ResultBundle) => void;
  onGoHome: () => void;
  onOpenCalendar: () => void;
  onLogout: () => void;
};

type ChatLine = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const modes: DiaryMode[] = ["Deep Reflection", "Stress Reset", "Gratitude", "Sleep Prep"];

const modeLabel: Record<DiaryMode, string> = {
  "Deep Reflection": "깊은 회고",
  "Stress Reset": "스트레스 리셋",
  Gratitude: "감사 일기",
  "Sleep Prep": "수면 준비",
};

const moodOptions: Array<{ tag: EmotionTag; label: string }> = [
  { tag: "joy", label: "좋음" },
  { tag: "calm", label: "차분" },
  { tag: "stress", label: "스트레스" },
  { tag: "fatigue", label: "피곤" },
];

const basePrompts = [
  "오늘 가장 기억에 남는 장면은 뭐였지?",
  "내일 꼭 해내고 싶은 한 가지는 무엇일까?",
  "지금 마음을 한 문장으로 정리하면?",
];

const moodPrompts: Record<EmotionTag, string[]> = {
  joy: ["오늘 잘한 점을 2가지만 적어줘", "이 좋은 흐름을 내일도 이어가려면?"],
  calm: ["오늘 안정감을 준 순간은 언제였지?", "내일도 차분함을 지킬 첫 행동은?"],
  stress: ["지금 가장 부담되는 일은 정확히 뭐야?", "내일 부담을 줄일 첫 10분 행동은?"],
  fatigue: ["오늘 에너지를 가장 많이 쓴 일은 뭐였지?", "내일 피로를 줄이는 시작 루틴을 정해줘"],
};

function uniqueEmotions(tags: EmotionTag[]): EmotionTag[] {
  return Array.from(new Set(tags));
}

function micBar(value: number): string {
  if (value >= 8) {
    return "█████";
  }
  if (value >= 6) {
    return "████░";
  }
  if (value >= 4) {
    return "███░░";
  }
  if (value >= 2) {
    return "██░░░";
  }
  return "█░░░░";
}

function mergeScheduleItems(
  resultItems: ScheduleDraftItem[],
  manualItems: ScheduleDraftItem[],
): ScheduleDraftItem[] {
  const merged = [...resultItems];

  for (const manual of manualItems) {
    const exists = merged.some((item) => item.title.trim() === manual.title.trim() && item.time === manual.time);
    if (!exists) {
      merged.push(manual);
    }
  }

  return merged.slice(0, 10);
}

export function JournalScreen({
  userName,
  streak,
  autoStartToken,
  onComplete,
  onGoHome,
  onOpenCalendar,
  onLogout,
}: JournalScreenProps) {
  const [mode, setMode] = useState<DiaryMode>("Deep Reflection");
  const [checkInMood, setCheckInMood] = useState<EmotionTag | null>(null);
  const [entryMode, setEntryMode] = useState<"chat" | "log">("chat");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatState, setChatState] = useState<ChatState | null>(null);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [emotions, setEmotions] = useState<EmotionTag[]>([]);
  const [loading, setLoading] = useState(false);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("음성 대기");
  const [micLevel, setMicLevel] = useState(0);

  const [manualItems, setManualItems] = useState<ScheduleDraftItem[]>([]);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualTime, setManualTime] = useState("09:00");
  const [manualError, setManualError] = useState<string | null>(null);
  const [promptUsed, setPromptUsed] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const voiceEnabledRef = useRef(true);
  const speakingRef = useRef(false);
  const sendingVoiceRef = useRef(false);
  const autoListenRef = useRef(true);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  const canSend = Boolean(sessionId);
  const stateText = useMemo(() => (chatState ? chatState : "대기"), [chatState]);
  const starterPrompts = useMemo(() => {
    if (!checkInMood) {
      return basePrompts;
    }
    return [...moodPrompts[checkInMood], ...basePrompts].slice(0, 4);
  }, [checkInMood]);

  const appendMessage = (role: "assistant" | "user", content: string) => {
    setMessages((prev) => [...prev, { id: makeId(), role, content }]);
  };

  const startListening = async () => {
    if (!voiceEnabledRef.current || !sessionIdRef.current) {
      return;
    }
    if (loadingRef.current || speakingRef.current) {
      return;
    }
    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
        setVoiceStatus("음성 인식을 지원하지 않는 기기입니다");
        return;
      }
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setVoiceStatus("마이크 권한이 필요합니다");
        return;
      }

      autoListenRef.current = true;
      setVoiceStatus("듣는 중");
      ExpoSpeechRecognitionModule.start({
        lang: "ko-KR",
        interimResults: true,
        continuous: true,
        maxAlternatives: 1,
        addsPunctuation: true,
      });
    } catch {
      setVoiceStatus("음성 시작 실패");
    }
  };

  const stopListening = (manual = false) => {
    if (manual) {
      autoListenRef.current = false;
    }

    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // no-op
    }
  };

  const speakAssistant = async (content: string) => {
    if (!voiceEnabledRef.current || !sessionIdRef.current) {
      return;
    }
    try {
      stopListening();
      speakingRef.current = true;
      setVoiceStatus("AI가 말하는 중");
      await Speech.stop();
      Speech.speak(content, {
        language: "ko-KR",
        rate: 0.95,
        pitch: 1.0,
        onDone: () => {
          speakingRef.current = false;
          if (voiceEnabledRef.current && sessionIdRef.current) {
            void startListening();
          }
        },
        onStopped: () => {
          speakingRef.current = false;
        },
      });
    } catch {
      speakingRef.current = false;
      setVoiceStatus("TTS 재생 실패");
    }
  };

  const stopVoice = async () => {
    stopListening(true);
    try {
      await Speech.stop();
    } catch {
      // no-op
    }
    setListening(false);
    setVoiceStatus("음성 대기");
  };

  const handleStart = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const start = await apiChatStart(mode);
      setSessionId(start.sessionId);
      setChatState(start.state);
      setMessages([{ id: makeId(), role: "assistant", content: start.assistantQuestion }]);
      setEmotions(uniqueEmotions([...start.emotionSnapshot, ...(checkInMood ? [checkInMood] : [])]));
      setInput("");
      setManualItems([]);
      setPromptUsed(null);

      if (voiceEnabledRef.current) {
        await speakAssistant(start.assistantQuestion);
      }
    } catch {
      Alert.alert("시작 실패", "대화를 시작할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (raw: string, fromVoice = false) => {
    if (loading || !sessionIdRef.current) {
      sendingVoiceRef.current = false;
      return;
    }

    const text = raw.trim();
    if (!text) {
      sendingVoiceRef.current = false;
      return;
    }

    if (!messages.some((message) => message.role === "user")) {
      setPromptUsed(text);
    }

    setLoading(true);
    setInput("");
    appendMessage("user", text);

    if (fromVoice) {
      setVoiceStatus("AI가 생각하는 중");
    }

    try {
      const turn = await apiChatTurn(sessionIdRef.current, text);
      setChatState(turn.state);
      setEmotions(uniqueEmotions([...turn.emotionSnapshot, ...(checkInMood ? [checkInMood] : [])]));

      const assistantText =
        entryMode === "chat"
          ? turn.assistantQuestion
          : "로그 반영 완료. 더 말하거나 조기 종료로 결과를 확인하세요.";

      appendMessage("assistant", assistantText);

      if (voiceEnabledRef.current) {
        await speakAssistant(assistantText);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "전송 실패";
      Alert.alert("전송 실패", message);

      if (message.includes("Session not found")) {
        setSessionId(null);
        setChatState(null);
        setMessages([]);
      }
    } finally {
      setLoading(false);
      sendingVoiceRef.current = false;
    }
  };

  const addManualItem = () => {
    const title = manualTitle.trim();

    if (!title) {
      setManualError("제목을 입력해주세요.");
      return;
    }

    const item: ScheduleDraftItem = {
      id: makeId(),
      title,
      time: normalizeTime(manualTime),
      selected: true,
      source: "manual",
    };

    setManualItems((prev) => [...prev, item]);
    setManualTitle("");
    setManualTime("09:00");
    setManualError(null);
    setManualModalOpen(false);
  };

  const removeManualItem = (id: string) => {
    setManualItems((prev) => prev.filter((item) => item.id !== id));
  };

  const finishSession = async () => {
    if (loading || !sessionIdRef.current) {
      return;
    }

    setLoading(true);

    try {
      stopListening(true);

      const end = await apiChatEnd(sessionIdRef.current);
      const finalResult: EndResponse = end;
      const finalEmotions = uniqueEmotions([...emotions, ...(checkInMood ? [checkInMood] : [])]);
      const metrics = buildEmotionMetrics(finalEmotions);
      const mergedSchedule = mergeScheduleItems(buildScheduleItems(finalResult), manualItems);

      const bundle: ResultBundle = {
        endedAt: new Date().toISOString(),
        result: finalResult,
        emotionTags: finalEmotions,
        emotionMetrics: metrics,
        emotionSummary: buildEmotionSummary(metrics, finalEmotions),
        entryMode,
        checkInMood,
        promptUsed,
        scheduleItems: mergedSchedule,
      };

      setSessionId(null);
      setChatState(null);
      setManualItems([]);
      void stopVoice();
      onComplete(bundle);
    } catch (error) {
      const message = error instanceof Error ? error.message : "종료 실패";
      Alert.alert("종료 실패", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const startSub = ExpoSpeechRecognitionModule.addListener("start", () => {
        setListening(true);
        setVoiceStatus("듣는 중");
      });

      const endSub = ExpoSpeechRecognitionModule.addListener("end", () => {
        setListening(false);

        if (
          autoListenRef.current &&
          voiceEnabledRef.current &&
          sessionIdRef.current &&
          !loadingRef.current &&
          !speakingRef.current
        ) {
          setTimeout(() => {
            void startListening();
          }, 180);
        }
      });

      const resultSub = ExpoSpeechRecognitionModule.addListener(
        "result",
        (event: ExpoSpeechRecognitionResultEvent) => {
          const transcript = event.results[0]?.transcript?.trim();
          if (!transcript || !sessionIdRef.current || !voiceEnabledRef.current) {
            return;
          }

          setInput(transcript);

          if (!event.isFinal || sendingVoiceRef.current || loadingRef.current) {
            return;
          }

          sendingVoiceRef.current = true;
          void handleSend(transcript, true);
        },
      );

      const errorSub = ExpoSpeechRecognitionModule.addListener(
        "error",
        (event: ExpoSpeechRecognitionErrorEvent) => {
          setListening(false);
          sendingVoiceRef.current = false;
          setVoiceStatus(`음성 오류: ${event.error}`);
        },
      );

      const volumeSub = ExpoSpeechRecognitionModule.addListener("volumechange", (event) => {
        const normalized = Math.max(0, Math.min(10, event.value + 2));
        setMicLevel(normalized);
      });

      return () => {
        startSub.remove();
        endSub.remove();
        resultSub.remove();
        errorSub.remove();
        volumeSub.remove();
      };
    } catch {
      setVoiceEnabled(false);
      setVoiceStatus("음성 모듈은 개발 빌드에서 사용 가능합니다");
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (autoStartToken > 0 && !sessionId && !loading) {
      void handleStart();
    }
  }, [autoStartToken]);

  useEffect(() => {
    return () => {
      void stopVoice();
    };
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenFadeIn>
          <View style={styles.headerCard}>
            <View>
              <Text style={styles.title}>NightLog</Text>
              <Text style={styles.subtitle}>{userName}님 · 연속 {streak}일</Text>
            </View>
            <View style={styles.headerActions}>
              <AppButton label="메인" onPress={onGoHome} variant="outline" />
              <AppButton label="캘린더" onPress={onOpenCalendar} variant="outline" />
              <AppButton label="로그아웃" onPress={onLogout} variant="ghost" />
            </View>
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={80}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>오늘 감정 체크인</Text>
            <View style={styles.chipRow}>
              {moodOptions.map((mood) => (
                <View key={mood.tag} style={styles.chipCell}>
                  <SelectChip
                    label={mood.label}
                    selected={checkInMood === mood.tag}
                    onPress={() => setCheckInMood((prev) => (prev === mood.tag ? null : mood.tag))}
                  />
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>대화 모드</Text>
            <View style={styles.chipRow}>
              {modes.map((item) => (
                <View key={item} style={styles.chipCell}>
                  <SelectChip
                    label={modeLabel[item]}
                    selected={mode === item}
                    onPress={() => setMode(item)}
                  />
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>오늘 시작 프롬프트</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptRow}>
              {starterPrompts.map((prompt) => {
                const selected = promptUsed === prompt;
                return (
                  <Pressable
                    key={prompt}
                    style={[styles.promptChip, selected && styles.promptChipSelected]}
                    onPress={() => {
                      setInput(prompt);
                      setPromptUsed(prompt);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`프롬프트 ${selected ? "선택됨" : "선택 안됨"}: ${prompt}`}
                  >
                    <Text style={[styles.promptChipText, selected && styles.promptChipTextSelected]}>
                      {prompt}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.entryRow}>
              <AppButton
                label={entryMode === "chat" ? "대화 모드" : "로그 모드"}
                onPress={() => setEntryMode((prev) => (prev === "chat" ? "log" : "chat"))}
                variant="outline"
                style={styles.entryButton}
              />
              <AppButton
                label={loading ? "준비 중" : sessionId ? "재시작" : "시작"}
                onPress={() => void handleStart()}
                disabled={loading}
                style={styles.entryButton}
              />
            </View>
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={120}>
          <View style={styles.sectionCard}>
            <View style={styles.voiceRow}>
              <Text style={styles.voiceTitle}>핸즈프리 음성</Text>
              <AppButton
                label={voiceEnabled ? "음성 끄기" : "음성 켜기"}
                onPress={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);

                  if (!next) {
                    void stopVoice();
                    setVoiceStatus("음성 비활성");
                  } else if (sessionIdRef.current) {
                    void startListening();
                  }
                }}
                variant={voiceEnabled ? "outline" : "primary"}
              />
            </View>
            <Text style={styles.voiceStatus}>
              {voiceStatus} · {listening ? "마이크 ON" : "마이크 OFF"} · {micBar(micLevel)}
            </Text>
            <View style={styles.entryRow}>
              <AppButton
                label="한 번 듣기"
                onPress={() => void startListening()}
                variant="outline"
                disabled={!canSend || !voiceEnabled}
                style={styles.entryButton}
              />
              <AppButton
                label="듣기 중지"
                onPress={() => stopListening(true)}
                variant="outline"
                disabled={!listening}
                style={styles.entryButton}
              />
            </View>
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={160}>
          <View style={styles.sectionCard}>
            <View style={styles.chatBox}>
              {messages.length === 0 ? (
                <Text style={styles.emptyText}>대화를 시작하면 AI가 먼저 질문합니다.</Text>
              ) : (
                messages.map((message) => (
                  <View
                    key={message.id}
                    style={[styles.bubble, message.role === "assistant" ? styles.assistant : styles.user]}
                  >
                    <Text style={styles.bubbleRole}>{message.role === "assistant" ? "AI" : "나"}</Text>
                    <Text style={styles.bubbleText}>{message.content}</Text>
                  </View>
                ))
              )}
            </View>

            {manualItems.length > 0 ? (
              <View style={styles.manualList}>
                <Text style={styles.manualTitle}>수동 추가 항목</Text>
                {manualItems.map((item) => (
                  <View key={item.id} style={styles.manualRow}>
                    <Text style={styles.manualText}>
                      {item.title} · {item.time}
                    </Text>
                    <Pressable
                      onPress={() => removeManualItem(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.title} 삭제`}
                      hitSlop={8}
                    >
                      <Text style={styles.manualRemove}>삭제</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => {
                  if (canSend && !loading) {
                    void handleSend(input);
                  }
                }}
                returnKeyType="send"
                placeholder={entryMode === "chat" ? "오늘 기록을 입력해주세요" : "오늘 로그를 입력해주세요"}
                editable={canSend && !loading}
                style={styles.input}
                placeholderTextColor={colors.mutedText}
              />
              <AppButton
                label="전송"
                onPress={() => void handleSend(input)}
                disabled={!canSend || loading || input.trim().length === 0}
              />
            </View>
            <Text style={styles.helperText}>핸즈프리 모드에서는 말하면 자동 전송되고 AI가 음성으로 응답합니다.</Text>
            <Text style={styles.helperText}>상태 {stateText}</Text>
          </View>
        </ScreenFadeIn>
      </ScrollView>

      <View style={styles.bottomActions}>
        <AppButton
          label="조기 종료 버튼"
          onPress={() => void finishSession()}
          variant="outline"
          disabled={!canSend || loading}
          style={styles.endButton}
        />
        <Pressable
          style={styles.plusFab}
          onPress={() => {
            setManualError(null);
            setManualModalOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="수동 일정 또는 메모 추가"
          hitSlop={10}
        >
          <Text style={styles.plusFabIcon}>＋</Text>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={manualModalOpen}
        onRequestClose={() => setManualModalOpen(false)}
      >
        <View style={styles.modalDim}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>수동 일정/메모 추가</Text>
            <Text style={styles.modalSub}>대화와 별개로 내일 일정에 바로 넣을 항목을 추가합니다.</Text>
            <TextInput
              value={manualTitle}
              onChangeText={setManualTitle}
              placeholder="예: 발표 자료 15분 정리"
              placeholderTextColor={colors.mutedText}
              style={styles.modalInput}
              accessibilityLabel="수동 항목 제목"
            />
            <TextInput
              value={manualTime}
              onChangeText={setManualTime}
              onBlur={() => setManualTime((prev) => normalizeTime(prev))}
              placeholder="09:00"
              keyboardType="numbers-and-punctuation"
              placeholderTextColor={colors.mutedText}
              style={styles.modalInput}
              accessibilityLabel="수동 항목 시간"
            />
            {manualError ? <Text style={styles.modalError}>{manualError}</Text> : null}
            <View style={styles.modalButtons}>
              <AppButton
                label="취소"
                variant="outline"
                onPress={() => {
                  setManualError(null);
                  setManualModalOpen(false);
                }}
                style={styles.modalButton}
              />
              <AppButton label="추가" onPress={addManualItem} style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 170,
    gap: spacing.md,
  },
  headerCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    ...shadows.soft,
  },
  title: {
    color: colors.text,
    fontSize: typography.section,
    fontFamily: typography.family.bold,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  headerActions: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  sectionCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.md,
    ...shadows.soft,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontFamily: typography.family.medium,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chipCell: {
    width: "48%",
  },
  entryRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  entryButton: {
    flex: 1,
  },
  promptRow: {
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  promptChip: {
    maxWidth: 280,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#EEF3F7",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  promptChipSelected: {
    borderColor: colors.primary,
    backgroundColor: "#E2F1F9",
  },
  promptChipText: {
    color: colors.text,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  promptChipTextSelected: {
    color: colors.primaryDeep,
  },
  voiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  voiceTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontFamily: typography.family.bold,
  },
  voiceStatus: {
    color: colors.primaryDeep,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
  },
  chatBox: {
    borderRadius: radius.md,
    backgroundColor: "#E8EDF1",
    padding: spacing.sm,
    minHeight: 220,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: "86%",
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 2,
  },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: "#F2D857",
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: "#DFE5EA",
  },
  bubbleRole: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  bubbleText: {
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  manualList: {
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  manualTitle: {
    color: colors.primaryDeep,
    fontSize: typography.caption,
    fontFamily: typography.family.bold,
  },
  manualRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  manualText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  manualRemove: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontFamily: typography.family.regular,
    fontSize: typography.body,
  },
  helperText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.regular,
  },
  bottomActions: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxl + 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  endButton: {
    flex: 1,
  },
  plusFab: {
    width: 86,
    height: 86,
    borderRadius: 999,
    backgroundColor: "#D2D9DE",
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  plusFabIcon: {
    color: colors.text,
    fontSize: 56,
    marginTop: -5,
    fontFamily: typography.family.medium,
  },
  modalDim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 30, 40, 0.36)",
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontFamily: typography.family.bold,
  },
  modalSub: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  modalInput: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.body,
    fontFamily: typography.family.regular,
  },
  modalError: {
    color: colors.danger,
    fontSize: typography.caption,
    fontFamily: typography.family.regular,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  modalButton: {
    flex: 1,
  },
});
