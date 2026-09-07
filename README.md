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

## Aturan progres

Progres harian dihitung dari lima checklist: kosakata/review, reading, video/listening, speaking, dan writing. Masing-masing bernilai 20%. Day menjadi selesai hanya jika kelimanya dicentang. Day dengan pemahaman diri 1–2 muncul otomatis di daftar **Perlu diulang**.

