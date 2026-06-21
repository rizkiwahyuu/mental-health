import express from 'express';
import { createUser, getUserById } from '../controller/users-controller.js';
import { validate } from '../../../middlewares/validate.js';
import { userPayloadSchema } from '../validator/schema.js';
import { registerLimiter } from '../../../middlewares/rate-limit.js';

const routes = express.Router();

routes.post('/', registerLimiter, validate(userPayloadSchema), createUser);
routes.get('/:id', getUserById);

export default routes;
