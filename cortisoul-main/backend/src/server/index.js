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

// network
app.set('trust proxy', 1);

// security
app.use(express.json());
app.use(globalLimiter);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));

// logging
app.use(requestLogger);

// routes
app.use(routes);

// error handling
app.use(ErrorHandler);

// notifications
startCronJob();

export default app;
