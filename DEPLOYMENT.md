    # Deploy Cortisoul ke Railway dan Vercel

Arsitektur production:

- Vercel: Next.js frontend
- Railway: Express backend, FastAPI prediction, FastAPI reflection, PostgreSQL
- Redis opsional; backend tetap berjalan saat cache dimatikan

## 1. Push source code

Pastikan perubahan deployment sudah di-commit dan di-push ke repository GitHub `rizkiwahyuu/mental-health`.

Jangan commit `.env`, API key, database lokal, atau log.

## 2. Buat project Railway

Di Railway, buat satu project lalu tambahkan PostgreSQL dan tiga Empty Service. Hubungkan ketiganya ke repository GitHub yang sama dan beri nama persis:

| Service | Root Directory |
| --- | --- |
| `predict` | `/cortisoul_predict-main/cortisoul_predict-main` |
| `reflect` | `/cortisoul_reflect-main/cortisoul_reflect-main` |
| `backend` | `/cortisoul-main/backend` |

Masing-masing root sudah memiliki `Dockerfile` dan `railway.json`. Deploy `predict` dan `reflect` terlebih dahulu, kemudian `backend`.

## 3. Variabel Railway

Pada service `reflect`:

```env
GEMINI_API_KEY=isi_api_key_dari_google_ai_studio
GEMINI_MODEL=gemini-3.1-flash-lite
```

Pada service `backend`, buka Variables lalu gunakan RAW Editor:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
CACHE_ENABLED=false
ACCESS_TOKEN_KEY=ganti_dengan_secret_acak_panjang
REFRESH_TOKEN_KEY=ganti_dengan_secret_acak_lain
PREDICT_SERVICE_URL=http://${{predict.RAILWAY_PRIVATE_DOMAIN}}
PREDICT_FALLBACK_ENABLED=true
REFLECTION_SERVICE_URL=http://${{reflect.RAILWAY_PRIVATE_DOMAIN}}
REFLECTION_FALLBACK_ENABLED=true
CORS_ORIGIN=https://NAMA-PROJECT.vercel.app
VAPID_SUBJECT=mailto:email-anda@example.com
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

Nama database bawaan biasanya `Postgres`. Jika nama service database berbeda, pilih `DATABASE_URL` melalui autocomplete Railway agar referensinya tepat. Buat JWT secret dengan PowerShell:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

`PORT` tidak perlu dibuat; Railway memberikannya otomatis. Migrasi PostgreSQL dijalankan otomatis oleh `preDeployCommand` sebelum backend aktif.

## 4. Domain backend

Pada service `backend`, buka Settings > Networking > Public Networking lalu pilih Generate Domain. Uji:

```text
https://DOMAIN-BACKEND.up.railway.app/health
```

`DOMAIN-BACKEND` adalah placeholder. Salin domain asli yang ditampilkan Railway dan jangan menyalin teks placeholder tersebut. Respons domain asli harus berstatus `200` dan berisi `"Service is healthy"`. Jika muncul `Application not found`, domain salah atau deployment backend belum aktif. Service `predict` dan `reflect` tidak memerlukan public domain karena backend mengakses keduanya melalui private network Railway.

Model prediction mengunduh IndoBERT saat image dibangun dan menggunakan TensorFlow serta PyTorch. Build pertama cukup lama dan service memerlukan RAM lebih besar daripada backend biasa. Jika log berisi `out of memory`, naikkan memory service `predict`. Selama service model belum siap, fallback lokal backend tetap membuat prediksi.

## 5. Deploy frontend di Vercel

Di Vercel pilih Add New > Project, import repository yang sama, lalu atur:

```text
Framework Preset : Next.js
Root Directory   : cortisoul-main/frontend
Build Command    : next build
Install Command  : npm install
```

Tambahkan Environment Variables untuk Production dan Preview:

```env
NEXT_PUBLIC_API_URL=https://DOMAIN-BACKEND.up.railway.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

Ganti `DOMAIN-BACKEND` dengan domain asli dari langkah 4. Setelah mengubah `NEXT_PUBLIC_API_URL`, lakukan Redeploy di Vercel karena variabel `NEXT_PUBLIC_*` dimasukkan saat proses build.

Deploy frontend. Setelah memperoleh domain final Vercel, kembali ke variable `CORS_ORIGIN` pada backend Railway. Isikan domain tanpa slash di belakang, lalu redeploy backend:

```env
CORS_ORIGIN=https://cortisoul.vercel.app
```

Untuk mengizinkan lebih dari satu domain, pisahkan dengan koma:

```env
CORS_ORIGIN=https://cortisoul.vercel.app,https://preview-tetap.vercel.app
```

## 6. Pemeriksaan akhir

1. Buka frontend Vercel dan daftarkan akun baru.
2. Login, buat jurnal, lalu pastikan label dan skor mengikuti isi jurnal.
3. Buka detail jurnal dan generate refleksi.
4. Periksa Railway Logs jika browser menampilkan error.
5. Pastikan request frontend menuju domain Railway, bukan `localhost:5000`.

## Masalah pendaftaran akun

Jika tombol Daftar gagal:

1. Buka `https://DOMAIN-ASLI-BACKEND/health`. Jangan lanjut sebelum hasilnya `200`.
2. Pastikan Vercel `NEXT_PUBLIC_API_URL` berisi domain yang sama, tanpa `/health` dan tanpa slash di belakang.
3. Pastikan Railway backend `CORS_ORIGIN` sama persis dengan domain frontend Vercel, termasuk `https://`.
4. Redeploy backend setelah mengubah `CORS_ORIGIN`, lalu redeploy frontend setelah mengubah `NEXT_PUBLIC_API_URL`.
5. Di Railway backend Logs, pastikan pre-deploy `pnpm migrate up` selesai tanpa error.

Docker Desktop tidak perlu aktif setelah aplikasi berada di Railway/Vercel. Docker hanya digunakan oleh Railway saat membangun image di cloud.
