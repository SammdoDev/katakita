"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export type AuthState = { error?: string } | undefined;

const email = z.email("Masukkan alamat email yang valid.").trim().transform((value) => value.toLowerCase());
const password = z.string().min(8, "Kata sandi minimal 8 karakter.").max(128, "Kata sandi maksimal 128 karakter.");
const loginSchema = z.object({ email, password });
const registerSchema = loginSchema.extend({ name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80, "Nama maksimal 80 karakter.") });

export async function loginAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data login belum valid." };
  try {
    const [user] = await getDb().select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
    if (!await verifyPassword(parsed.data.password, user?.passwordHash)) {
      return { error: "Email atau kata sandi salah." };
    }
    await createSession(user.id);
  } catch {
    return { error: "Login belum dapat diproses. Periksa koneksi database." };
  }
  redirect("/");
}

export async function registerAction(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data akun belum valid." };
  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const [user] = await getDb().insert(users).values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    }).onConflictDoNothing({ target: users.email }).returning({ id: users.id });
    if (!user) return { error: "Email tersebut sudah terdaftar." };
    await createSession(user.id);
  } catch {
    return { error: "Akun belum dapat dibuat. Periksa koneksi database." };
  }
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
