import express from 'express';
import {
  createJournal,
  getJournals,
  getJournalById,
  editJournalById,
  deleteJournalById,
  getWeeklyStress,
  getWeeklyEmotion,
} from '../controller/journals-controller.js';
import { validate } from '../../../middlewares/validate.js';
import { journalPayloadSchema } from '../validator/schema.js';
import authenticateToken from '../../../middlewares/auth.js';
import {
  generateReflection,
  getReflection,
} from '../../reflections/controller/reflection-controller.js';

const routes = express.Router();

routes.post(
  '/',
  authenticateToken,
  validate(journalPayloadSchema),
  createJournal
);
routes.get('/stress-levels', authenticateToken, getWeeklyStress);
routes.get('/emotions', authenticateToken, getWeeklyEmotion);
routes.get('/', authenticateToken, getJournals);
routes.get('/:id', authenticateToken, getJournalById);
routes.put(
  '/:id',
  authenticateToken,
  validate(journalPayloadSchema),
  editJournalById
);
routes.delete('/:id', authenticateToken, deleteJournalById);
routes.post('/:id/reflections', authenticateToken, generateReflection);
routes.get('/:id/reflections', authenticateToken, getReflection);

export default routes;
