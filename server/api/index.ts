import type { Request, Response } from 'express';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let isConnected = false;

export default async function handler(req: Request, res: Response) {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error('[Serverless DB Error]', err);
    }
  }
  return app(req, res);
}

