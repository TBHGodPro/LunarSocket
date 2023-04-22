import { Router } from 'express';
import auth from '../middleware/auth';

const keyRouter = Router();

keyRouter.get('/', auth, async (request, response) => {
  response.sendStatus(200);
});

export default keyRouter;
