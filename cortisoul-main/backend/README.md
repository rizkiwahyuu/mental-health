# Cortisoul Backend

REST API untuk aplikasi **Cortisoul**, layanan backend berbasis Node.js.

## Teknologi

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [pnpm](https://pnpm.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)
- [Joi](https://joi.dev/)
- [JSON Web Token](https://jwt.io/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Docker](https://www.docker.com/)

## Prasyarat

- Node.js 18+
- [pnpm](https://pnpm.io/) 10+
- Instance PostgreSQL

## Instalasi

```bash
cd backend
pnpm install
```

## Konfigurasi lingkungan

Buat file `.env` di folder `backend` dan isi variabel berikut:

```env
HOST=0.0.0.0
PORT=3000

# Database connection
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# JWT secret
ACCESS_TOKEN_KEY=your-access-token-secret
REFRESH_TOKEN_KEY=your-refresh-token-secret

# Web Push VAPID Keys
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@cortisoul.com

# AI Service URL
PREDICT_SERVICE_URL=https://your-predict-service.example.com
REFLECTION_SERVICE_URL=https://your-reflection-service.example.com

# Redis Configurations
REDIS_URL=redis://localhost:6379
```

> Simpan semua nilai rahasia di file `.env`.
> Gunakan nilai yang valid untuk `DATABASE_URL`, `ACCESS_TOKEN_KEY`, `REFRESH_TOKEN_KEY`, dan `VAPID key`.

| Variabel                 | Keterangan                                               |
| ------------------------ | -------------------------------------------------------- |
| `HOST`                   | Host HTTP server                                         |
| `PORT`                   | Port HTTP server                                         |
| `DATABASE_URL`           | Connection string PostgreSQL                             |
| `ACCESS_TOKEN_KEY`       | Secret untuk menandatangani & memverifikasi access token |
| `REFRESH_TOKEN_KEY`      | Secret untuk refresh token                               |
| `VAPID_PUBLIC_KEY`       | Kunci publik Web Push untuk push notification            |
| `VAPID_PRIVATE_KEY`      | Kunci privat Web Push untuk menandatangani notifikasi    |
| `VAPID_SUBJECT`          | Subject email atau URL yang terkait Web Push             |
| `PREDICT_SERVICE_URL`    | URL endpoint layanan prediksi eksternal                  |
| `REFLECTION_SERVICE_URL` | URL endpoint layanan prediksi eksternal                  |
| `REDIS_URL`              | URL koneksi Redis untuk caching dan session              |
| `CORS_URL`               | URL domain frontend yang diizinkan mengakses API         |

## Database

Jalankan migrasi setelah `DATABASE_URL` tersedia:

```bash
pnpm migrate up
```

Migrasi yang tersedia:

- `users`
- `authentications`
- `journals`
- `notifications`
- `reflections`

## Menjalankan server

| Perintah          | Deskripsi                                         |
| ----------------- | ------------------------------------------------- |
| `pnpm start:dev`  | Development dengan [nodemon](https://nodemon.io/) |
| `pnpm start:prod` | Production (`NODE_ENV=production`)                |
| `pnpm lint`       | Cek kode dengan ESLint                            |

Setelah server berjalan, buka:

- **API:** `http://localhost:3000`
- **Dokumentasi Swagger:** `http://localhost:3000/api-docs`

## Lisensi

ISC.

## Author

Adriyan
