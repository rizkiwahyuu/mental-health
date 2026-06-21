import express from 'express';
import { validate } from '../../../middlewares/validate.js';
import { predictText } from '../controller/predict-controller.js';
import { predictTextSchema } from '../validator/schema.js';

const routes = express.Router();

routes.post('/', validate(predictTextSchema), predictText);

export default routes;
