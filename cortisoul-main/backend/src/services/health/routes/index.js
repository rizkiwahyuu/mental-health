import express from 'express';
import { healthCheck } from '../controller/health-controller.js';

const routes = express.Router();

routes.get('/', healthCheck);

export default routes;
