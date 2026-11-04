import { Router } from 'express';
import { loginHandler, getMeHandler, logoutHandler } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { loginRateLimiter } from '../middlewares/rate-limit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginBodySchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/login', loginRateLimiter, validate({ body: loginBodySchema }), loginHandler);

router.get('/me', authenticate, getMeHandler);

router.post('/logout', logoutHandler);

export default router;
