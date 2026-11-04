import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middlewares/not-found.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app: Application = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.clientUrl === '*' ? '*' : [config.clientUrl, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Logging middleware in development
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Cookie parser middleware (must precede routes)
app.use(cookieParser());

// Body parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// API Routes
app.use('/api/v1', apiRouter);

// 404 Route Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
