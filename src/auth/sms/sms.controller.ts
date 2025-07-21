import { Controller, Post, Body } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthService } from '../auth.service';

@Controller('auth/phone')
export class SmsController {
    constructor(
        private smsService: SmsService,
        private authService: AuthService,
    ) { }

    @Post('send-otp')
    async sendOtp(@Body() dto: SendOtpDto) {
        await this.smsService.sendOTP(dto.phone);
        return { status: 'OK', message: 'OTP sent successfully' };
    }

    @Post('verify-otp')
    async verifyOtp(@Body() dto: VerifyOtpDto) {
        await this.smsService.verifyOTP(dto.phone, dto.code);

        const jwt = await this.authService.loginOrRegisterByPhone(dto.phone, dto.email);

        return {
            status: 'OK',
            message: 'Login successfully',
            access_token: jwt.access_token,
            refresh_token: jwt.refresh_token,
        };
    }

}
