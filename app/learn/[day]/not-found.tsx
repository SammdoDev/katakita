import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="eyebrow">Day tidak ditemukan</p>
      <h1 className="section-title mt-2">Pilih Day antara 1 dan 120.</h1>
      <Button className="mt-6" asChild><Link href="/roadmap">Buka roadmap</Link></Button>
    </div>
  );
}

