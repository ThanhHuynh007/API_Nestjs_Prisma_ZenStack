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
            const createUser = await this.prisma.user.create({
                data: { email, password: hashed, name }, // 👈 include name
            });

            return {
                status: "Ok",
                message: "Create account success",
                data: createUser
            }
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

        const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

        // Lưu refresh_token vào DB (user table hoặc riêng bảng) để quản lý
        const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        });


        return {
            status: 'OK',
            message: 'Login successfully',
            access_token,
            refresh_token,
        };
    }

    // Thêm vào AuthService

    async findOrCreateFromGoogle(email: string, name: string, googleId: string) {
        let user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    name,
                    googleId,
                    role: 'USER',
                    password: 'GOOGLE_AUTH', // placeholder, không dùng thật
                },
            });
        }

        return user;
    }


    async loginOAuth(user: any) {
        const payload = { sub: user.id, email: user.email, role: user.role };

        const access_token = this.jwtService.sign(payload, { expiresIn: '5m' });
        const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

        const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        });

        return {
            status: 'OK',
            message: 'OAuth login success',
            access_token,
            refresh_token,
        };
    }

    async loginOrRegisterByPhone(phone: string, email?: string) {
        // Kiểm tra số điện thoại đã tồn tại chưa
        const existingUserByPhone = await this.prisma.user.findUnique({ where: { phone } });
        if (existingUserByPhone) {
            // Nếu có user rồi thì trả về luôn hoặc xử lý login luôn
            const payload = { sub: existingUserByPhone.id, role: existingUserByPhone.role };

            const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
            const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

            const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
            await this.prisma.user.update({
                where: { id: existingUserByPhone.id },
                data: { refreshToken: hashedRefreshToken },
            });


            return { access_token, refresh_token };
        }

        // Nếu chưa có, tạo mới user
        const fakeEmail = email ?? `${phone}@phone.local`;

        // Kiểm tra xem email giả đã tồn tại chưa
        const existingEmailUser = await this.prisma.user.findUnique({
            where: { email: fakeEmail }
        });

        if (existingEmailUser) {
            throw new ConflictException('Email is already in use');
        }

        const hashedPassword = await bcrypt.hash(phone, 10);

        const user = await this.prisma.user.create({
            data: {
                phone,
                name: phone,
                email: fakeEmail,
                password: hashedPassword,
            },
        });

        const payload = { sub: user.id, role: user.role };

        const access_token = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

        const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        });

        return { access_token, refresh_token };
    }

    async validateRefreshToken(refreshToken: string, userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.refreshToken) return false;
        return await bcrypt.compare(refreshToken, user.refreshToken);
    }

    async revokeToken(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }

    async refreshToken(refreshToken: string) {
        try {
            // Giải mã refresh token
            const payload = this.jwtService.verify(refreshToken);

            // Lấy user theo id từ token
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            // Kiểm tra token có khớp không
            if (!user || !user.refreshToken) {
                throw new UnauthorizedException('User not found or no token');
            }

            const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
            if (!isValid) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Cấp token mới
            const newPayload = { sub: user.id, email: user.email, role: user.role };
            const access_token = this.jwtService.sign(newPayload, { expiresIn: '5m' });
            const new_refresh_token = this.jwtService.sign(newPayload, { expiresIn: '7d' });

            const hashedNewRefreshToken = await bcrypt.hash(new_refresh_token, 10);

            await this.prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: hashedNewRefreshToken },
            });

            return { access_token, refresh_token: new_refresh_token };
        } catch (err) {
            console.error('❌ Refresh token error:', err);
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

}