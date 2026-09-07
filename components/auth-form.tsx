"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { loginAction, registerAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, undefined);
  const registering = mode === "register";

  return (
    <form action={formAction} className="space-y-4">
      {registering && (
        <label className="block">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Nama</span>
          <span className="relative mt-2 block">
            <UserRound className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-400" />
            <input name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="Nama kamu" className="h-11 w-full rounded-xl border border-slate-200 bg-transparent pl-10 pr-3 text-sm outline-none focus:border-teal-400 dark:border-white/10" />
          </span>
        </label>
      )}
      <label className="block">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Email</span>
        <span className="relative mt-2 block">
          <Mail className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-400" />
          <input name="email" type="email" autoComplete="email" required placeholder="nama@email.com" className="h-11 w-full rounded-xl border border-slate-200 bg-transparent pl-10 pr-3 text-sm outline-none focus:border-teal-400 dark:border-white/10" />
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Kata sandi</span>
        <span className="relative mt-2 block">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-400" />
          <input name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} required minLength={8} maxLength={128} placeholder="Minimal 8 karakter" className="h-11 w-full rounded-xl border border-slate-200 bg-transparent pl-10 pr-3 text-sm outline-none focus:border-teal-400 dark:border-white/10" />
        </span>
      </label>
      {state?.error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        {pending ? "Memproses…" : registering ? "Buat akun" : "Masuk"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        {registering ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
        <Link href={registering ? "/login" : "/login?mode=register"} className="font-bold text-teal-700 dark:text-teal-300">
          {registering ? "Masuk" : "Daftar gratis"}
        </Link>
      </p>
    </form>
  );
}
