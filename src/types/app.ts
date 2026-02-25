import type {
  DiaryHistoryItem,
  EmotionMetric,
  EmotionTag,
  EndResponse,
} from "../lib/schema";

export type AppRoute =
  | "landing"
  | "login"
  | "signup"
  | "interests"
  | "home"
  | "settings"
  | "legal"
  | "journal"
  | "result"
  | "schedule"
  | "calendar";

export type LegalDocType = "terms" | "privacy";

export type Gender = "남" | "여" | "기타";

export type Interest = string;

export type UserAccount = {
  userId: string;
  passwordHash: string;
  passwordSalt: string;
  authVersion: 1;
  name: string;
  birthDate: string;
  gender: Gender;
  job: string;
  interests: Interest[];
  createdAt: string;
  updatedAt: string;
};

export type SignupForm = {
  userId: string;
  password: string;
  passwordConfirm: string;
  name: string;
  birthDate: string;
  gender: Gender;
  job: string;
};

export type ScheduleDraftItem = {
  id: string;
  title: string;
  time: string;
  selected: boolean;
  source: "event" | "task" | "manual";
};

export type HomeCalendarPreview = {
  weekEntryCount: number;
  consistencyScore: number;
  dominantEmotion: EmotionTag | null;
  nextScheduleTitle: string | null;
  nextScheduleTime: string | null;
};

export type ResultBundle = {
  endedAt: string;
  result: EndResponse;
  emotionTags: EmotionTag[];
  emotionMetrics: EmotionMetric[];
  emotionSummary: string;
  entryMode: "chat" | "log";
  checkInMood: EmotionTag | null;
  promptUsed: string | null;
  scheduleItems: ScheduleDraftItem[];
};

export type DiaryHistoryRecord = DiaryHistoryItem & {
  userId: string;
  resultSnapshot: ResultBundle;
};
