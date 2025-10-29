import { SendEmailRequest, EmailRecipient, EmailAttachment } from '../schema';

export interface EmailResult {
  success: boolean;
  messageId: string;
  error?: string;
}

export interface EmailProvider {
  sendEmail(request: SendEmailRequest): Promise<EmailResult>;
  verifyConnection(): Promise<boolean>;
}

export interface EmailOptions {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  priority?: 'low' | 'normal' | 'high';
}