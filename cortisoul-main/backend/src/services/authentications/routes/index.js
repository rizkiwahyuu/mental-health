import express from 'express';
import {
  login,
  refreshToken,
  logout,
} from '../controller/authentications-controller.js';
import { validate } from '../../../middlewares/validate.js';
import {
  postAuthenticationPayloadSchema,
  putAuthenticationPayloadSchema,
  deleteAuthenticationPayloadSchema,
} from '../validator/schema.js';
import { loginLimiter } from '../../../middlewares/rate-limit.js';

const routes = express.Router();

routes.post(
  '/',
  loginLimiter,
  validate(postAuthenticationPayloadSchema),
  login
);
routes.put('/', validate(putAuthenticationPayloadSchema), refreshToken);
routes.delete('/', validate(deleteAuthenticationPayloadSchema), logout);

export default routes;
