import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as path from 'path';
import mjml2html from 'mjml';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class MailerService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: parseInt(this.configService.get<string>('MAIL_PORT') || '587', 10),
      secure: this.configService.get<string>('MAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
      logger: true,
      debug: true,
    });

    // Verify SMTP connection
    this.transporter
      .verify()
      .then(() => this.logger.log('SMTP connection verified'))
      .catch((err) => this.logger.error('SMTP connection error', err));
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
    lang: string = 'en',
  ): Promise<string> {
    try {
      const templatePath = path.join(__dirname, '..', 'i18n', 'emails', `${templateName}.mjml`);
      this.logger.debug(`Reading template from: ${templatePath}`);

      let mjmlTemplate = await fs.readFile(templatePath, 'utf8');
      this.logger.debug('Template loaded successfully');

      const translations = await this.getEmailTranslations(templateName, lang, context);
      this.logger.debug('Translations loaded');

      // Replace translation placeholders
      Object.entries(translations).forEach(([key, value]) => {
        const regex = new RegExp(
          `\\{\\{\s*'emails\\.${templateName}\\.${key}'\\s*\\|\\s*translate(?::\\s*\\{.*?\\})?\\s*\\}\\}`,
          'g',
        );
        mjmlTemplate = mjmlTemplate.replace(regex, value);
      });

      // Replace context variables
      Object.entries(context).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        mjmlTemplate = mjmlTemplate.replace(regex, String(value));
      });

      this.logger.debug('Template variables replaced');

      // Convert MJML to HTML
      const { html, errors } = mjml2html(mjmlTemplate);
      if (errors && errors.length > 0) {
        this.logger.error('MJML conversion errors:', errors);
      }

      return html;
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}:`, error);
      throw error;
    }
  }

  private async getEmailTranslations(
    templateName: string,
    lang: string,
    context: Record<string, any>,
  ): Promise<Record<string, string>> {
    const keys = ['title', 'greeting', 'message', 'button', 'footer'];
    const translations: Record<string, string> = {};

    for (const key of keys) {
      translations[key] = await this.i18n.translate(`emails.${templateName}.${key}`, {
        lang,
        args: context,
      });
    }

    return translations;
  }

  async sendVerificationEmail(
    email: string,
    verificationCode: string,
    lang: string = 'en',
  ): Promise<void> {
    try {
      const subject = 'Email Verification';
      const text = `Your verification code is: ${verificationCode}`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Verification</h2>
          <p>Your verification code is: <strong>${verificationCode}</strong></p>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `;

      const info = await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM'),
        to: email,
        subject,
        text,
        html,
      });

      this.logger.log(`Message sent: ${info.messageId}`);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error.stack);
      throw new Error('EMAIL_SEND_FAILED');
    }
  }

  async sendWelcomeEmail(email: string, name: string, lang: string = 'en'): Promise<void> {
    try {
      const subject = 'Welcome to Our Platform';
      const text = `Welcome ${name}! Thank you for joining our platform.`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome ${name}!</h2>
          <p>Thank you for joining our platform.</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM'),
        to: email,
        subject,
        text,
        html,
      });

      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error.stack);
      throw new Error('EMAIL_SEND_FAILED');
    }
  }

  async sendForgotPasswordEmail(
    email: string,
    verificationCode: string,
    lang: string = 'en',
  ): Promise<void> {
    try {
      const subject = 'Password Reset Request';
      const text = `Your password reset code is: ${verificationCode}`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Your password reset code is: <strong>${verificationCode}</strong></p>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: this.configService.get('MAIL_FROM'),
        to: email,
        subject,
        text,
        html,
      });

      this.logger.log(`Forgot password email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send forgot password email to ${email}`, error.stack);
      throw new Error('EMAIL_SEND_FAILED');
    }
  }
}
