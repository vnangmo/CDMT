import nodemailer, { Transporter } from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config/config';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface WorkflowNotificationParams {
  to: string;
  recipientName: string;
  documentType: string;
  documentCode: string;
  documentLink: string;
  actionBy: string;
  actionDate: Date;
  status: string;
  comment?: string;
  rejectionReason?: string;
}

interface ReminderParams {
  to: string;
  recipientName: string;
  documentType: string;
  documentCode: string;
  daysWaiting: number;
  documentLink: string;
}

interface MentionParams {
  to: string;
  recipientName: string;
  mentionedBy: string;
  documentType: string;
  documentCode: string;
  commentText: string;
  documentLink: string;
}

/**
 * Email Service
 *
 * Wraps Nodemailer with retry logic, template rendering, and error handling.
 * All methods return boolean (success/failure) and never throw errors.
 */
class EmailService {
  private static transporter: Transporter | null = null;
  private static templateCache: Map<string, string> = new Map();

  /**
   * Initialize Nodemailer transporter
   */
  private static getTransporter(): Transporter {
    if (!this.transporter) {
      // Check if SMTP is configured
      if (!config.email.smtp.host || !config.email.smtp.port) {
        console.warn('[EmailService] SMTP not configured. Emails will be logged but not sent.');
        // Return a test transporter that logs emails
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true,
        });
        return this.transporter;
      }

      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure || false,
        auth: config.email.smtp.auth.user && config.email.smtp.auth.pass ? {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass,
        } : undefined,
      });

      console.log('[EmailService] Initialized with SMTP:', {
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        hasAuth: !!(config.email.smtp.auth.user && config.email.smtp.auth.pass),
      });
    }

    return this.transporter;
  }

  /**
   * Send a single email with retry logic
   */
  static async send(options: EmailOptions): Promise<boolean> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const transporter = this.getTransporter();

        const mailOptions = {
          from: config.email.from || 'noreply@cdmt.dj',
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || this.stripHtml(options.html),
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`[EmailService] Email sent successfully (attempt ${attempt}):`, {
          to: options.to,
          subject: options.subject,
          messageId: info.messageId,
        });

        return true;
      } catch (error) {
        lastError = error as Error;
        console.error(`[EmailService] Send failed (attempt ${attempt}/${maxRetries}):`, {
          to: options.to,
          subject: options.subject,
          error: lastError.message,
        });

        // Exponential backoff: 1s, 2s, 4s
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed - log to audit
    await this.logFailedEmail(options, lastError!);
    return false;
  }

  /**
   * Send multiple emails in batch
   */
  static async sendBatch(emails: EmailOptions[]): Promise<void> {
    console.log(`[EmailService] Sending batch of ${emails.length} emails`);

    const results = await Promise.allSettled(
      emails.map(email => this.send(email))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - succeeded;

    console.log(`[EmailService] Batch complete: ${succeeded} succeeded, ${failed} failed`);
  }

  /**
   * Send workflow notification email
   */
  static async sendWorkflowNotification(params: WorkflowNotificationParams): Promise<boolean> {
    const templateType = this.getWorkflowTemplateType(params.status);
    const { html, text } = await this.renderTemplate(templateType, params);

    const subject = this.getWorkflowSubject(params.status, params.documentType, params.documentCode);

    return this.send({
      to: params.to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send reminder email for pending document
   */
  static async sendReminder(params: ReminderParams): Promise<boolean> {
    const { html, text } = await this.renderTemplate('reminder-pending', params);

    const subject = `Rappel: Document en attente (${params.daysWaiting} jours) - ${params.documentCode}`;

    return this.send({
      to: params.to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send mention notification email
   */
  static async sendMentionNotification(params: MentionParams): Promise<boolean> {
    const { html, text } = await this.renderTemplate('comment-mention', params);

    const subject = `Vous avez été mentionné dans ${params.documentCode}`;

    return this.send({
      to: params.to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send reply notification email
   */
  static async sendReplyNotification(params: MentionParams): Promise<boolean> {
    const { html, text } = await this.renderTemplate('comment-reply', params);

    const subject = `Nouvelle réponse à votre commentaire - ${params.documentCode}`;

    return this.send({
      to: params.to,
      subject,
      html,
      text,
    });
  }

  /**
   * Render email template with data
   */
  private static async renderTemplate(
    type: string,
    data: any
  ): Promise<{ html: string; text: string }> {
    try {
      // Try to load template from file
      const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${type}.html`);

      let template = this.templateCache.get(type);

      if (!template) {
        try {
          template = await fs.readFile(templatePath, 'utf-8');
          this.templateCache.set(type, template);
        } catch (error) {
          // Template file doesn't exist yet - use fallback
          console.warn(`[EmailService] Template ${type}.html not found, using fallback`);
          template = this.getFallbackTemplate(type);
        }
      }

      // Replace template variables
      let html = template;
      const variables = {
        ...data,
        appUrl: config.urls.frontend || 'http://localhost:3000',
        logoUrl: `${config.urls.frontend || 'http://localhost:3000'}/logo.png`,
        year: new Date().getFullYear(),
      };

      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, String(value || ''));
      }

      // Generate plain text version
      const text = this.stripHtml(html);

      return { html, text };
    } catch (error) {
      console.error('[EmailService] Template rendering error:', error);
      return this.getFallbackEmailContent(type, data);
    }
  }

  /**
   * Get workflow template type based on status
   */
  private static getWorkflowTemplateType(status: string): string {
    const statusMap: Record<string, string> = {
      SUBMITTED: 'workflow-submitted',
      UNDER_REVIEW: 'workflow-submitted',
      VALIDATED: 'workflow-validated',
      APPROVED: 'workflow-approved',
      REJECTED: 'workflow-rejected',
      DRAFT: 'workflow-returned',
    };

    return statusMap[status] || 'workflow-submitted';
  }

  /**
   * Get workflow email subject
   */
  private static getWorkflowSubject(status: string, documentType: string, documentCode: string): string {
    const statusLabels: Record<string, string> = {
      SUBMITTED: 'Nouveau document soumis',
      UNDER_REVIEW: 'Document en cours de révision',
      VALIDATED: 'Document validé',
      APPROVED: 'Document approuvé',
      REJECTED: 'Document rejeté',
      DRAFT: 'Document retourné au brouillon',
    };

    const label = statusLabels[status] || 'Notification';
    return `${label} - ${documentCode}`;
  }

  /**
   * Fallback template for when HTML file doesn't exist
   */
  private static getFallbackTemplate(type: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9fafb; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CDMT Djibouti</h1>
    </div>
    <div class="content">
      <h2>{{title}}</h2>
      <p>Bonjour {{recipientName}},</p>
      <p>{{message}}</p>
      <a href="{{documentLink}}" class="button">Voir le document</a>
      <p>Détails:</p>
      <ul>
        <li>Document: {{documentCode}}</li>
        <li>Type: {{documentType}}</li>
        <li>Statut: {{status}}</li>
      </ul>
    </div>
    <div class="footer">
      <p>&copy; {{year}} CDMT Djibouti. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Fallback email content when template rendering fails
   */
  private static getFallbackEmailContent(type: string, data: any): { html: string; text: string } {
    const html = `
      <h1>CDMT Djibouti</h1>
      <p>Bonjour ${data.recipientName || 'Utilisateur'},</p>
      <p>Une notification a été générée concernant: ${data.documentCode || 'Document'}</p>
      <p>Veuillez vous connecter à l'application pour plus de détails.</p>
    `;

    const text = this.stripHtml(html);

    return { html, text };
  }

  /**
   * Strip HTML tags to generate plain text version
   */
  private static stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Log failed email to audit trail
   */
  private static async logFailedEmail(email: EmailOptions, error: Error): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: 'system',
          action: 'EMAIL_FAILED',
          entity: 'Email',
          entityId: email.to,
          oldValue: Prisma.JsonNull,
          newValue: {
            to: email.to,
            subject: email.subject,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        },
      });

      console.error('[EmailService] Failed email logged to audit trail');
    } catch (auditError) {
      console.error('[EmailService] Failed to log email error to audit:', auditError);
    }
  }

  /**
   * Clear template cache (useful for development)
   */
  static clearTemplateCache(): void {
    this.templateCache.clear();
    console.log('[EmailService] Template cache cleared');
  }
}

export default EmailService;
