/*
 * @Author: gouguohua gh0410
 * @Date: 2025-05-30 11:22:16
 * @LastEditors: gouguohua gh0410
 * @LastEditTime: 2025-11-13 12:56:15
 * @FilePath: /music-be/src/main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './global_configs/response.interceptor';
import { GlobalExceptionFilter } from './global_configs/global-exception.filter';

import { DateInterceptor } from './global_configs/date.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 剔除 DTO 类中未定义的属性
      forbidNonWhitelisted: true, // 如果请求体中有未定义的属性，则抛出错误
      transform: true, // 自动将请求中的 JSON 转换为 DTO 实例
    }),
  );
  // 全局拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalInterceptors(new DateInterceptor());

  app.useGlobalFilters(new GlobalExceptionFilter()); // 启用全局异常过滤器

  await app.listen(process.env.PORT ?? 6000);
}
bootstrap();
