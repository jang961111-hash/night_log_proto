import { endSession, startSession, turnSession } from "./mockEngine";
import type { DiaryMode, EndResponse, StartResponse, TurnResponse } from "./schema";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function apiChatStart(mode: DiaryMode): Promise<StartResponse> {
  await delay(220);
  return startSession(mode);
}

export async function apiChatTurn(
  sessionId: string,
  userMessage: string,
): Promise<TurnResponse> {
  await delay(260);
  const response = turnSession(sessionId, userMessage);
  if (!response) {
    throw new Error("Session not found.");
  }
  return response;
}

export async function apiChatEnd(sessionId: string): Promise<EndResponse> {
  await delay(180);
  const response = endSession(sessionId);
  if (!response) {
    throw new Error("Session not found.");
  }
  return response;
}
