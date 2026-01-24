import { plainToInstance, ClassConstructor } from 'class-transformer';

export function convertDto<T, V>(cls: ClassConstructor<T>, plain: V): T {
  return plainToInstance(cls, plain, {
    excludeExtraneousValues: true, // 默认排除未定义的字段
  });
}
