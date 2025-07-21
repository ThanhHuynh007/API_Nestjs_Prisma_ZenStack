/* eslint-disable */
import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service'; // đảm bảo đúng đường dẫn

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register')
  register(@Body() body: { email: string; password: string; name: string }) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: { refresh_token: string }) {
    const { refresh_token } = body;

    if (!refresh_token) {
      throw new UnauthorizedException('Refresh token required');
    }

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refresh_token);

      // Check token trong DB
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.refreshToken !== refresh_token) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Tạo token mới
      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const access_token = this.jwtService.sign(newPayload, { expiresIn: '15m' });
      const new_refresh_token = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      // Cập nhật refresh token mới vào DB
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: new_refresh_token },
      });

      return { access_token, refresh_token: new_refresh_token };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
