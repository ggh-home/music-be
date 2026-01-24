import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';

/**
 * @User 装饰器
 * 用于从请求对象中提取 `user` 信息
 */
export const UserDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    // 获取当前的 HTTP 请求对象
    const request = ctx.switchToHttp().getRequest();
    // 从请求中返回存储的 `user` 信息
    return request.user;
  },
);
