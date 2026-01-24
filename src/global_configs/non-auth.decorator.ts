import { SetMetadata } from '@nestjs/common';

// 自定义装饰器，用于标记无需校验的路由
export const NonAuth = () => SetMetadata('non-auth', true);
