import AsyncStorage from "@react-native-async-storage/async-storage";

import { createPasswordRecord } from "./auth";
import type {
  DiaryHistoryRecord,
  ScheduleDraftItem,
  UserAccount,
} from "../types/app";

const STORAGE_KEYS = {
  accounts: "nightlog:accounts:v1",
  currentUser: "nightlog:current-user:v1",
  history: "nightlog:history:v1",
  scheduleDraftByUser: "nightlog:schedule-draft:v1",
} as const;

type ScheduleDraftByUser = Record<string, ScheduleDraftItem[]>;
type LegacyUserAccount = Omit<UserAccount, "passwordHash" | "passwordSalt" | "authVersion"> & {
  password?: string;
  authVersion?: number;
  passwordHash?: string;
  passwordSalt?: string;
};

const memoryFallback: {
  accounts: UserAccount[];
  currentUser: string | null;
  history: DiaryHistoryRecord[];
  scheduleDraftByUser: ScheduleDraftByUser;
} = {
  accounts: [],
  currentUser: null,
  history: [],
  scheduleDraftByUser: {},
};

function parseOrFallback<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function readStorage<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return parseOrFallback(raw, fallback);
  } catch {
    return fallback;
  }
}

async function writeStorage<T>(key: string, value: T): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

async function normalizeAccounts(rawAccounts: LegacyUserAccount[]): Promise<{
  accounts: UserAccount[];
  migrated: boolean;
}> {
  const normalized: UserAccount[] = [];
  let migrated = false;

  for (const account of rawAccounts) {
    if (
      account.authVersion === 1 &&
      typeof account.passwordHash === "string" &&
      typeof account.passwordSalt === "string"
    ) {
      normalized.push({
        ...account,
        authVersion: 1,
        passwordHash: account.passwordHash,
        passwordSalt: account.passwordSalt,
      });
      continue;
    }

    const passwordRecord = await createPasswordRecord(account.password ?? "");

    normalized.push({
      userId: account.userId,
      name: account.name,
      birthDate: account.birthDate,
      gender: account.gender,
      job: account.job,
      interests: account.interests ?? [],
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      ...passwordRecord,
    });
    migrated = true;
  }

  return { accounts: normalized, migrated };
}

export async function loadAccounts(): Promise<UserAccount[]> {
  const rawAccounts = await readStorage<LegacyUserAccount[]>(
    STORAGE_KEYS.accounts,
    memoryFallback.accounts,
  );

  const { accounts, migrated } = await normalizeAccounts(rawAccounts);
  memoryFallback.accounts = accounts;

  if (migrated) {
    const ok = await writeStorage(STORAGE_KEYS.accounts, accounts);
    if (!ok) {
      console.warn("[nightlog] 계정 마이그레이션 저장 실패, 메모리 폴백 사용");
    }
  }

  return accounts;
}

export async function saveAccounts(accounts: UserAccount[]): Promise<void> {
  memoryFallback.accounts = accounts;
  const ok = await writeStorage(STORAGE_KEYS.accounts, accounts);
  if (!ok) {
    console.warn("[nightlog] 로컬 계정 저장 실패, 메모리 폴백 사용");
  }
}

export async function loadCurrentUser(): Promise<string | null> {
  const currentUser = await readStorage<string | null>(
    STORAGE_KEYS.currentUser,
    memoryFallback.currentUser,
  );
  memoryFallback.currentUser = currentUser;
  return currentUser;
}

export async function saveCurrentUser(userId: string | null): Promise<void> {
  memoryFallback.currentUser = userId;
  const ok = await writeStorage(STORAGE_KEYS.currentUser, userId);
  if (!ok) {
    console.warn("[nightlog] 현재 사용자 저장 실패, 메모리 폴백 사용");
  }
}

export async function loadDiaryHistory(): Promise<DiaryHistoryRecord[]> {
  const history = await readStorage<DiaryHistoryRecord[]>(STORAGE_KEYS.history, memoryFallback.history);
  memoryFallback.history = history;
  return history;
}

export async function saveDiaryHistory(items: DiaryHistoryRecord[]): Promise<void> {
  memoryFallback.history = items;
  const ok = await writeStorage(STORAGE_KEYS.history, items);
  if (!ok) {
    console.warn("[nightlog] 기록 저장 실패, 메모리 폴백 사용");
  }
}

export async function upsertHistoryItem(item: DiaryHistoryRecord): Promise<DiaryHistoryRecord[]> {
  const history = await loadDiaryHistory();
  const next = [item, ...history.filter((candidate) => candidate.id !== item.id)]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 300);

  await saveDiaryHistory(next);
  return next;
}

export async function loadScheduleDraft(userId: string): Promise<ScheduleDraftItem[]> {
  const drafts = await readStorage<ScheduleDraftByUser>(
    STORAGE_KEYS.scheduleDraftByUser,
    memoryFallback.scheduleDraftByUser,
  );
  memoryFallback.scheduleDraftByUser = drafts;
  return drafts[userId] ?? [];
}

export async function saveScheduleDraft(
  userId: string,
  items: ScheduleDraftItem[],
): Promise<void> {
  const drafts = await readStorage<ScheduleDraftByUser>(
    STORAGE_KEYS.scheduleDraftByUser,
    memoryFallback.scheduleDraftByUser,
  );

  const nextDrafts = {
    ...drafts,
    [userId]: items,
  };

  memoryFallback.scheduleDraftByUser = nextDrafts;
  const ok = await writeStorage(STORAGE_KEYS.scheduleDraftByUser, nextDrafts);
  if (!ok) {
    console.warn("[nightlog] 일정 초안 저장 실패, 메모리 폴백 사용");
  }
}
