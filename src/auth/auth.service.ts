/* eslint-disable */
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }
    async register(email: string, password: string, name: string) {
        try {
            const existingUser = await this.prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                throw new ConflictException('Email is already in use');
            }

            const hashed = await bcrypt.hash(password, 10);
            return await this.prisma.user.create({
                data: { email, password: hashed, name }, // 👈 include name
            });
        } catch (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email, role: user.role };

        const access_token = this.jwtService.sign(payload, { expiresIn: '30s' });
        const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

        // Lưu refresh_token vào DB (user table hoặc riêng bảng) để quản lý
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refresh_token },
        });

        return {
            status: 'OK',
            message: 'Login successfully',
            access_token,
        };
    }

}