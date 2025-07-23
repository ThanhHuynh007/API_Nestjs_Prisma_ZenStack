/* eslint-disable */
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { Twilio } from 'twilio';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';  // Đường dẫn tùy dự án

@Injectable()
export class SmsService {
  private twilio: Twilio;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,  // Inject PrismaService để truy vấn DB
  ) {
    this.twilio = new Twilio(
      config.get('TWILIO_ACCOUNT_SID'),
      config.get('TWILIO_AUTH_TOKEN'),
    );
  }

  async sendOTP(phone: string) {
    // Kiểm tra nếu phone đã tồn tại trong database thì không gửi OTP nữa
    const existingUser = await this.prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      throw new ConflictException('Phone number is already registered');
    }

    try {
      const serviceSid = this.config.get('TWILIO_VERIFY_SERVICE_SID');
      return await this.twilio.verify.services(serviceSid)
        .verifications.create({ to: phone, channel: 'sms' });
    } catch (err) {
      console.error('Send OTP failed:', err);
      throw new BadRequestException('Failed to send OTP');
    }
  }

  async verifyOTP(phone: string, code: string) {
    try {
      const serviceSid = this.config.get('TWILIO_VERIFY_SERVICE_SID');
      const resp = await this.twilio.verify.services(serviceSid)
        .verificationChecks.create({ to: phone, code });
      if (resp.status !== 'approved') {
        throw new BadRequestException('Invalid OTP code');
      }
    } catch (err) {
      console.error('Verify OTP failed:', err);
      throw new BadRequestException('Invalid OTP code');
    }
  }
}
