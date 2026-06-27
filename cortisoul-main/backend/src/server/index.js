import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from '../routes/index.js';
import ErrorHandler from '../middlewares/error.js';
import startCronJob from '../services/notifications/cron/notification-cron.js';
import requestLogger from '../middlewares/request-logger.js';
import { globalLimiter } from '../middlewares/rate-limit.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

// network
app.set('trust proxy', 1);

// security
app.use(express.json());
app.use(globalLimiter);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }

    return callback(new Error('Origin tidak diizinkan oleh CORS'));
  },
}));

// logging
app.use(requestLogger);

// routes
app.use(routes);

// error handling
app.use(ErrorHandler);

// notifications
startCronJob();

export default app;
