import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "katakita_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const FALLBACK_SALT = "00000000000000000000000000000000";
const FALLBACK_HASH = "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

export type CurrentUser = { id: string; email: string; name: string };

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined) {
  const [algorithm, salt, encoded] = stored?.split("$") ?? [];
  const validFormat = algorithm === "scrypt" && /^[a-f0-9]{32}$/.test(salt ?? "") && /^[a-f0-9]{128}$/.test(encoded ?? "");
  const derived = (await scrypt(password, validFormat ? salt : FALLBACK_SALT, 64)) as Buffer;
  const expected = Buffer.from(validFormat ? encoded : FALLBACK_HASH, "hex");
  return validFormat && timingSafeEqual(derived, expected);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  const db = getDb();
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await db.insert(sessions).values({ tokenHash: tokenHash(token), userId, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!process.env.DATABASE_URL) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !TOKEN_PATTERN.test(token)) return null;
  const [row] = await getDb()
    .select({ id: users.id, email: users.email, name: users.name })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && TOKEN_PATTERN.test(token) && process.env.DATABASE_URL) {
    await getDb().delete(sessions).where(eq(sessions.tokenHash, tokenHash(token)));
  }
  store.delete(SESSION_COOKIE);
}
