import assert from "node:assert/strict";
import test from "node:test";

import {
  answerFromJournal,
  buildMonthMatrix,
  buildScheduleItems,
  buildWeeklyReport,
  computeStreak,
  normalizeTime,
  pickNextScheduleItem,
} from "./insights";
import type { EndResponse } from "./schema";
import type { DiaryHistoryRecord, ResultBundle } from "../types/app";

function makeEmptyBundle(sessionId: string): ResultBundle {
  const result: EndResponse = {
    sessionId,
    mode: "Deep Reflection",
    state: "S5",
    finalDiary3Lines: ["line1", "line2", "line3"],
    finalCards: { events: [], tasks: [] },
    recommendations: {
      firstAction: "drink water",
      timeBlocks: [],
    },
  };

  return {
    endedAt: new Date().toISOString(),
    result,
    emotionTags: [],
    emotionMetrics: [],
    emotionSummary: "",
    entryMode: "chat",
    checkInMood: null,
    promptUsed: null,
    scheduleItems: [],
  };
}

function makeHistoryRecord(id: string, createdAt: string, userId = "u1"): DiaryHistoryRecord {
  return {
    id,
    userId,
    createdAt,
    mode: "Deep Reflection",
    preview: "preview",
    emotionTags: [],
    firstAction: "first action",
    resultSnapshot: makeEmptyBundle(id),
  };
}

function addHour(hhmm: string, hours: number): string {
  const [hour, minute] = hhmm.split(":").map(Number);
  const date = new Date(2026, 0, 1, hour, minute, 0, 0);
  date.setHours(date.getHours() + hours);
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mm = `${date.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

test("normalizeTime formats and clamps invalid values", () => {
  assert.equal(normalizeTime("9:5"), "09:05");
  assert.equal(normalizeTime("26:72"), "23:59");
  assert.equal(normalizeTime("not-time"), "09:00");
});

test("buildMonthMatrix returns 6 weeks and 7 days per week", () => {
  const matrix = buildMonthMatrix(2026, 1);

  assert.equal(matrix.length, 6);
  assert.ok(matrix.every((week) => week.length === 7));
  assert.equal(matrix.flat().length, 42);
});

test("buildScheduleItems maps events and tasks into editable schedule draft", () => {
  const endResponse: EndResponse = {
    sessionId: "s-1",
    mode: "Deep Reflection",
    state: "S5",
    finalDiary3Lines: ["a", "b", "c"],
    finalCards: {
      events: [
        {
          id: "e-1",
          title: "hospital booking",
          datetime: "2026-02-25T09:30:00.000Z",
          confidence: 0.9,
        },
      ],
      tasks: [
        {
          id: "t-1",
          title: "prepare deck",
          estMinutes: 60,
          priority: 1,
          confidence: 0.8,
        },
        {
          id: "t-2",
          title: "inbox cleanup",
          estMinutes: 20,
          priority: 2,
          confidence: 0.7,
        },
      ],
    },
    recommendations: {
      firstAction: "open deck",
      timeBlocks: ["08:00-08:30"],
    },
  };

  const items = buildScheduleItems(endResponse);
  assert.equal(items.length, 3);
  assert.equal(items[0].title, "hospital booking");
  assert.equal(items[1].time, addHour(items[0].time, 1));
  assert.equal(items[2].time, addHour(items[1].time, 1));
});

test("pickNextScheduleItem returns earliest selected item", () => {
  const top = pickNextScheduleItem([
    {
      id: "a",
      title: "팀 미팅",
      time: "14:30",
      selected: true,
      source: "task",
    },
    {
      id: "b",
      title: "산책",
      time: "08:10",
      selected: true,
      source: "manual",
    },
    {
      id: "c",
      title: "건너뛴 일정",
      time: "07:00",
      selected: false,
      source: "event",
    },
  ]);

  assert.deepEqual(top, { title: "산책", time: "08:10" });
});

test("computeStreak counts only consecutive daily records for a user", () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const history: DiaryHistoryRecord[] = [
    makeHistoryRecord("d0", today.toISOString(), "u1"),
    makeHistoryRecord("d1", yesterday.toISOString(), "u1"),
    makeHistoryRecord("d3", threeDaysAgo.toISOString(), "u1"),
    makeHistoryRecord("other", today.toISOString(), "u2"),
  ];

  assert.equal(computeStreak(history, "u1"), 2);
  assert.equal(computeStreak(history, "u2"), 1);
});

test("buildWeeklyReport summarizes dominant emotion and consistency", () => {
  const now = new Date();
  const d1 = new Date(now);
  d1.setDate(now.getDate() - 1);
  const d2 = new Date(now);
  d2.setDate(now.getDate() - 2);

  const history: DiaryHistoryRecord[] = [
    {
      ...makeHistoryRecord("a", now.toISOString(), "u1"),
      emotionTags: ["joy"],
      firstAction: "walk",
    },
    {
      ...makeHistoryRecord("b", d1.toISOString(), "u1"),
      emotionTags: ["joy"],
      firstAction: "walk",
    },
    {
      ...makeHistoryRecord("c", d2.toISOString(), "u1"),
      emotionTags: ["stress"],
      firstAction: "plan",
    },
  ];

  const report = buildWeeklyReport(history, "u1");
  assert.equal(report.totalEntries, 3);
  assert.equal(report.dominantEmotion, "joy");
  assert.equal(report.topAction, "walk");
  assert.ok(report.consistencyScore > 0);
});

test("answerFromJournal returns matched answer from recent records", () => {
  const history: DiaryHistoryRecord[] = [
    {
      ...makeHistoryRecord("a", new Date().toISOString(), "u1"),
      preview: "발표 준비가 걱정됐다",
      firstAction: "발표 자료 15분 보기",
    },
  ];

  const answer = answerFromJournal(history, "u1", "발표 준비 관련 조언");
  assert.ok(answer.includes("발표"));
});
