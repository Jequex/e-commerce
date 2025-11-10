import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import { EmailProvider, EmailResult } from './EmailProvider';
import { SendEmailRequest } from '../schema';
import { config } from '../config';

export class SMTPProvider implements EmailProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp?.host,
      port: config.email.smtp?.port,
      secure: config.email.smtp?.secure,
      auth: {
        user: config.email.smtp?.auth.user,
        pass: config.email.smtp?.auth.pass,
      },
    });
  }

  async sendEmail(request: SendEmailRequest): Promise<EmailResult> {
    console.log('sending...');
    
    try {
      const mailOptions = {
        from: { 
          name: config.email.from.name,
          address: config.email.from.email,
        },
        to: request.to.map(recipient => 
          recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
        ),
        cc: request.cc?.map(recipient => 
          recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
        ),
        bcc: request.bcc?.map(recipient => 
          recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
        ),
        subject: request.subject,
        html: request.html,
        text: request.text,
        attachments: request.attachments?.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
          disposition: attachment.disposition,
          encoding: 'base64',
        })),
        priority: (request.priority === 'high' ? 'high' : request.priority === 'low' ? 'low' : 'normal') as 'low' | 'normal' | 'high',
      };

      const result: SentMessageInfo = await this.transporter.sendMail(mailOptions);
      console.log(result);
      

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('SMTP send error:', error);
      return {
        success: false,
        messageId: '',
        error: error instanceof Error ? error.message : 'Unknown SMTP error',
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}