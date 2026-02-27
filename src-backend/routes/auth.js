import express from 'express';
import { auth } from '../lib/auth.js';
import { toNodeHandler } from 'better-auth/node';

const router = express.Router();

// Forward all /api/auth requests to Better Auth
router.all(/(.*)/, toNodeHandler(auth));

export default router;
