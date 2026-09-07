"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <p className="eyebrow">Ada kendala</p>
      <h1 className="section-title mt-3">Halaman belum bisa dimuat.</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">Periksa koneksi database lalu coba kembali.</p>
      <Button className="mt-6" onClick={reset}>Coba lagi</Button>
    </div>
  );
}

