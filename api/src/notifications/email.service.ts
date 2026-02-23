import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) {}

  async sendMail(params: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    attachments?: Array<{ filename: string; path: string }>; // path is URL or file path
  }) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      return {
        sent: false,
        reason: 'SMTP not configured',
      };
    }

    const port = Number(this.config.get<string>('SMTP_PORT') ?? '587');
    const from = this.config.get<string>('SMTP_FROM') ?? user;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments,
    });

    return { sent: true, messageId: info.messageId };
  }
}
