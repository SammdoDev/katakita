# KataKita

KataKita adalah personal learning tracker untuk mengikuti kurikulum bahasa Inggris Day 1–120. Seluruh kurikulum awal dibaca dari `Rencana_Belajar_Inggris_120_Hari.xlsx`; setelah import, Neon PostgreSQL menjadi sumber data utama aplikasi.

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

Project ini memakai satu user lokal bawaan (`learner@katakita.local`) karena autentikasi multi-user tidak termasuk scope awal. Schema `users` sudah siap dikembangkan jika autentikasi ditambahkan kemudian.

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

## 3. Seed/import Excel awal

Pastikan file berikut tetap berada di root project:

```text
Rencana_Belajar_Inggris_120_Hari.xlsx
```

Lalu jalankan:

```powershell
npm run db:seed
```

Seed membaca dan memvalidasi workbook asli, lalu melakukan upsert berdasarkan `day_number`. Proses ini menyimpan:

- 120 lesson beserta seluruh materi, contoh, tugas, durasi, kriteria selesai, dan URL;
- vocabulary yang dinormalisasi per lesson;
- 4 fase belajar;
- kamus 58 konsep;
- metadata sumber belajar;
- checkpoint evaluasi.

Sebagai alternatif, jalankan aplikasi lalu buka `/admin/import`. Pilih file `.xlsx`, lakukan preview/validasi, kemudian klik **Import ke Neon**. Mengunggah revisi workbook tidak menggandakan Day karena import menggunakan upsert `day_number`.

Tombol **Download template awal** pada halaman import mengunduh workbook awal dengan struktur tujuh sheet yang wajib dipertahankan.

## 4. Menjalankan aplikasi

Mode development:

```powershell
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

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
- `/learn/[day]` — materi lengkap dan pencatatan lima aktivitas
- `/roadmap` — seluruh Day dengan filter fase/status
- `/progress` — ringkasan, Day yang perlu diulang, dan riwayat aktivitas
- `/admin/import` — preview, validasi, dan upsert workbook

## Tes AI setelah pembelajaran

Buka `/tests` atau gunakan tombol di akhir `/learn/[day]`. Tes terbuka setelah kelima checklist Day disimpan sebagai selesai. Soal dihasilkan dari materi lesson di PostgreSQL; workbook dan kurikulum Day 1–120 tetap menjadi sumber pembelajaran awal.

Satu tes terdiri dari teks bacaan orisinal, 3 soal reading, 3 soal grammar, dan satu writing singkat. Kunci dan penjelasan tidak dikirim ke browser sebelum jawaban dikumpulkan. Pilihan ganda dinilai di server (reading 30 + grammar 30); writing dinilai AI dengan rubrik isi, grammar, kosakata, dan susunan (masing-masing 0–5, dikalikan 2, maksimal 40). Total 0–100 adalah skor latihan internal, bukan skor TOEFL resmi. Ini latihan persiapan singkat, belum simulasi lengkap listening/speaking.

Set environment berikut di Vercel dan `.env.local`, lalu redeploy:

```env
AI_API_KEY=key-dari-provider
AI_BASE_URL=https://alamat-api-provider/v1
AI_MODEL=model-yang-mendukung-json
AI_DAILY_LIMIT=10
```

Adapter menggunakan protokol `POST /chat/completions`, bearer token, `response_format: json_object`, dan `max_tokens`. Gunakan base URL dan model yang didukung provider pilihanmu; tidak ada key, URL provider, atau model yang dikunci ke satu vendor. Untuk Gemini lewat endpoint kompatibel, lihat [dokumentasi resmi Google](https://ai.google.dev/gemini-api/docs/openai). Jangan memberi awalan `NEXT_PUBLIC_` pada secret.

Untuk database baru atau yang sudah memakai migration Drizzle, jalankan `npm run db:migrate` untuk membuat `ai_test_attempts` dan `ai_request_usage`. Jika database sebelumnya dibuat dengan `db:push` dan tidak memiliki riwayat migration, gunakan `npx drizzle-kit push --strict --verbose` dan tinjau SQL sebelum menyetujui; jangan menjalankan migration awal ke tabel yang sudah ada. Database project yang tersambung saat implementasi ini sudah mendapatkan dua tabel AI melalui jalur push tersebut. Migration dan seed sekarang memuat `.env.local` lewat `@next/env`. File `drizzle/meta/_journal.json` harus ikut di Git agar migration tersedia pada checkout baru.

Riwayat dan hasil disimpan di Neon; akses tiap tes mengikuti token acak dalam cookie HTTP-only browser (bukan login lintas perangkat). Draf jawaban disimpan di `sessionStorage` sampai submit. Menghapus cookie akan menghilangkan akses ke riwayat browser tersebut. Materi harian tetap memakai profil personal bawaan yang sama seperti versi awal.

`AI_DAILY_LIMIT` membatasi jumlah panggilan provider untuk seluruh aplikasi per hari UTC dengan counter atomik PostgreSQL, termasuk panggilan gagal. Default 10 panggilan (umumnya dua per tes: pembuatan soal dan penilaian writing). Permintaan penilaian ganda dikunci di database; hasil tersimpan dikembalikan tanpa panggilan AI baru. Batas ini membatasi penggunaan pada aplikasi personal publik, bukan pengganti autentikasi pemilik. Tanpa konfigurasi AI, halaman belajar tetap berjalan dan halaman tes menampilkan status belum aktif.

Verifikasi dengan `npm test`, `npm run lint`, dan `npm run build`. Tes unit memakai respons provider tiruan untuk memeriksa perhitungan nilai, pemisahan kunci, validasi respons AI, serta redaksi error. Tes AI nyata memerlukan key provider yang valid.

## Aturan progres

Progres harian dihitung dari lima checklist: kosakata/review, reading, video/listening, speaking, dan writing. Masing-masing bernilai 20%. Day menjadi selesai hanya jika kelimanya dicentang. Day dengan pemahaman diri 1–2 muncul otomatis di daftar **Perlu diulang**.
