import type {
  ChatSession,
  ChatState,
  DiaryMode,
  EmotionTag,
  EndResponse,
  EventCard,
  PartialCards,
  StartResponse,
  TaskCard,
  TurnResponse,
} from "./schema";

const sessionStore = new Map<string, ChatSession>();
const stateOrder: ChatState[] = ["S0", "S1", "S2", "S3", "S4", "S5"];

const stateLabelByMode: Record<DiaryMode, Record<ChatState, string>> = {
  "Deep Reflection": {
    S0: "오늘 하루를 가장 대표하는 장면 하나부터 시작할까요?",
    S1: "그 장면에서 가장 크게 느낀 감정을 한 단어로 말해줘요.",
    S2: "그 감정이 커진 이유를 한 문장으로 덧붙여줘요.",
    S3: "내일 일정 또는 해야 할 일을 같이 정리해볼까요?",
    S4: "추출된 카드 확인했어요. 수정하고 싶은 항목이 있을까요?",
    S5: "좋아요. End를 누르면 AI 일기 요약과 추천을 보여줄게요.",
  },
  "Stress Reset": {
    S0: "오늘 스트레스가 크게 올라온 순간을 말해줄래요?",
    S1: "그때 몸 반응(긴장, 답답함, 피로)을 떠올려봐요.",
    S2: "지금 당장 가볍게 줄일 수 있는 부담 하나를 찾을까요?",
    S3: "내일 일정과 할 일에서 과부하 구간을 정리해볼게요.",
    S4: "카드 확인 후 수정하고 싶은 부분이 있나요?",
    S5: "정리 완료. End를 누르면 회복 중심 추천을 보여줘요.",
  },
  Gratitude: {
    S0: "오늘 고마웠던 순간 하나를 짧게 말해볼까요?",
    S1: "그 순간이 왜 특별했는지 한 줄만 덧붙여줘요.",
    S2: "그 감정을 내일에도 이어가기 위한 행동을 찾을까요?",
    S3: "내일 일정/할 일을 가볍게 배치해볼게요.",
    S4: "추출 카드 확인했어요. 수정할 항목이 있나요?",
    S5: "좋아요. End를 누르면 감사 중심 요약을 보여줄게요.",
  },
  "Sleep Prep": {
    S0: "잠들기 전, 오늘 머릿속을 복잡하게 한 주제를 말해줘요.",
    S1: "그 주제에 대해 내일 오전에 처리할 한 가지를 골라볼까요?",
    S2: "감정 강도를 1문장으로 정리해볼게요.",
    S3: "내일 일정/할 일에서 우선순위를 조정해봐요.",
    S4: "추출 카드 점검 후 수정할 부분이 있나요?",
    S5: "End를 누르면 수면 전 마무리 요약과 추천을 보여줄게요.",
  },
};

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function advanceState(current: ChatState): ChatState {
  const index = stateOrder.indexOf(current);
  if (index < 0 || index >= stateOrder.length - 1) {
    return "S5";
  }
  return stateOrder[index + 1];
}

function isAtLeastState(target: ChatState, pivot: ChatState): boolean {
  return stateOrder.indexOf(target) >= stateOrder.indexOf(pivot);
}

function parseTomorrowISO(hour: number, minute: number): string {
  const base = new Date();
  const next = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + 1,
    hour,
    minute,
    0,
    0,
  );
  return next.toISOString();
}

function parseHourMinute(text: string): { hour: number; minute: number } | null {
  const tomorrowHHmm = text.match(/내일\s*(\d{1,2}):(\d{2})/);
  if (tomorrowHHmm) {
    return {
      hour: Math.min(23, Number(tomorrowHHmm[1])),
      minute: Math.min(59, Number(tomorrowHHmm[2])),
    };
  }

  const amPm = text.match(/(오전|오후)\s*(\d{1,2})시(?:\s*(\d{1,2})분?)?/);
  if (amPm) {
    const period = amPm[1];
    const rawHour = Number(amPm[2]);
    const minute = amPm[3] ? Math.min(59, Number(amPm[3])) : 0;
    let hour = rawHour;
    if (period === "오후" && rawHour < 12) {
      hour += 12;
    }
    if (period === "오전" && rawHour === 12) {
      hour = 0;
    }
    return { hour: Math.min(23, hour), minute };
  }

  const plain = text.match(/(\d{1,2})시(?:에)?/);
  if (plain) {
    return { hour: Math.min(23, Number(plain[1])), minute: 0 };
  }

  return null;
}

function parseMinutes(text: string): number {
  const minutes = text.match(/(\d+)\s*분/);
  if (minutes) {
    return Math.max(5, Number(minutes[1]));
  }
  const hours = text.match(/(\d+)\s*시간/);
  if (hours) {
    return Math.max(10, Number(hours[1]) * 60);
  }
  return 40;
}

function inferEventTitle(text: string): string {
  if (/병원|진료|약속/.test(text)) {
    return "병원 약속";
  }
  if (/회의|미팅/.test(text)) {
    return "회의 일정";
  }
  if (/발표/.test(text)) {
    return "발표 일정";
  }
  if (/운동/.test(text)) {
    return "운동 일정";
  }
  return "내일 일정";
}

function inferTaskTitle(text: string): string {
  if (/발표/.test(text)) {
    return "발표자료 수정";
  }
  if (/공부/.test(text) && /영어/.test(text)) {
    return "영어 공부";
  }
  if (/마감/.test(text)) {
    return "마감 전 최종 점검";
  }
  if (/준비/.test(text)) {
    return "내일 준비";
  }
  if (/운동/.test(text)) {
    return "가벼운 운동";
  }
  if (/수정/.test(text)) {
    return "수정 작업";
  }
  return "내일 할 일";
}

function extractEvents(text: string): EventCard[] {
  if (!/내일|오전|오후|시/.test(text)) {
    return [];
  }

  const parsed = parseHourMinute(text);
  if (!parsed) {
    return [];
  }

  return [
    {
      id: makeId(),
      title: inferEventTitle(text),
      datetime: parseTomorrowISO(parsed.hour, parsed.minute),
      confidence: 0.9,
    },
  ];
}

function extractTasks(text: string): TaskCard[] {
  if (!/(해야|마감|수정|준비|발표|공부|정리|운동)/.test(text)) {
    return [];
  }

  return [
    {
      id: makeId(),
      title: inferTaskTitle(text),
      estMinutes: parseMinutes(text),
      priority: /마감|발표/.test(text) ? 1 : 2,
      confidence: 0.88,
    },
  ];
}

function extractEmotions(text: string): EmotionTag[] {
  const tags = new Set<EmotionTag>();
  if (/힘들|짜증|후회|불안|압박/.test(text)) {
    tags.add("stress");
  }
  if (/피곤|지침|지쳐|졸려/.test(text)) {
    tags.add("fatigue");
  }
  if (/좋았|뿌듯|행복|감사/.test(text)) {
    tags.add("joy");
  }
  if (/차분|괜찮|편안/.test(text)) {
    tags.add("calm");
  }
  return Array.from(tags);
}

function mergeCards(current: PartialCards, incoming: PartialCards): PartialCards {
  const events = [...current.events];
  for (const event of incoming.events) {
    const duplicate = events.some(
      (item) => item.title === event.title && item.datetime === event.datetime,
    );
    if (!duplicate) {
      events.push(event);
    }
  }

  const tasks = [...current.tasks];
  for (const task of incoming.tasks) {
    const duplicate = tasks.some(
      (item) => item.title === task.title && item.estMinutes === task.estMinutes,
    );
    if (!duplicate) {
      tasks.push(task);
    }
  }

  return { events, tasks };
}

function ensureFallback(cards: PartialCards): PartialCards {
  if (cards.events.length > 0 || cards.tasks.length > 0) {
    return cards;
  }
  return {
    events: [],
    tasks: [
      {
        id: makeId(),
        title: "내일 첫 할 일 1개 정하기",
        estMinutes: 20,
        priority: 2,
        confidence: 0.55,
      },
    ],
  };
}

function toHm(date: Date): string {
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

function addMinutes(date: Date, diff: number): Date {
  return new Date(date.getTime() + diff * 60000);
}

function buildTimeBlocks(cards: PartialCards): string[] {
  if (cards.events.length === 0) {
    return ["09:00-09:30"];
  }

  const target = new Date(cards.events[0].datetime);
  if (Number.isNaN(target.getTime())) {
    return ["09:00-09:30"];
  }

  const prepStart = addMinutes(target, -90);
  const prepEnd = addMinutes(target, -60);
  const moveStart = addMinutes(target, -30);
  const moveEnd = target;
  return [`${toHm(prepStart)}-${toHm(prepEnd)}`, `${toHm(moveStart)}-${toHm(moveEnd)}`];
}

function pickFirstAction(cards: PartialCards, emotions: EmotionTag[]): string {
  if (emotions.includes("stress") || emotions.includes("fatigue")) {
    return "10분 쪼개기";
  }

  if (cards.tasks.length > 0) {
    const shortest = [...cards.tasks].sort((a, b) => a.estMinutes - b.estMinutes)[0];
    return `${shortest.title} 시작 (${shortest.estMinutes}분)`;
  }

  return "내일 아침 10분 체크인";
}

function safeLine(text: string, fallback: string): string {
  if (!text) {
    return fallback;
  }
  const compact = normalizeText(text);
  return compact.length > 38 ? `${compact.slice(0, 38)}...` : compact;
}

function buildFinal3Lines(session: ChatSession): [string, string, string] {
  const userMessages = session.messages
    .filter((item) => item.role === "user")
    .map((item) => item.text);

  const line1 = `오늘 기록: ${safeLine(
    userMessages[0] ?? "",
    "짧게라도 하루를 돌아보며 시작했어요.",
  )}`;

  const line2 =
    session.emotionSnapshot.length > 0
      ? `감정 태그: ${session.emotionSnapshot.join(", ")}`
      : "감정 태그: calm";

  const line3 = `내일 첫 행동: ${pickFirstAction(
    session.partialCards,
    session.emotionSnapshot,
  )}`;

  return [line1, line2, line3];
}

function cloneCards(cards: PartialCards): PartialCards {
  return {
    events: cards.events.map((item) => ({ ...item })),
    tasks: cards.tasks.map((item) => ({ ...item })),
  };
}

export function startSession(mode: DiaryMode): StartResponse {
  const sessionId = makeId();
  const session: ChatSession = {
    sessionId,
    mode,
    state: "S0",
    turnCount: 0,
    messages: [],
    partialCards: { events: [], tasks: [] },
    emotionSnapshot: [],
  };

  sessionStore.set(sessionId, session);

  return {
    sessionId,
    mode,
    state: "S0",
    assistantQuestion: stateLabelByMode[mode].S0,
    partialCards: { events: [], tasks: [] },
    emotionSnapshot: [],
  };
}

export function turnSession(sessionId: string, userMessage: string): TurnResponse | null {
  const session = sessionStore.get(sessionId);
  if (!session) {
    return null;
  }

  const input = normalizeText(userMessage);
  if (!input) {
    return {
      sessionId: session.sessionId,
      mode: session.mode,
      state: session.state === "S0" ? "S1" : session.state,
      assistantQuestion: "입력이 비어 있어요. 짧게 한 문장만 적어주세요.",
      partialCards: cloneCards(session.partialCards),
      emotionSnapshot: [...session.emotionSnapshot],
    };
  }

  session.messages.push({
    role: "user",
    text: input,
    createdAt: new Date().toISOString(),
  });

  const incomingCards = {
    events: extractEvents(input),
    tasks: extractTasks(input),
  };
  session.partialCards = mergeCards(session.partialCards, incomingCards);

  const emotions = extractEmotions(input);
  session.emotionSnapshot = Array.from(
    new Set<EmotionTag>([...session.emotionSnapshot, ...emotions]),
  );

  session.turnCount += 1;
  if (session.turnCount >= 7) {
    session.state = "S5";
  } else {
    session.state = advanceState(session.state);
  }

  if (isAtLeastState(session.state, "S3")) {
    session.partialCards = ensureFallback(session.partialCards);
  }

  const assistantQuestion =
    session.turnCount >= 7
      ? "최대 7턴에 도달했어요. End를 눌러 오늘 요약을 확인해요."
      : stateLabelByMode[session.mode][session.state];

  session.messages.push({
    role: "assistant",
    text: assistantQuestion,
    createdAt: new Date().toISOString(),
  });

  return {
    sessionId: session.sessionId,
    mode: session.mode,
    state: session.state === "S0" ? "S1" : session.state,
    assistantQuestion,
    partialCards: cloneCards(session.partialCards),
    emotionSnapshot: [...session.emotionSnapshot],
  };
}

export function endSession(sessionId: string): EndResponse | null {
  const session = sessionStore.get(sessionId);
  if (!session) {
    return null;
  }

  session.state = "S5";
  const cards = cloneCards(session.partialCards);

  return {
    sessionId: session.sessionId,
    mode: session.mode,
    state: "S5",
    finalDiary3Lines: buildFinal3Lines(session),
    finalCards: cards,
    recommendations: {
      firstAction: pickFirstAction(cards, session.emotionSnapshot),
      timeBlocks: buildTimeBlocks(cards),
    },
  };
}
