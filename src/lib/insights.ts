import type { EmotionTag, EndResponse, EmotionMetric } from "./schema";
import type { DiaryHistoryRecord, ScheduleDraftItem } from "../types/app";

export type WeeklyPoint = {
  label: string;
  value: number;
};

export type WeeklyReport = {
  totalEntries: number;
  dominantEmotion: EmotionTag | null;
  topAction: string;
  consistencyScore: number;
};

export type CalendarCell = {
  dateKey: string;
  day: number;
  inMonth: boolean;
};

export type NextScheduleItem = {
  title: string;
  time: string;
};

const metricBlueprint: Array<{ id: string; label: string; base: number; color: string }> = [
  { id: "calm", label: "평온", base: 48, color: "#39A6D1" },
  { id: "focus", label: "집중", base: 44, color: "#2482A6" },
  { id: "energy", label: "활력", base: 46, color: "#38B6A8" },
  { id: "achievement", label: "성취", base: 42, color: "#E4B72F" },
  { id: "connection", label: "관계", base: 40, color: "#56A3FF" },
  { id: "recovery", label: "회복", base: 43, color: "#56C8A8" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDateKeyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTimeHHmm(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) {
    return "09:00";
  }

  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

export function normalizeTime(text: string): string {
  const match = text.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) {
    return "09:00";
  }
  const hour = clamp(Number(match[1]), 0, 23);
  const minute = clamp(Number(match[2]), 0, 59);
  return `${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`;
}

export function pickNextScheduleItem(items: ScheduleDraftItem[]): NextScheduleItem | null {
  const candidates = items
    .filter((item) => item.selected && item.title.trim().length > 0)
    .map((item) => {
      const normalizedTime = normalizeTime(item.time);
      const [hour, minute] = normalizedTime.split(":").map(Number);
      return {
        title: item.title.trim(),
        time: normalizedTime,
        minutes: hour * 60 + minute,
      };
    })
    .sort((a, b) => a.minutes - b.minutes);

  const top = candidates[0];
  if (!top) {
    return null;
  }

  return {
    title: top.title,
    time: top.time,
  };
}

function addMinutesToHHmm(time: string, diff: number): string {
  const normalized = normalizeTime(time);
  const [hh, mm] = normalized.split(":").map(Number);
  const date = new Date(2026, 0, 1, hh, mm, 0, 0);
  date.setMinutes(date.getMinutes() + diff);
  return formatTimeHHmm(date);
}

export function buildEmotionMetrics(emotions: EmotionTag[]): EmotionMetric[] {
  const tags = new Set(emotions);

  return metricBlueprint.map((metric) => {
    let value = metric.base;

    if (metric.id === "calm") {
      if (tags.has("calm")) {
        value += 24;
      }
      if (tags.has("stress")) {
        value -= 16;
      }
    }

    if (metric.id === "focus") {
      if (tags.has("joy")) {
        value += 10;
      }
      if (tags.has("fatigue")) {
        value -= 12;
      }
    }

    if (metric.id === "energy") {
      if (tags.has("joy")) {
        value += 18;
      }
      if (tags.has("fatigue")) {
        value -= 20;
      }
    }

    if (metric.id === "achievement") {
      if (tags.has("joy")) {
        value += 12;
      }
      if (tags.has("stress")) {
        value += 6;
      }
    }

    if (metric.id === "connection") {
      if (tags.has("joy")) {
        value += 8;
      }
      if (tags.has("stress")) {
        value -= 8;
      }
    }

    if (metric.id === "recovery") {
      if (tags.has("calm")) {
        value += 14;
      }
      if (tags.has("fatigue")) {
        value -= 6;
      }
    }

    return {
      id: metric.id,
      label: metric.label,
      value: clamp(value, 10, 100),
      color: metric.color,
    };
  });
}

export function buildEmotionSummary(metrics: EmotionMetric[], emotions: EmotionTag[]): string {
  if (metrics.length === 0) {
    return "오늘 기록이 아직 적어 감정 요약을 만들지 못했어요.";
  }

  const top = [...metrics].sort((a, b) => b.value - a.value)[0];
  const bottom = [...metrics].sort((a, b) => a.value - b.value)[0];

  if (emotions.includes("stress") || emotions.includes("fatigue")) {
    return `${top.label}는 유지되고 있지만 ${bottom.label} 회복이 필요해요. 내일 첫 블록은 가볍게 시작해요.`;
  }

  return `${top.label}이 강점으로 보이고, ${bottom.label}을 보완하면 하루 밸런스가 더 좋아져요.`;
}

export function buildScheduleItems(result: EndResponse): ScheduleDraftItem[] {
  const items: ScheduleDraftItem[] = [];
  const cards = result.finalCards;

  for (const event of cards.events) {
    items.push({
      id: event.id,
      title: event.title,
      time: formatTimeHHmm(event.datetime),
      selected: true,
      source: "event",
    });
  }

  let taskTime = items[0]?.time ?? "09:00";
  for (const task of cards.tasks) {
    taskTime = addMinutesToHHmm(taskTime, 60);
    items.push({
      id: task.id,
      title: task.title,
      time: taskTime,
      selected: true,
      source: "task",
    });
  }

  if (items.length === 0) {
    items.push({
      id: makeId(),
      title: result.recommendations.firstAction,
      time: "09:00",
      selected: true,
      source: "manual",
    });
  }

  return items.slice(0, 6);
}

export function computeStreak(history: DiaryHistoryRecord[], userId: string): number {
  const keys = new Set(
    history
      .filter((item) => item.userId === userId)
      .map((item) => formatDateKeyLocal(new Date(item.createdAt))),
  );

  let streak = 0;
  while (true) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - streak);
    const key = formatDateKeyLocal(date);
    if (!keys.has(key)) {
      break;
    }
    streak += 1;
  }

  return streak;
}

export function buildMonthMatrix(year: number, monthIndex: number): CalendarCell[][] {
  const first = new Date(year, monthIndex, 1);
  const firstWeekday = first.getDay();
  const start = new Date(year, monthIndex, 1 - firstWeekday);

  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < 6; w += 1) {
    const week: CalendarCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const cursor = new Date(start);
      cursor.setDate(start.getDate() + w * 7 + d);
      week.push({
        dateKey: formatDateKeyLocal(cursor),
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === monthIndex,
      });
    }
    weeks.push(week);
  }

  return weeks;
}

function metricAverage(metrics: EmotionMetric[]): number {
  if (metrics.length === 0) {
    return 0;
  }
  const total = metrics.reduce((sum, metric) => sum + metric.value, 0);
  return total / metrics.length;
}

export function buildWeeklySeries(history: DiaryHistoryRecord[], userId: string): WeeklyPoint[] {
  const result: WeeklyPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const key = formatDateKeyLocal(day);

    const records = history.filter(
      (item) => item.userId === userId && formatDateKeyLocal(new Date(item.createdAt)) === key,
    );

    const value =
      records.length === 0
        ? 0
        : Math.round(
            records.reduce(
              (sum, record) => sum + metricAverage(record.resultSnapshot.emotionMetrics),
              0,
            ) / records.length,
          );

    result.push({
      label: key.slice(5),
      value,
    });
  }
  return result;
}

export function buildWeeklyHighlights(history: DiaryHistoryRecord[], userId: string): string[] {
  const weekly = history
    .filter((item) => item.userId === userId)
    .filter((item) => {
      const created = new Date(item.createdAt).getTime();
      const now = Date.now();
      const diff = now - created;
      return diff <= 7 * 24 * 60 * 60 * 1000;
    })
    .slice(0, 3);

  if (weekly.length === 0) {
    return ["이번 주 기록이 아직 없어요. 오늘 밤 한 줄부터 시작해보세요."];
  }

  return weekly.map((item, index) => `${index + 1}. ${item.preview}`);
}

export function calendarEmotionMap(
  history: DiaryHistoryRecord[],
  userId: string,
): Record<string, EmotionTag | null> {
  const map: Record<string, EmotionTag | null> = {};

  const byDate = new Map<string, EmotionTag[]>();
  for (const item of history.filter((record) => record.userId === userId)) {
    const key = formatDateKeyLocal(new Date(item.createdAt));
    const current = byDate.get(key) ?? [];
    byDate.set(key, [...current, ...item.emotionTags]);
  }

  for (const [key, tags] of byDate.entries()) {
    if (tags.length === 0) {
      map[key] = null;
      continue;
    }
    const counts = new Map<EmotionTag, number>();
    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    map[key] = top;
  }

  return map;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);
}

export function buildWeeklyReport(history: DiaryHistoryRecord[], userId: string): WeeklyReport {
  const now = Date.now();
  const weekly = history.filter(
    (item) =>
      item.userId === userId &&
      now - new Date(item.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000,
  );

  if (weekly.length === 0) {
    return {
      totalEntries: 0,
      dominantEmotion: null,
      topAction: "첫 기록을 작성해보세요.",
      consistencyScore: 0,
    };
  }

  const emotionCounter = new Map<EmotionTag, number>();
  const actionCounter = new Map<string, number>();
  const dateCounter = new Set<string>();

  for (const record of weekly) {
    const emotions =
      record.emotionTags.length > 0
        ? record.emotionTags
        : record.resultSnapshot.checkInMood
          ? [record.resultSnapshot.checkInMood]
          : [];

    for (const emotion of emotions) {
      emotionCounter.set(emotion, (emotionCounter.get(emotion) ?? 0) + 1);
    }

    actionCounter.set(record.firstAction, (actionCounter.get(record.firstAction) ?? 0) + 1);
    dateCounter.add(formatDateKeyLocal(new Date(record.createdAt)));
  }

  const dominantEmotion =
    [...emotionCounter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topAction =
    [...actionCounter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    weekly[0].firstAction;
  const consistencyScore = clamp(Math.round((dateCounter.size / 7) * 100), 0, 100);

  return {
    totalEntries: weekly.length,
    dominantEmotion,
    topAction,
    consistencyScore,
  };
}

export function answerFromJournal(
  history: DiaryHistoryRecord[],
  userId: string,
  question: string,
): string {
  const queryWords = tokenize(question);
  if (queryWords.length === 0) {
    return "질문을 조금 더 구체적으로 적어주세요.";
  }

  const candidates = history
    .filter((item) => item.userId === userId)
    .slice(0, 20)
    .map((item) => {
      const corpus = `${item.preview} ${item.firstAction} ${item.resultSnapshot.result.finalDiary3Lines.join(" ")}`;
      const tokens = tokenize(corpus);
      const score = queryWords.reduce(
        (sum, word) => (tokens.includes(word) ? sum + 1 : sum),
        0,
      );
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  const top = candidates[0];
  if (!top || top.score === 0) {
    return "최근 기록에서 직접 연관된 내용을 찾지 못했어요. 핵심 키워드를 포함해 다시 질문해보세요.";
  }

  const ref = top.item.resultSnapshot.result.finalDiary3Lines[0];
  return `최근 기록 기준으로 보면 "${ref}"가 가장 관련 있어요. 내일 첫 행동은 "${top.item.firstAction}"를 추천해요.`;
}
