import { config } from '../config';
import { EmailJob, SendEmailRequest, BulkEmailRequest } from '../schema';
import { EmailProvider } from '../providers/EmailProvider';
import { TemplateManager } from '../templates/engine';
import { v4 as uuidv4 } from 'uuid';

// Import Bull with proper typing
const Bull = require('bull');

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface JobOptions {
  jobId?: string;
  priority?: number;
  delay?: number;
  attempts?: number;
  removeOnComplete?: number;
  removeOnFail?: number;
}

export interface Job<T> {
  id: string;
  data: T;
  progress(value: number): Promise<void>;
}

export class EmailQueue {
  private queue: any;
  private emailProvider: EmailProvider;
  private templateManager: TemplateManager;

  constructor(emailProvider: EmailProvider, templateManager: TemplateManager) {
    this.emailProvider = emailProvider;
    this.templateManager = templateManager;

    // Initialize Bull queue with Redis connection
    this.queue = new Bull('email processing', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
      },
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.setupProcessors();
    this.setupEventHandlers();
  }

  private setupProcessors() {
    // Process single email jobs
    this.queue.process('single-email', 5, async (job: Job<SendEmailRequest>) => {
      return this.processSingleEmail(job);
    });

    // Process bulk email jobs
    this.queue.process('bulk-email', 2, async (job: Job<BulkEmailRequest>) => {
      return this.processBulkEmail(job);
    });

    // Process template-based emails
    this.queue.process('template-email', 5, async (job: Job<SendEmailRequest>) => {
      return this.processTemplateEmail(job);
    });
  }

  private setupEventHandlers() {
    this.queue.on('completed', (job: any, result: any) => {
      console.log(`Job ${job.id} completed successfully:`, result);
    });

    this.queue.on('failed', (job: any, error: Error) => {
      console.error(`Job ${job.id} failed:`, error.message);
    });

    this.queue.on('stalled', (job: any) => {
      console.warn(`Job ${job.id} stalled and will be retried`);
    });

    this.queue.on('progress', (job: any, progress: number) => {
      console.log(`Job ${job.id} progress: ${progress}%`);
    });
  }

  async addSingleEmail(
    emailData: SendEmailRequest,
    options: JobOptions = {}
  ): Promise<Job<SendEmailRequest>> {
    const jobId = uuidv4();
    
    const jobOptions: JobOptions = {
      jobId,
      priority: this.getPriority(emailData.priority),
      delay: emailData.sendAt ? new Date(emailData.sendAt).getTime() - Date.now() : 0,
      ...options,
    };

    return this.queue.add('single-email', emailData, jobOptions);
  }

  async addBulkEmail(
    emailData: BulkEmailRequest,
    options: JobOptions = {}
  ): Promise<Job<BulkEmailRequest>> {
    const jobId = uuidv4();
    
    const jobOptions: JobOptions = {
      jobId,
      priority: this.getPriority(emailData.priority),
      delay: emailData.sendAt ? new Date(emailData.sendAt).getTime() - Date.now() : 0,
      ...options,
    };

    return this.queue.add('bulk-email', emailData, jobOptions);
  }

  async addTemplateEmail(
    emailData: SendEmailRequest,
    options: JobOptions = {}
  ): Promise<Job<SendEmailRequest>> {
    const jobId = uuidv4();
    
    const jobOptions: JobOptions = {
      jobId,
      priority: this.getPriority(emailData.priority),
      delay: emailData.sendAt ? new Date(emailData.sendAt).getTime() - Date.now() : 0,
      ...options,
    };

    return this.queue.add('template-email', emailData, jobOptions);
  }

  private async processSingleEmail(job: Job<SendEmailRequest>): Promise<any> {
    const { data } = job;
    
    try {
      await job.progress(10);
      
      let emailContent = { html: '', text: '' };
      
      if (data.template && data.templateData) {
        // Compile template
        await job.progress(30);
        emailContent = await this.templateManager.getTemplate(
          data.template,
          data.templateData
        );
      } else {
        emailContent = {
          html: data.html || '',
          text: data.text || '',
        };
      }
      
      await job.progress(50);
      
      // Send email
      const result = await this.emailProvider.sendEmail({
        ...data,
        html: emailContent.html,
        text: emailContent.text,
      });
      
      await job.progress(100);
      
      return {
        success: true,
        messageId: result.messageId,
        recipients: data.to.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to process single email:', error);
      throw error;
    }
  }

  private async processBulkEmail(job: Job<BulkEmailRequest>): Promise<any> {
    const { data } = job;
    const results: any[] = [];
    const total = data.recipients.length;
    
    try {
      await job.progress(5);
      
      // Process recipients in batches
      const batchSize = 10;
      const batches = this.chunkArray(data.recipients, batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchPromises = batch?.map(async (recipient: any) => {
          try {
            // Compile template with recipient-specific data
            const emailContent = await this.templateManager.getTemplate(
              data.template,
              {
                ...recipient.templateData,
                email: recipient.email,
                name: recipient.name,
              }
            );
            
            // Send individual email
            const result = await this.emailProvider.sendEmail({
              to: [{ email: recipient.email, name: recipient.name }],
              subject: data.subject,
              html: emailContent.html,
              text: emailContent.text,
              priority: data.priority,
            });
            
            return {
              success: true,
              recipient: recipient.email,
              messageId: result.messageId,
            };
          } catch (error) {
            return {
              success: false,
              recipient: recipient.email,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises || []);
        results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : r.reason));
        
        // Update progress
        const progress = Math.min(95, ((i + 1) / batches.length) * 90 + 5);
        await job.progress(progress);
      }
      
      await job.progress(100);
      
      return {
        success: true,
        total,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to process bulk email:', error);
      throw error;
    }
  }

  private async processTemplateEmail(job: Job<SendEmailRequest>): Promise<any> {
    // Similar to processSingleEmail but with additional template processing
    return this.processSingleEmail(job);
  }

  private getPriority(priority: 'low' | 'normal' | 'high' = 'normal'): number {
    switch (priority) {
      case 'high':
        return 1;
      case 'normal':
        return 5;
      case 'low':
        return 10;
      default:
        return 5;
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async getStats(): Promise<QueueStats> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getActive(),
      this.queue.getCompleted(),
      this.queue.getFailed(),
      this.queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async getJob(jobId: string): Promise<any | null> {
    return this.queue.getJob(jobId);
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  async pauseQueue(): Promise<void> {
    await this.queue.pause();
  }

  async resumeQueue(): Promise<void> {
    await this.queue.resume();
  }

  async cleanQueue(grace: number = 0): Promise<void> {
    await this.queue.clean(grace);
  }

  async verifyConnection(): Promise<boolean> {
    return this.emailProvider.verifyConnection();
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}