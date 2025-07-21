/* eslint-disable */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }
  async findAll() {
    return this.prisma.user.findMany();
  }
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  async update(currentUser: any, id: string, data: Partial<Prisma.UserUpdateInput>) {
    if (currentUser.role !== 'ADMIN' && currentUser.sub !== id) {
      throw new ForbiddenException('You can only update your own account');
    }
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
  async remove(currentUser: any, id: string) {
    if (currentUser.role !== 'ADMIN' && currentUser.sub !== id) {
      throw new ForbiddenException('You can only delete your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });
    return { status: 'OK', message: 'User deleted successfully' };
  }

}