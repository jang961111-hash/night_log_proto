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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenFadeIn } from "../components/ScreenFadeIn";
import {
  buildEmotionMetrics,
  buildEmotionSummary,
  buildScheduleItems,
  makeId,
  normalizeTime,
} from "../lib/insights";
import { apiChatEnd, apiChatStart, apiChatTurn } from "../lib/mockApi";
import type { ChatState, DiaryMode, EmotionTag, EndResponse } from "../lib/schema";
import { colors, radius, spacing, typography } from "../theme/tokens";
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

const moodOptions: Array<{ tag: EmotionTag; label: string; emoji: string }> = [
  { tag: "joy", label: "좋음", emoji: "😄" },
  { tag: "calm", label: "차분", emoji: "🙂" },
  { tag: "stress", label: "스트레스", emoji: "😣" },
  { tag: "fatigue", label: "피곤", emoji: "😪" },
];

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

function formatHeaderDate(date: Date): string {
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekday}요일`;
}

function formatClock(date: Date): string {
  const hour = date.getHours();
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  const period = hour >= 12 ? "오후" : "오전";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${hour12}:${minute}`;
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
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [moodModalOpen, setMoodModalOpen] = useState(false);
  const [moodIntensity, setMoodIntensity] = useState(70);
  const [recordingModalOpen, setRecordingModalOpen] = useState(false);

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
  const hasUserInput = useMemo(
    () => messages.some((message) => message.role === "user"),
    [messages],
  );
  const canFinish = canSend && !loading && hasUserInput;

  const diaryText = useMemo(() => {
    const userLines = messages
      .filter((message) => message.role === "user")
      .map((message) => message.content.trim())
      .filter((message) => message.length > 0);

    if (userLines.length > 0) {
      return userLines.join("\n\n");
    }
    const assistantPreview = messages.find((message) => message.role === "assistant")?.content;
    return assistantPreview ?? "오늘의 첫 생각을 녹음하거나 직접 작성해보세요.";
  }, [messages]);

  const selectedMood = useMemo(() => {
    if (!checkInMood) {
      return moodOptions[1];
    }
    return moodOptions.find((option) => option.tag === checkInMood) ?? moodOptions[1];
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
      setRecordingModalOpen(false);
      void stopVoice();
      onComplete(bundle);
    } catch (error) {
      const message = error instanceof Error ? error.message : "종료 실패";
      Alert.alert("종료 실패", message);
    } finally {
      setLoading(false);
    }
  };

  const shiftDate = (diff: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + diff);
      return next;
    });
  };

  const openRecording = async () => {
    if (!sessionIdRef.current) {
      await handleStart();
    }

    setRecordingModalOpen(true);
    if (voiceEnabledRef.current) {
      await startListening();
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
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenFadeIn>
          <View style={styles.dateHeader}>
            <Pressable style={styles.arrowButton} onPress={() => shiftDate(-1)} hitSlop={8}>
              <Text style={styles.arrowText}>‹</Text>
            </Pressable>
            <Text style={styles.dateTitle}>{formatHeaderDate(selectedDate)}</Text>
            <Pressable style={styles.arrowButton} onPress={() => shiftDate(1)} hitSlop={8}>
              <Text style={styles.arrowText}>›</Text>
            </Pressable>
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={70}>
          {messages.length === 0 ? (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>오늘의 첫 생각을 들려주세요</Text>
              <Pressable
                style={styles.emptyMic}
                onPress={() => {
                  void openRecording();
                }}
                accessibilityRole="button"
                accessibilityLabel="녹음 시작"
              >
                <Text style={styles.emptyMicIcon}>🎤</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEntryMode("log");
                  if (!sessionIdRef.current) {
                    void handleStart();
                  }
                }}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.directWriteText}>직접 작성</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.diaryCard}>
              <View style={styles.diaryMetaRow}>
                <Pressable onPress={() => setMoodModalOpen(true)} hitSlop={8}>
                  <Text style={styles.diaryEmoji}>{selectedMood.emoji}</Text>
                </Pressable>
                <Text style={styles.diaryTime}>{formatClock(selectedDate)}</Text>
                <Pressable
                  onPress={() => setManualModalOpen(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="추가 메뉴"
                >
                  <Text style={styles.moreIcon}>⋮</Text>
                </Pressable>
              </View>

              {manualItems.length > 0 ? (
                <View style={styles.mediaMock}>
                  <View style={styles.mediaLarge} />
                  <View style={styles.mediaCol}>
                    <View style={styles.mediaSmall} />
                    <View style={styles.mediaRow}>
                      <View style={styles.mediaSmall} />
                      <View style={styles.mediaSmall} />
                    </View>
                  </View>
                </View>
              ) : null}

              <Text style={styles.diaryBodyText}>{diaryText}</Text>

              {manualItems.length > 0 ? (
                <View style={styles.manualList}>
                  {manualItems.map((item) => (
                    <View key={item.id} style={styles.manualRow}>
                      <Text style={styles.manualText}>
                        {item.title} · {item.time}
                      </Text>
                      <Pressable onPress={() => removeManualItem(item.id)} hitSlop={8}>
                        <Text style={styles.manualRemove}>삭제</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </ScreenFadeIn>

        <ScreenFadeIn delay={120}>
          <View style={styles.recordCard}>
            <AppButton
              label={listening ? "녹음 중..." : "이어서 녹음하기"}
              onPress={() => {
                void openRecording();
              }}
              disabled={loading}
            />
            <Text style={styles.voiceStatus}>
              {modeLabel[mode]} · {voiceStatus} · {micBar(micLevel)}
            </Text>
          </View>
        </ScreenFadeIn>

        <ScreenFadeIn delay={150}>
          <View style={styles.inputCard}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => {
                if (canSend && !loading) {
                  void handleSend(input);
                }
              }}
              returnKeyType="send"
              placeholder={entryMode === "chat" ? "지금 떠오르는 생각을 입력하세요" : "로그를 직접 작성하세요"}
              editable={canSend && !loading}
              style={styles.input}
              placeholderTextColor={colors.mutedText}
              multiline
            />
            <View style={styles.inputButtons}>
              <AppButton
                label="전송"
                onPress={() => void handleSend(input)}
                disabled={!canSend || loading || input.trim().length === 0}
                style={styles.entryButton}
              />
              <AppButton
                label="결과 보기"
                onPress={() => void finishSession()}
                variant="outline"
                disabled={!canFinish}
                style={styles.entryButton}
              />
            </View>
            <View style={styles.quickLinks}>
              <Pressable onPress={onGoHome} hitSlop={8}>
                <Text style={styles.quickLinkText}>메인</Text>
              </Pressable>
              <Pressable onPress={onOpenCalendar} hitSlop={8}>
                <Text style={styles.quickLinkText}>인사이트</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const index = modes.indexOf(mode);
                  const next = modes[(index + 1) % modes.length];
                  setMode(next);
                }}
                hitSlop={8}
              >
                <Text style={styles.quickLinkText}>모드 변경</Text>
              </Pressable>
              <Pressable onPress={onLogout} hitSlop={8}>
                <Text style={styles.quickLinkText}>로그아웃</Text>
              </Pressable>
            </View>
          </View>
        </ScreenFadeIn>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={moodModalOpen}
        onRequestClose={() => setMoodModalOpen(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.moodModalCard}>
            <Text style={styles.modalTitle}>오늘의 기분</Text>
            <Text style={styles.modalEmoji}>{selectedMood.emoji}</Text>
            <Text style={styles.modalMoodText}>{selectedMood.label}</Text>
            <Pressable
              style={styles.moodTrack}
              onPress={(event) => {
                const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / 240));
                setMoodIntensity(Math.round(ratio * 100));
              }}
              accessibilityRole="adjustable"
              accessibilityLabel="기분 강도"
            >
              <View style={[styles.moodFill, { width: `${moodIntensity}%` }]} />
            </Pressable>
            <View style={styles.moodOptionsRow}>
              {moodOptions.map((mood) => {
                const selected = checkInMood === mood.tag;
                return (
                  <Pressable
                    key={mood.tag}
                    style={[styles.moodOption, selected && styles.moodOptionSelected]}
                    onPress={() => setCheckInMood(mood.tag)}
                  >
                    <Text style={styles.moodOptionEmoji}>{mood.emoji}</Text>
                  </Pressable>
                );
              })}
            </View>
            <AppButton label="저장" onPress={() => setMoodModalOpen(false)} />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={recordingModalOpen}
        onRequestClose={() => setRecordingModalOpen(false)}
      >
        <View style={styles.modalDim}>
          <View style={styles.recordModalCard}>
            <View style={styles.recordHandle} />
            <Text style={styles.recordTitle}>녹음 진행 중</Text>
            <View style={styles.recordMicWrap}>
              <View style={styles.recordMicOuter}>
                <View style={styles.recordMicInner}>
                  <Text style={styles.recordMicIcon}>🎙️</Text>
                </View>
              </View>
            </View>
            <Text style={styles.recordStatus}>
              {listening ? "듣는 중" : "대기"} · {micBar(micLevel)}
            </Text>
            <View style={styles.recordButtons}>
              <Pressable
                style={styles.recordCancel}
                onPress={() => {
                  stopListening(true);
                  setRecordingModalOpen(false);
                }}
              >
                <Text style={styles.recordCancelText}>취소</Text>
              </Pressable>
              <AppButton
                label="저장"
                onPress={() => {
                  if (input.trim().length > 0 && canSend && !loading) {
                    void handleSend(input);
                  }
                  stopListening(true);
                  setRecordingModalOpen(false);
                }}
                style={styles.recordSaveButton}
              />
            </View>
          </View>
        </View>
      </Modal>

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
    paddingBottom: 180,
    gap: spacing.md,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  arrowButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 32,
    fontFamily: typography.family.medium,
  },
  dateTitle: {
    color: colors.text,
    fontSize: 28,
    fontFamily: typography.family.bold,
    letterSpacing: -0.2,
  },
  emptyPanel: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 40,
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.surface,
  },
  emptyTitle: {
    color: colors.mutedText,
    fontSize: typography.section,
    lineHeight: 34,
    textAlign: "center",
    fontFamily: typography.family.medium,
    paddingHorizontal: spacing.md,
  },
  emptyMic: {
    width: 132,
    height: 132,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  emptyMicIcon: {
    fontSize: 48,
  },
  directWriteText: {
    color: colors.mutedText,
    fontSize: typography.section,
    fontFamily: typography.family.medium,
  },
  diaryCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  diaryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  diaryEmoji: {
    fontSize: 28,
  },
  diaryTime: {
    flex: 1,
    color: colors.mutedText,
    fontSize: typography.subtitle,
    fontFamily: typography.family.medium,
  },
  moreIcon: {
    color: colors.mutedText,
    fontSize: 22,
    fontFamily: typography.family.medium,
  },
  mediaMock: {
    borderRadius: radius.sm,
    overflow: "hidden",
    flexDirection: "row",
    gap: 2,
    minHeight: 140,
  },
  mediaLarge: {
    flex: 1.2,
    backgroundColor: "#DCE8E2",
  },
  mediaCol: {
    flex: 1,
    gap: 2,
  },
  mediaRow: {
    flex: 1,
    flexDirection: "row",
    gap: 2,
  },
  mediaSmall: {
    flex: 1,
    backgroundColor: "#DCE8E2",
  },
  diaryBodyText: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 30,
    fontFamily: typography.family.regular,
  },
  manualList: {
    borderRadius: radius.sm,
    backgroundColor: "#F3F4F2",
    padding: spacing.sm,
    gap: spacing.xs,
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
  recordCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
  },
  voiceStatus: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  inputCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  inputButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  entryButton: {
    flex: 1,
  },
  input: {
    minHeight: 110,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontFamily: typography.family.regular,
    fontSize: typography.body,
    textAlignVertical: "top",
  },
  quickLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  quickLinkText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontFamily: typography.family.medium,
  },
  modalOverlayCenter: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(18, 30, 40, 0.36)",
    paddingHorizontal: spacing.lg,
  },
  moodModalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.section,
    textAlign: "center",
    fontFamily: typography.family.bold,
  },
  modalEmoji: {
    textAlign: "center",
    fontSize: 64,
  },
  modalMoodText: {
    color: colors.text,
    textAlign: "center",
    fontSize: typography.subtitle,
    fontFamily: typography.family.medium,
  },
  moodTrack: {
    width: 240,
    height: 12,
    borderRadius: 999,
    alignSelf: "center",
    backgroundColor: "#E8EDF0",
    overflow: "hidden",
  },
  moodFill: {
    height: "100%",
    backgroundColor: "#8CB6D8",
    borderRadius: 999,
  },
  moodOptionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  moodOption: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F7F6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  moodOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#E2EEE8",
  },
  moodOptionEmoji: {
    fontSize: 20,
  },
  modalDim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 30, 40, 0.36)",
  },
  recordModalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    alignItems: "center",
  },
  recordHandle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E4E0DB",
  },
  recordTitle: {
    color: colors.text,
    fontSize: typography.section,
    fontFamily: typography.family.bold,
  },
  recordMicWrap: {
    marginTop: spacing.xs,
  },
  recordMicOuter: {
    width: 150,
    height: 150,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2EF",
  },
  recordMicInner: {
    width: 124,
    height: 124,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  recordMicIcon: {
    fontSize: 46,
  },
  recordStatus: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: typography.family.medium,
  },
  recordButtons: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  recordCancel: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  recordCancelText: {
    color: colors.text,
    fontSize: typography.section,
    fontFamily: typography.family.medium,
  },
  recordSaveButton: {
    flex: 1,
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
