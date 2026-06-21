import express from 'express';
import {
  subscribe,
  unsubscribe,
  testNotification,
} from '../controller/notifications-controller.js';
import { validate } from '../../../middlewares/validate.js';
import { subscribePayloadSchema } from '../validator/schema.js';
import authenticateToken from '../../../middlewares/auth.js';
import { notificationsLimiter } from '../../../middlewares/rate-limit.js';

const routes = express.Router();

routes.post(
  '/subscribe',
  authenticateToken,
  notificationsLimiter,
  validate(subscribePayloadSchema),
  subscribe
);

routes.delete('/subscribe', authenticateToken, notificationsLimiter, unsubscribe);

routes.post('/test', authenticateToken, notificationsLimiter, testNotification);

export default routes;
