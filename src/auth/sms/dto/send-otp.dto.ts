import { IsPhoneNumber } from 'class-validator';

export class SendOtpDto {
    @IsPhoneNumber('US')
    phone: string;
}
