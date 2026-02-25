import * as Crypto from "expo-crypto";

import type { UserAccount } from "../types/app";

type PasswordRecord = Pick<UserAccount, "passwordHash" | "passwordSalt" | "authVersion">;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function makeSalt(): string {
  return toHex(Crypto.getRandomBytes(16));
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
}

export async function createPasswordRecord(password: string): Promise<PasswordRecord> {
  const passwordSalt = makeSalt();
  const passwordHash = await hashPassword(password, passwordSalt);

  return {
    passwordHash,
    passwordSalt,
    authVersion: 1,
  };
}

export async function verifyPassword(account: UserAccount, password: string): Promise<boolean> {
  const digest = await hashPassword(password, account.passwordSalt);
  return digest === account.passwordHash;
}
