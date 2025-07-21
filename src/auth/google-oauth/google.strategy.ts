import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Profile } from 'passport-google-oauth20';


@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(config: ConfigService, private authService: AuthService) {
        super({
            clientID: config.get<string>('GOOGLE_CLIENT_ID')!,
            clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET')!,
            callbackURL: config.get<string>('GOOGLE_CALLBACK_URL')!,
            scope: ['email', 'profile'],
            passReqToCallback: true,
        });


    }

    async validate(
        req: Request,
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): Promise<any> {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;

        if (!email) {
            return done(new Error('Email not found from Google profile'), false);
        }

        const user = await this.authService.findOrCreateFromGoogle(email, name, profile.id);
        done(null, user);
    }

}
