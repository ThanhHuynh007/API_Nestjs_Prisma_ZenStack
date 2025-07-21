// src/auth/sms/dto/verify-otp.dto.ts
import { IsPhoneNumber, IsString, Length, IsEmail } from 'class-validator';

export class VerifyOtpDto {
  @IsPhoneNumber('US') // hoặc undefined nếu không chỉ định quốc gia
  phone: string;

  @IsString()
  @Length(4, 6)
  code: string;

  @IsEmail()
  email: string;
}
