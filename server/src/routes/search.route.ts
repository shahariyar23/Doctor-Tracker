import { Router } from 'express';
import { globalSearchHandler } from '../controllers/search.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { globalSearchQuerySchema } from '../validators/search.validator.js';

const router = Router();

// Protect search endpoint with Admin authentication
router.use(authenticate);

router.get('/', validate({ query: globalSearchQuerySchema }), globalSearchHandler);

export default router;

