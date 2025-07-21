// import { Module } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { JwtModule } from '@nestjs/jwt';
// import { PassportModule } from '@nestjs/passport';
// import { JwtStrategy } from './jwt.strategy';
// import { PrismaService } from '../prisma.service';
// @Module({
//     imports: [
//         PassportModule,
//         JwtModule.register({
//             secret: process.env.JWT_SECRET,
//             signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
//         }),
//     ],
//     controllers: [AuthController],
//     providers: [AuthService, JwtStrategy, PrismaService],
// })
// export class AuthModule { }

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './google-oauth/google.strategy';
import { GoogleOauthController } from './google-oauth/google-oauth.controller';
import { GoogleOauthGuard } from './google-oauth/google-oauth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SmsService } from '../auth/sms/sms.service';
import { SmsController } from '../auth/sms/sms.controller';
import { PrismaService } from '../prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (cs: ConfigService) => ({
                secret: cs.get('JWT_SECRET'),
                signOptions: { expiresIn: '15m' },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController, GoogleOauthController, SmsController],
    providers: [AuthService, GoogleStrategy, GoogleOauthGuard, SmsService, PrismaService, JwtStrategy],
})
export class AuthModule { }
