import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { apiChatEnd, apiChatStart, apiChatTurn } from "./src/lib/mockApi";
import type {
  ChatState,
  DiaryHistoryItem,
  DiaryMode,
  EmotionTag,
  EndResponse,
  PartialCards,
} from "./src/lib/schema";

type ChatMessageView = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const modes: DiaryMode[] = ["Deep Reflection", "Stress Reset", "Gratitude", "Sleep Prep"];

const scenarioA = [
  "오늘 회의에서 말 실수해서 후회돼",
  "내일 3시에 병원 약속 있어",
  "발표자료 수정해야 해 40분 정도",
];

const scenarioB = [
  "오늘 운동하고 뿌듯했어",
  "내일 특별한 약속은 없어",
  "영어 공부 20분 하고 싶어",
];

const emptyCards: PartialCards = {
  events: [],
  tasks: [],
};

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function dateKeyFromIso(isoText: string): string {
  return isoText.slice(0, 10);
}

function getRecentDateKeys(days: number): string[] {
  const base = new Date();
  const keys: string[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i, 0, 0, 0, 0);
    keys.push(date.toISOString().slice(0, 10));
  }
  return keys;
}

function computeStreak(history: DiaryHistoryItem[]): number {
  const keys = new Set(history.map((item) => dateKeyFromIso(item.createdAt)));
  const today = new Date();
  let streak = 0;
  for (;;) {
    const target = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - streak,
      0,
      0,
      0,
      0,
    );
    const key = target.toISOString().slice(0, 10);
    if (!keys.has(key)) {
      break;
    }
    streak += 1;
  }
  return streak;
}

export default function App() {
  const [mode, setMode] = useState<DiaryMode>("Deep Reflection");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<ChatState | null>(null);
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [input, setInput] = useState("");
  const [cards, setCards] = useState<PartialCards>(emptyCards);
  const [emotions, setEmotions] = useState<EmotionTag[]>([]);
  const [finalResult, setFinalResult] = useState<EndResponse | null>(null);
  const [history, setHistory] = useState<DiaryHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState("40");
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const recentDateKeys = useMemo(() => getRecentDateKeys(7), []);
  const streak = useMemo(() => computeStreak(history), [history]);

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return history.filter((item) => {
      if (selectedDateKey && dateKeyFromIso(item.createdAt) !== selectedDateKey) {
        return false;
      }
      if (!q) {
        return true;
      }
      const hay = `${item.preview} ${item.firstAction} ${item.emotionTags.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [history, searchQuery, selectedDateKey]);

  const historyCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of history) {
      const key = dateKeyFromIso(item.createdAt);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [history]);

  const monthSummary = useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
    const items = history.filter((item) => item.createdAt.startsWith(monthPrefix));

    const emotionCount = new Map<string, number>();
    for (const item of items) {
      for (const emotion of item.emotionTags) {
        emotionCount.set(emotion, (emotionCount.get(emotion) ?? 0) + 1);
      }
    }
    const topEmotion =
      Array.from(emotionCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
    return { count: items.length, topEmotion };
  }, [history]);

  const displayResult = useMemo<EndResponse | null>(() => {
    if (!finalResult) {
      return null;
    }
    return {
      ...finalResult,
      finalCards: cards,
    };
  }, [finalResult, cards]);

  const canSend = Boolean(sessionId);

  const appendMessage = (role: "assistant" | "user", content: string) => {
    setMessages((prev) => [...prev, { id: makeId(), role, content }]);
  };

  const saveHistory = (result: EndResponse, tags: EmotionTag[]) => {
    const item: DiaryHistoryItem = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      mode: result.mode,
      preview: result.finalDiary3Lines[0],
      emotionTags: tags,
      firstAction: result.recommendations.firstAction,
    };
    setHistory((prev) =>
      [item, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 120),
    );
  };

  const handleStart = async () => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const data = await apiChatStart(mode);
      setSessionId(data.sessionId);
      setState(data.state);
      setCards(data.partialCards);
      setEmotions(data.emotionSnapshot);
      setFinalResult(null);
      setMessages([{ id: makeId(), role: "assistant", content: data.assistantQuestion }]);
    } catch {
      Alert.alert("Start 실패", "세션 시작 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text: string) => {
    if (loading || !sessionId) {
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setLoading(true);
    appendMessage("user", trimmed);
    setInput("");

    try {
      const data = await apiChatTurn(sessionId, trimmed);
      setState(data.state);
      setCards(data.partialCards);
      setEmotions(data.emotionSnapshot);
      appendMessage("assistant", data.assistantQuestion);
    } catch {
      Alert.alert("Turn 실패", "입력 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (loading || !sessionId) {
      return;
    }
    setLoading(true);
    try {
      const data = await apiChatEnd(sessionId);
      setState(data.state);
      setFinalResult(data);
      saveHistory(data, emotions);
      appendMessage("assistant", "요약 생성 완료. Insight 카드를 확인해보세요.");
    } catch {
      Alert.alert("End 실패", "요약 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const runScenario = async (script: string[]) => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const start = await apiChatStart(mode);
      setSessionId(start.sessionId);
      setState(start.state);
      setCards(start.partialCards);
      setEmotions(start.emotionSnapshot);
      setFinalResult(null);
      setMessages([{ id: makeId(), role: "assistant", content: start.assistantQuestion }]);

      let latestEmotions: EmotionTag[] = [];
      for (const line of script) {
        setMessages((prev) => [...prev, { id: makeId(), role: "user", content: line }]);
        const turn = await apiChatTurn(start.sessionId, line);
        setState(turn.state);
        setCards(turn.partialCards);
        setEmotions(turn.emotionSnapshot);
        latestEmotions = turn.emotionSnapshot;
        setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content: turn.assistantQuestion }]);
      }

      const end = await apiChatEnd(start.sessionId);
      setState(end.state);
      setFinalResult(end);
      setEmotions(latestEmotions);
      saveHistory(end, latestEmotions);
      appendMessage("assistant", "Scenario 완료. 요약/추천을 확인하세요.");
    } catch {
      Alert.alert("Scenario 실패", "자동 시나리오 실행 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.bgShapeA} />
      <View style={styles.bgShapeB} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>NightLog AI Journal</Text>
          <Text style={styles.subtitle}>Voice-first AI diary flow inspired by mobile journaling UX</Text>
          <View style={styles.streakRow}>
            <Text style={styles.streakText}>Streak {streak} days</Text>
            <Text style={styles.streakText}>State {state ?? "-"}</Text>
            <Pressable style={styles.smallButton} onPress={() => setIsLocked((prev) => !prev)}>
              <Text style={styles.smallButtonText}>{isLocked ? "Unlock" : "Lock"}</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll}>
          {modes.map((item) => (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              style={[styles.modeChip, mode === item && styles.modeChipActive]}
            >
              <Text style={[styles.modeChipText, mode === item && styles.modeChipTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conversation</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionButton} onPress={handleStart} disabled={loading}>
              <Text style={styles.actionButtonText}>Start</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, !canSend && styles.actionButtonDisabled]}
              onPress={handleEnd}
              disabled={loading || !canSend}
            >
              <Text style={styles.actionButtonText}>End</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => runScenario(scenarioA)} disabled={loading}>
              <Text style={styles.actionButtonText}>Scenario A</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => runScenario(scenarioB)} disabled={loading}>
              <Text style={styles.actionButtonText}>Scenario B</Text>
            </Pressable>
          </View>

          <View style={styles.quickRow}>
            {[
              "오늘은 꽤 힘들었어",
              "내일 오후 2시에 약속 있어",
              "발표 준비 30분 해야 해",
            ].map((template) => (
              <Pressable
                key={template}
                style={styles.quickChip}
                onPress={() => setInput(template)}
                disabled={!canSend || loading}
              >
                <Text style={styles.quickChipText}>{template}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.chatBox}>
            {messages.length === 0 ? (
              <Text style={styles.emptyText}>Start를 눌러 AI 일기 대화를 시작하세요.</Text>
            ) : (
              messages.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.bubble,
                    item.role === "assistant" ? styles.bubbleAssistant : styles.bubbleUser,
                  ]}
                >
                  <Text style={styles.bubbleRole}>{item.role === "assistant" ? "AI" : "You"}</Text>
                  <Text style={styles.bubbleText}>{item.content}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              editable={canSend && !loading}
              placeholder="오늘의 기록을 입력하세요"
              style={styles.input}
            />
            <Pressable
              onPress={() => handleSend(input)}
              disabled={!canSend || loading || input.trim().length === 0}
              style={[styles.sendButton, (!canSend || input.trim().length === 0) && styles.actionButtonDisabled]}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
            <Pressable style={[styles.sendButton, styles.micButton]} disabled>
              <Text style={styles.sendButtonText}>Mic</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Insight Cards</Text>
          <View style={styles.tagsRow}>
            {emotions.length > 0 ? (
              emotions.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>감정 태그가 아직 없습니다.</Text>
            )}
          </View>

          <Text style={styles.sectionLabel}>Events</Text>
          {cards.events.length === 0 ? (
            <Text style={styles.emptyText}>추출된 일정이 없습니다.</Text>
          ) : (
            cards.events.map((event) => (
              <View style={styles.itemCard} key={event.id}>
                <Text style={styles.itemTitle}>{event.title}</Text>
                <Text style={styles.itemMeta}>{new Date(event.datetime).toLocaleString()}</Text>
                <Text style={styles.itemMeta}>confidence {event.confidence.toFixed(2)}</Text>
                {editingEventId === event.id ? (
                  <View style={styles.inlineEditRow}>
                    <TextInput value={eventDraft} onChangeText={setEventDraft} style={styles.inlineInput} />
                    <Pressable
                      style={styles.smallButton}
                      onPress={() => {
                        const nextTitle = eventDraft.trim();
                        if (!nextTitle) {
                          return;
                        }
                        setCards((prev) => ({
                          ...prev,
                          events: prev.events.map((item) =>
                            item.id === event.id ? { ...item, title: nextTitle } : item,
                          ),
                        }));
                        setEditingEventId(null);
                      }}
                    >
                      <Text style={styles.smallButtonText}>Save</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.smallButton}
                    onPress={() => {
                      setEditingEventId(event.id);
                      setEventDraft(event.title);
                    }}
                  >
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </Pressable>
                )}
              </View>
            ))
          )}

          <Text style={styles.sectionLabel}>Tasks</Text>
          {cards.tasks.length === 0 ? (
            <Text style={styles.emptyText}>추출된 할 일이 없습니다.</Text>
          ) : (
            cards.tasks.map((task) => (
              <View style={styles.itemCard} key={task.id}>
                <Text style={styles.itemTitle}>{task.title}</Text>
                <Text style={styles.itemMeta}>est {task.estMinutes} min</Text>
                <Text style={styles.itemMeta}>priority {task.priority}</Text>
                {editingTaskId === task.id ? (
                  <View style={styles.inlineEditRow}>
                    <TextInput
                      keyboardType="numeric"
                      value={taskDraft}
                      onChangeText={setTaskDraft}
                      style={styles.inlineInput}
                    />
                    <Pressable
                      style={styles.smallButton}
                      onPress={() => {
                        const parsed = Number.parseInt(taskDraft, 10);
                        const next = Number.isFinite(parsed) ? Math.max(5, parsed) : task.estMinutes;
                        setCards((prev) => ({
                          ...prev,
                          tasks: prev.tasks.map((item) =>
                            item.id === task.id ? { ...item, estMinutes: next } : item,
                          ),
                        }));
                        setEditingTaskId(null);
                      }}
                    >
                      <Text style={styles.smallButtonText}>Save</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.smallButton}
                    onPress={() => {
                      setEditingTaskId(task.id);
                      setTaskDraft(`${task.estMinutes}`);
                    }}
                  >
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI Summary</Text>
          {!displayResult ? (
            <Text style={styles.emptyText}>End를 누르면 3줄 요약과 내일 첫 행동 추천이 나옵니다.</Text>
          ) : (
            <>
              {displayResult.finalDiary3Lines.map((line, index) => (
                <Text key={`${line}-${index}`} style={styles.summaryLine}>
                  {index + 1}. {line}
                </Text>
              ))}
              <Text style={styles.sectionLabel}>Tomorrow First Action</Text>
              <Text style={styles.itemTitle}>{displayResult.recommendations.firstAction}</Text>
              <Text style={styles.sectionLabel}>Time Blocks</Text>
              {displayResult.recommendations.timeBlocks.slice(0, 2).map((block) => (
                <Text style={styles.itemMeta} key={block}>
                  - {block}
                </Text>
              ))}
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Archive</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="검색: 요약, 감정, 추천"
            style={styles.searchInput}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            <Pressable
              style={[styles.dateChip, selectedDateKey === null && styles.dateChipActive]}
              onPress={() => setSelectedDateKey(null)}
            >
              <Text style={styles.dateChipText}>전체</Text>
            </Pressable>
            {recentDateKeys.map((key) => (
              <Pressable
                key={key}
                style={[styles.dateChip, selectedDateKey === key && styles.dateChipActive]}
                onPress={() => setSelectedDateKey(key)}
              >
                <Text style={styles.dateChipText}>
                  {key.slice(5)} ({historyCounts.get(key) ?? 0})
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.monthSummary}>
            <Text style={styles.itemMeta}>이번 달 기록 {monthSummary.count}개</Text>
            <Text style={styles.itemMeta}>주요 감정 {monthSummary.topEmotion}</Text>
          </View>

          {filteredHistory.length === 0 ? (
            <Text style={styles.emptyText}>기록이 없습니다.</Text>
          ) : (
            filteredHistory.map((item) => (
              <View style={styles.itemCard} key={item.id}>
                <Text style={styles.itemTitle}>{item.preview}</Text>
                <Text style={styles.itemMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
                <Text style={styles.itemMeta}>mode {item.mode}</Text>
                <Text style={styles.itemMeta}>
                  emotions {item.emotionTags.length > 0 ? item.emotionTags.join(", ") : "none"}
                </Text>
                <Text style={styles.itemMeta}>first {item.firstAction}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {isLocked ? (
        <View style={styles.lockOverlay}>
          <View style={styles.lockCard}>
            <Text style={styles.lockTitle}>App Locked</Text>
            <Text style={styles.lockText}>개인 일기 보호를 위해 잠금 상태입니다.</Text>
            <Pressable style={styles.actionButton} onPress={() => setIsLocked(false)}>
              <Text style={styles.actionButtonText}>Unlock</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },
  bgShapeA: {
    position: "absolute",
    top: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "#d8efe9",
  },
  bgShapeB: {
    position: "absolute",
    top: 130,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "#ffe9cf",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
  headerCard: {
    borderWidth: 1,
    borderColor: "#d8dfe8",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a2e3f",
  },
  subtitle: {
    fontSize: 13,
    color: "#5a6b7d",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  streakText: {
    fontSize: 12,
    color: "#4e6174",
    backgroundColor: "#eef4fb",
    borderWidth: 1,
    borderColor: "#d6e2ef",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeScroll: {
    marginVertical: 2,
  },
  modeChip: {
    borderWidth: 1,
    borderColor: "#d1dce8",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  modeChipActive: {
    backgroundColor: "#1f6f6a",
    borderColor: "#1f6f6a",
  },
  modeChipText: {
    color: "#2a3d4f",
    fontWeight: "600",
    fontSize: 12,
  },
  modeChipTextActive: {
    color: "#ffffff",
  },
  card: {
    borderWidth: 1,
    borderColor: "#d8dfe8",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f3345",
  },
  sectionLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "700",
    color: "#33506b",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    backgroundColor: "#1f6f6a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickChip: {
    borderWidth: 1,
    borderColor: "#d8e5ef",
    backgroundColor: "#f5f9fd",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quickChipText: {
    fontSize: 11,
    color: "#3f5870",
  },
  chatBox: {
    borderWidth: 1,
    borderColor: "#dde5ee",
    borderRadius: 12,
    padding: 10,
    gap: 8,
    backgroundColor: "#fcfdff",
  },
  bubble: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 3,
  },
  bubbleAssistant: {
    alignSelf: "flex-start",
    borderColor: "#cadcf0",
    backgroundColor: "#edf5ff",
  },
  bubbleUser: {
    alignSelf: "flex-end",
    borderColor: "#c9e5d7",
    backgroundColor: "#eef8f1",
  },
  bubbleRole: {
    fontSize: 10,
    color: "#5f7387",
    fontWeight: "700",
  },
  bubbleText: {
    fontSize: 14,
    color: "#203547",
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cfd9e4",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
    backgroundColor: "#ffffff",
  },
  sendButton: {
    backgroundColor: "#1f6f6a",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  micButton: {
    backgroundColor: "#8aa59f",
  },
  tagsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  tag: {
    borderWidth: 1,
    borderColor: "#b7d8cc",
    backgroundColor: "#e9f7f1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: "#1c6554",
    fontWeight: "700",
    fontSize: 11,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: "#dee6ef",
    borderRadius: 12,
    padding: 10,
    gap: 4,
    backgroundColor: "#ffffff",
  },
  itemTitle: {
    fontWeight: "700",
    color: "#234059",
  },
  itemMeta: {
    color: "#5d7083",
    fontSize: 12,
  },
  inlineEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  inlineInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cad5e2",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
  },
  smallButton: {
    borderWidth: 1,
    borderColor: "#b6c8d9",
    backgroundColor: "#f4f8fc",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  smallButtonText: {
    fontSize: 11,
    color: "#39546e",
    fontWeight: "700",
  },
  summaryLine: {
    color: "#2a4158",
    fontSize: 14,
    lineHeight: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1dce7",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
  },
  dateScroll: {
    marginTop: 2,
  },
  dateChip: {
    borderWidth: 1,
    borderColor: "#cfdae6",
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  dateChipActive: {
    backgroundColor: "#2d7c77",
    borderColor: "#2d7c77",
  },
  dateChipText: {
    color: "#2c4258",
    fontSize: 12,
    fontWeight: "600",
  },
  monthSummary: {
    borderWidth: 1,
    borderColor: "#d7e2eb",
    borderRadius: 12,
    backgroundColor: "#f8fbfd",
    padding: 10,
    gap: 3,
  },
  emptyText: {
    color: "#6b7c8d",
    fontSize: 13,
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(18,34,46,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  lockCard: {
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "#cad7e3",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
    gap: 10,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#24384d",
    textAlign: "center",
  },
  lockText: {
    textAlign: "center",
    color: "#607387",
    fontSize: 13,
  },
});
