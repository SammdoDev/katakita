# KataKita

KataKita adalah learning tracker multi-user untuk mengikuti kurikulum bahasa Inggris Day 1–120. Seluruh akun memakai materi bersama dari `Rencana_Belajar_Inggris_120_Hari.xlsx`, sedangkan progres, catatan, dan hasil tes tersimpan terpisah untuk setiap akun.

## Stack

- Next.js 16 (App Router) dan TypeScript
- Tailwind CSS 4, komponen bergaya shadcn/ui, Lucide React
- Neon PostgreSQL, Drizzle ORM, drizzle-kit
- Zod, SheetJS/xlsx, React Hook Form

## 1. Siapkan Neon PostgreSQL

1. Buat project baru di [Neon Console](https://console.neon.tech/).
2. Salin connection string PostgreSQL dari dashboard Neon. Gunakan URL pooled yang menyertakan `sslmode=require`.
3. Salin file environment:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Isi `.env.local`:

   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
   ```

Pengguna membuat akun melalui `/login?mode=register`. Kata sandi di-hash dengan scrypt dan sesi login disimpan di PostgreSQL; browser hanya menerima token acak dalam cookie HTTP-only.

## 2. Install dan jalankan migration

```powershell
npm install
npm run db:migrate
```

Migration SQL tersimpan di folder `drizzle/`. Saat schema diubah, buat migration baru dengan:

```powershell
npm run db:generate
npm run db:migrate
```

Untuk development cepat, `npm run db:push` juga tersedia, tetapi migration direkomendasikan agar perubahan schema tercatat.

## 3. Pasang materi bersama

Pastikan file berikut tetap berada di root project:

```text
Rencana_Belajar_Inggris_120_Hari.xlsx
```

Lalu jalankan:

```powershell
npm run db:seed
```

Perintah ini hanya dijalankan sekali oleh pengelola aplikasi. Pengguna tidak mengunggah workbook masing-masing. Seed membaca dan memvalidasi workbook bawaan, lalu melakukan upsert berdasarkan `day_number`. Proses ini menyimpan:

- 120 lesson beserta seluruh materi, contoh, tugas, durasi, kriteria selesai, dan URL;
- vocabulary yang dinormalisasi per lesson;
- 4 fase belajar;
- kamus 58 konsep;
- metadata sumber belajar;
- checkpoint evaluasi.

Jika workbook diperbarui oleh pengelola, jalankan `npm run db:seed` lagi. Upsert `day_number` memperbarui materi bersama tanpa menggandakan Day dan tanpa menghapus progres pengguna.

## 4. Menjalankan aplikasi

Mode development:

```powershell
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Buat akun pertama di [http://localhost:3000/login?mode=register](http://localhost:3000/login?mode=register), lalu masuk. Semua akun langsung mendapat materi Day 1–120 yang sama dengan progres awal masing-masing.

Production build:

```powershell
npm run build
npm start
```

Pemeriksaan kualitas:

```powershell
npm run lint
```

## Route utama

- `/` — dashboard Day saat ini, statistik, streak, dan progres fase
- `/login` — masuk atau membuat akun
- `/learn/[day]` — materi lengkap dan pencatatan lima aktivitas
- `/roadmap` — seluruh Day dengan filter fase/status
- `/progress` — ringkasan, Day yang perlu diulang, dan riwayat aktivitas

## Tes AI setelah pembelajaran

Buka `/tests` atau gunakan tombol di akhir `/learn/[day]`. Tes terbuka setelah kelima checklist Day disimpan sebagai selesai. Soal dihasilkan dari materi lesson di PostgreSQL; workbook dan kurikulum Day 1–120 tetap menjadi sumber pembelajaran awal.

Satu tes terdiri dari teks bacaan orisinal, 3 soal reading, 3 soal grammar, dan satu writing singkat. Kunci dan penjelasan tidak dikirim ke browser sebelum jawaban dikumpulkan. Pilihan ganda dinilai di server (reading 30 + grammar 30); writing dinilai AI dengan rubrik isi, grammar, kosakata, dan susunan (masing-masing 0–5, dikalikan 2, maksimal 40). Total 0–100 adalah skor latihan internal, bukan skor TOEFL resmi. Ini latihan persiapan singkat, belum simulasi lengkap listening/speaking.

Set dua environment JustWoker berikut di Vercel dan `.env.local`, lalu redeploy:

```env
JUSTWOKER_API_KEY=key-dari-justwoker
JUSTWOKER_MODEL=model-yang-mendukung-json
```

Adapter mengirim permintaan Anthropic-compatible ke endpoint JustWoker `https://api.justwoker.icu/v1/messages` menggunakan header `x-api-key`, versi protokol `2023-06-01`, dan `max_tokens`. Respons dibaca dari blok `content` bertipe `text`, sehingga model extended-thinking tetap didukung. Jangan memberi awalan `NEXT_PUBLIC_` pada secret.

Untuk database baru atau yang sudah memakai migration Drizzle, jalankan `npm run db:migrate` untuk membuat seluruh tabel, termasuk sesi login dan tes AI. Jika database sebelumnya dibuat dengan `db:push` dan tidak memiliki riwayat migration, gunakan `npx drizzle-kit push --strict --verbose` dan tinjau SQL sebelum menyetujui; jangan menjalankan migration awal ke tabel yang sudah ada. Database project yang tersambung saat implementasi ini sudah memiliki schema login, session, kepemilikan tes per user, dan 120 materi bersama. Migration dan seed memuat `.env.local` lewat `@next/env`. File `drizzle/meta/_journal.json` harus ikut di Git agar migration tersedia pada checkout baru.

Riwayat dan hasil disimpan di Neon berdasarkan akun yang sedang login, sehingga tetap tersedia setelah login dari perangkat lain. Draf jawaban yang belum dikirim disimpan sementara di `sessionStorage` pada browser tersebut.

Aplikasi membatasi panggilan JustWoker hingga 10 kali untuk seluruh aplikasi per hari UTC dengan counter atomik PostgreSQL, termasuk panggilan gagal. Satu tes umumnya memakai dua panggilan: pembuatan soal dan penilaian writing. Permintaan penilaian ganda dikunci di database; hasil tersimpan dikembalikan tanpa panggilan AI baru. Tanpa konfigurasi AI, halaman belajar tetap berjalan dan halaman tes menampilkan status belum aktif.

Verifikasi dengan `npm test`, `npm run lint`, dan `npm run build`. Tes unit memakai respons provider tiruan untuk memeriksa perhitungan nilai, pemisahan kunci, validasi respons AI, serta redaksi error. Tes AI nyata memerlukan key provider yang valid.

## Aturan progres

Progres harian dihitung dari lima checklist: kosakata/review, reading, video/listening, speaking, dan writing. Masing-masing bernilai 20%. Day menjadi selesai hanya jika kelimanya dicentang. Day dengan pemahaman diri 1–2 muncul otomatis di daftar **Perlu diulang**.
