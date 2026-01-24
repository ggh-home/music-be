import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { TokenService } from '../user/token.service';
import { CustomBadRequestException } from './custom.exception';
import { ErrorCode } from '../enums/error-code.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector, // 用于读取元数据
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const nonAuth = this.reflector.get<boolean>(
      'non-auth',
      context.getHandler(),
    );

    // 如果路由被标记为 Public，则跳过校验
    if (nonAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // 获取请求头中的 Authorization
    const token = request.headers['token'] as string;
    if (!token) {
      throw new CustomBadRequestException({ errCode: ErrorCode.MISS_TOKEN });
    }

    // 验证 token 是否有效
    const user = await this.tokenService.validateToken(token);
    if (!user) {
      throw new CustomBadRequestException({ errCode: ErrorCode.INVALID_TOKEN });
    }

    request['user'] = user; // 将用户信息存入请求中，供后续操作使用

    return true; // 如果校验通过，则允许访问
  }
}
