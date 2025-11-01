import { Router } from 'express';
import { EmailController } from '../controllers/emailController';
import { rateLimitMiddleware } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validation';
import { sendEmailSchema, bulkEmailSchema } from '../schema';

export const createEmailRoutes = (emailController: EmailController): Router => {
  const router = Router();

  // Apply rate limiting to all email routes
  router.use(rateLimitMiddleware);

  // Send single email
  router.post(
    '/send',
    validateRequest(sendEmailSchema),
    emailController.sendEmail
  );

  // Send bulk emails
  router.post(
    '/send-bulk',
    validateRequest(bulkEmailSchema),
    emailController.sendBulkEmail
  );

  // Send template-based email
  router.post(
    '/send-template',
    validateRequest(sendEmailSchema),
    emailController.sendTemplateEmail
  );

  // Job management routes
  router.get('/jobs/:jobId', emailController.getJobStatus);
  router.delete('/jobs/:jobId', emailController.cancelJob);

  // Queue management routes
  router.get('/queue/stats', emailController.getQueueStats);
  router.post('/queue/pause', emailController.pauseQueue);
  router.post('/queue/resume', emailController.resumeQueue);
  router.post('/queue/clean', emailController.cleanQueue);

  // Health check
  router.get('/health', emailController.healthCheck);

  // Verify email provider connection
  router.get('/verify-connection', emailController.verifyConnection);

  return router;
};