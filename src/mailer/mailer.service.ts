// src/mailer/mailer.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendInvoice(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: `"My Shop" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
  }
}
