import { SetMetadata } from '@nestjs/common';
import { ThrottleLeveCode } from 'src/enums/throttle-level-code.enum';

// 定义限流配置
export const Throttle = (level: ThrottleLeveCode) =>
  SetMetadata('throttle', { level });
