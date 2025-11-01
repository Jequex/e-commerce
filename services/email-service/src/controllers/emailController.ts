import { Request, Response } from 'express';
import { EmailQueue, QueueStats } from '../queue/EmailQueue';
import { 
  sendEmailSchema, 
  bulkEmailSchema, 
  SendEmailRequest, 
  BulkEmailRequest 
} from '../schema';
import { ZodError } from 'zod';

export class EmailController {
  private emailQueue: EmailQueue;

  constructor(emailQueue: EmailQueue) {
    this.emailQueue = emailQueue;
  }

  // Send single email
  sendEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const emailData = sendEmailSchema.parse(req.body);
      
      const job = await this.emailQueue.addSingleEmail(emailData);
      
      res.status(202).json({
        success: true,
        message: 'Email queued for delivery',
        jobId: job.id,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Send bulk emails
  sendBulkEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const emailData = bulkEmailSchema.parse(req.body);
      
      const job = await this.emailQueue.addBulkEmail(emailData);
      
      res.status(202).json({
        success: true,
        message: 'Bulk email queued for delivery',
        jobId: job.id,
        recipientCount: emailData.recipients.length,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Send template-based email
  sendTemplateEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const emailData = sendEmailSchema.parse(req.body);
      
      if (!emailData.template) {
        res.status(400).json({
          success: false,
          error: 'Template name is required for template emails',
        });
        return;
      }
      
      const job = await this.emailQueue.addTemplateEmail(emailData);
      
      res.status(202).json({
        success: true,
        message: 'Template email queued for delivery',
        jobId: job.id,
        template: emailData.template,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Get job status
  getJobStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        res.status(400).json({
          success: false,
          error: 'Job ID is required',
        });
        return;
      }
      
      const job = await this.emailQueue.getJob(jobId);
      
      if (!job) {
        res.status(404).json({
          success: false,
          error: 'Job not found',
        });
        return;
      }
      
      const state = await job.getState();
      const progress = job.progress();
      const failedReason = job.failedReason;
      const processedOn = job.processedOn;
      const finishedOn = job.finishedOn;
      
      res.json({
        success: true,
        job: {
          id: job.id,
          state,
          progress,
          data: job.data,
          failedReason,
          processedOn,
          finishedOn,
          createdAt: new Date(job.timestamp),
        },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Get queue statistics
  getQueueStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.emailQueue.getStats();
      
      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Cancel a job
  cancelJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        res.status(400).json({
          success: false,
          error: 'Job ID is required',
        });
        return;
      }
      
      await this.emailQueue.removeJob(jobId);
      
      res.json({
        success: true,
        message: 'Job cancelled successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Pause queue
  pauseQueue = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.emailQueue.pauseQueue();
      
      res.json({
        success: true,
        message: 'Queue paused successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Resume queue
  resumeQueue = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.emailQueue.resumeQueue();
      
      res.json({
        success: true,
        message: 'Queue resumed successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Clean queue (remove completed/failed jobs)
  cleanQueue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { grace = 0 } = req.query;
      const graceMs = parseInt(grace as string, 10) || 0;
      
      await this.emailQueue.cleanQueue(graceMs);
      
      res.json({
        success: true,
        message: 'Queue cleaned successfully',
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Health check
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.emailQueue.getStats();
      
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        queue: stats,
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Verify email provider connection
  verifyConnection = async (req: Request, res: Response): Promise<void> => {
    try {
      const isConnected = await this.emailQueue.verifyConnection();
      
      res.json({
        success: true,
        connection: isConnected ? 'verified' : 'failed',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        connection: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  };

  private handleError(error: unknown, res: Response): void {
    console.error('Email controller error:', error);
    
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }
    
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}