export type ChatState = "S0" | "S1" | "S2" | "S3" | "S4" | "S5";

export type EmotionTag = "stress" | "joy" | "fatigue" | "calm";

export type DiaryMode =
  | "Deep Reflection"
  | "Stress Reset"
  | "Gratitude"
  | "Sleep Prep";

export type EventCard = {
  id: string;
  title: string;
  datetime: string;
  confidence: number;
};

export type TaskCard = {
  id: string;
  title: string;
  estMinutes: number;
  priority: number;
  confidence: number;
};

export type PartialCards = {
  events: EventCard[];
  tasks: TaskCard[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

export type ChatSession = {
  sessionId: string;
  mode: DiaryMode;
  state: ChatState;
  turnCount: number;
  messages: ChatMessage[];
  partialCards: PartialCards;
  emotionSnapshot: EmotionTag[];
};

export type StartResponse = {
  sessionId: string;
  mode: DiaryMode;
  state: "S0";
  assistantQuestion: string;
  partialCards: PartialCards;
  emotionSnapshot: EmotionTag[];
};

export type TurnResponse = {
  sessionId: string;
  mode: DiaryMode;
  state: Exclude<ChatState, "S0">;
  assistantQuestion: string;
  partialCards: PartialCards;
  emotionSnapshot: EmotionTag[];
};

export type EndResponse = {
  sessionId: string;
  mode: DiaryMode;
  state: "S5";
  finalDiary3Lines: [string, string, string];
  finalCards: PartialCards;
  recommendations: {
    firstAction: string;
    timeBlocks: string[];
  };
};

export type DiaryHistoryItem = {
  id: string;
  createdAt: string;
  mode: DiaryMode;
  preview: string;
  emotionTags: EmotionTag[];
  firstAction: string;
};

export type EmotionMetric = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export type ScheduleRecommendationItem = {
  id: string;
  title: string;
  time: string;
  selected: boolean;
  confidence: number;
};
