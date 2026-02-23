import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappService {
  constructor(private readonly config: ConfigService) {}

  async sendMessage(params: { to: string; message: string; pdfUrl?: string }) {
    const baseUrl = this.config.get<string>('WHATSAPP_API_BASE_URL');
    const token = this.config.get<string>('WHATSAPP_API_TOKEN');

    if (!baseUrl || !token) {
      return {
        sent: false,
        reason: 'WhatsApp API not configured',
      };
    }

    // Integration intentionally stubbed; real implementation depends on provider.
    return { sent: false, reason: 'WhatsApp integration stubbed' };
  }
}
