/* eslint-disable */
import {
    Controller,
    Post,
    Body,
    Req,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma.service'; // đảm bảo đúng đường dẫn
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('register')
    register(@Body() body: RegisterDto) {
        return this.authService.register(body.email, body.password, body.name);
    }

    @Post('login')
    async login(
        @Body() body: { email: string; password: string },
        @Res({ passthrough: true }) res: Response,
    ) {
        const { access_token, refresh_token } = await this.authService.login(
            body.email,
            body.password,
        );

        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: true, // set to true in production with HTTPS
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return { access_token };
    }

    async loginOAuth(user: any) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });
        await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken: refresh_token } });
        return { access_token, refresh_token };
    }

    async findOrCreateFromGoogle(email: string, name: string, googleId: string) {
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await this.prisma.user.create({ data: { email, name, password: '', googleId } });
        }
        return user;
    }

    @Post('refresh-token')
    async refreshToken(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refresh_token = req.cookies?.refresh_token;
        if (!refresh_token) {
            throw new UnauthorizedException('Refresh token required');
        }

        const { access_token, refresh_token: new_refresh_token } =
            await this.authService.refreshToken(refresh_token);

        res.cookie('refresh_token', new_refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return { access_token };
    }

    @Post('logout')
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refresh_token = req.cookies?.refresh_token;
        if (refresh_token) {
            const payload = this.jwtService.decode(refresh_token) as { sub: string };
            if (payload?.sub) {
                await this.authService.revokeToken(payload.sub);
            }
        }

        res.clearCookie('refresh_token');

        return { message: 'Logged out successfully' };
    }

}
