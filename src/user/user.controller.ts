/* eslint-disable */
import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { OwnershipGuard } from '../common/guards/ownership.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('getAll')
  @Roles('ADMIN')
  findAll() {
    return this.userService.findAll();
  }

  @Get('getDetail/:id')
  @Roles('USER', 'ADMIN')
  @UseGuards(OwnershipGuard) // 👈 kiểm tra ADMIN hoặc chính chủ
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch('update/:id')
  @Roles('USER', 'ADMIN')
  @UseGuards(OwnershipGuard)
  update(@Req() req, @Param('id') id: string, @Body() data: any) {
    return this.userService.update(req.user, id, data);
  }

  @Delete('delete/:id')
  @Roles('USER', 'ADMIN')
  @UseGuards(OwnershipGuard)
  remove(@Req() req, @Param('id') id: string) {
    return this.userService.remove(req.user, id);
  }
}
