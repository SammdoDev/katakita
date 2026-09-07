import { redirect } from "next/navigation";
import { BookOpenCheck, Sparkles, TrendingUp } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const mode = (await searchParams).mode === "register" ? "register" : "login";
  return (
    <div className="mx-auto grid min-h-[calc(100vh-11rem)] max-w-5xl items-center gap-7 lg:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-[2rem] bg-[#0c2233] p-7 text-white sm:p-10">
        <span className="grid size-12 place-items-center rounded-2xl bg-teal-300 text-slate-950"><Sparkles className="size-5" /></span>
        <p className="mt-7 text-xs font-black uppercase tracking-[.2em] text-teal-300">Kurikulum bersama, progres pribadi</p>
        <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-.05em] sm:text-5xl">Belajar dari Day 1 sampai 120.</h1>
        <p className="mt-4 max-w-xl leading-7 text-slate-300">Materi sudah tersedia untuk semua akun. Checklist, catatan, waktu belajar, dan hasil tes tersimpan khusus untuk akunmu.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <p className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-3 text-sm font-semibold"><BookOpenCheck className="size-4 text-teal-300" /> 120 materi siap dipelajari</p>
          <p className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-3 text-sm font-semibold"><TrendingUp className="size-4 text-teal-300" /> Progres terpisah per akun</p>
        </div>
      </section>
      <Card className="p-6 sm:p-8">
        <p className="eyebrow">{mode === "register" ? "Mulai perjalananmu" : "Selamat datang kembali"}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{mode === "register" ? "Buat akun" : "Masuk ke KataKita"}</h2>
        <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">{mode === "register" ? "Setiap akun mendapat ruang progresnya sendiri." : "Lanjutkan belajar dari progres terakhir kamu."}</p>
        <AuthForm key={mode} mode={mode} />
      </Card>
    </div>
  );
}
