import { z } from 'zod';

// Email validation schemas
export const emailAddressSchema = z.string().email('Invalid email address');

export const emailAttachmentSchema = z.object({
  filename: z.string(),
  content: z.string(), // Base64 encoded content
  contentType: z.string().optional(),
  disposition: z.enum(['attachment', 'inline']).default('attachment'),
});

export const emailRecipientSchema = z.object({
  email: emailAddressSchema,
  name: z.string().optional(),
});

export const emailTemplateDataSchema = z.record(z.any());

export const sendEmailSchema = z.object({
  to: z.array(emailRecipientSchema).min(1, 'At least one recipient is required'),
  cc: z.array(emailRecipientSchema).optional(),
  bcc: z.array(emailRecipientSchema).optional(),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  template: z.string().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  templateData: emailTemplateDataSchema.optional(),
  attachments: z.array(emailAttachmentSchema).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  sendAt: z.date().optional(), // For scheduled emails
}).refine(
  (data) => data.template || data.html || data.text,
  {
    message: 'Either template, html, or text content is required',
    path: ['content'],
  }
);

export const bulkEmailSchema = z.object({
  template: z.string(),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  recipients: z.array(z.object({
    email: emailAddressSchema,
    name: z.string().optional(),
    templateData: emailTemplateDataSchema.optional(),
  })).min(1, 'At least one recipient is required'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  sendAt: z.date().optional(),
});

export const emailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Subject template is required'),
  html: z.string().min(1, 'HTML template is required'),
  text: z.string().optional(),
  variables: z.array(z.string()).optional(),
  category: z.enum(['transactional', 'marketing', 'system']).default('transactional'),
});

export const webhookEventSchema = z.object({
  eventType: z.enum(['delivered', 'bounced', 'complained', 'opened', 'clicked']),
  messageId: z.string(),
  timestamp: z.date(),
  recipient: emailAddressSchema,
  metadata: z.record(z.any()).optional(),
});

// Type exports
export type EmailAddress = z.infer<typeof emailAddressSchema>;
export type EmailRecipient = z.infer<typeof emailRecipientSchema>;
export type EmailAttachment = z.infer<typeof emailAttachmentSchema>;
export type SendEmailRequest = z.infer<typeof sendEmailSchema>;
export type BulkEmailRequest = z.infer<typeof bulkEmailSchema>;
export type EmailTemplate = z.infer<typeof emailTemplateSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export type EmailTemplateData = z.infer<typeof emailTemplateDataSchema>;

// Email job data for queue
export const emailJobSchema = z.object({
  id: z.string(),
  type: z.enum(['single', 'bulk', 'template']),
  data: z.union([sendEmailSchema, bulkEmailSchema]),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(3),
  delay: z.number().optional(),
  createdAt: z.date().default(() => new Date()),
});

export type EmailJob = z.infer<typeof emailJobSchema>;