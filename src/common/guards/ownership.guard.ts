import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetId = request.params.id;

    const isAdmin = user.role === 'ADMIN';
    const isOwner = user.sub === targetId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You are not authorized to perform this action');
    }

    return true;
  }
}
