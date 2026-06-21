import rateLimit from 'express-rate-limit';

const createRateLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        status: 'fail',
        message,
      }),
  });

export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Terlalu banyak permintaan login. Coba lagi setelah beberapa menit.',
});

export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message:
    'Terlalu banyak percobaan register. Coba lagi setelah beberapa saat.',
});

export const notificationsLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message:
    'Terlalu banyak permintaan notifikasi. Coba lagi setelah beberapa saat.',
});

export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti.',
});
