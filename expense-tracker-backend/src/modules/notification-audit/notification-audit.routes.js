import express from 'express';
import { fetchNotificationAuditLogs } from './notification-audit.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, fetchNotificationAuditLogs);

export default router;
