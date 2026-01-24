import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from './api-response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // 获取 HTTP 状态码
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    const requestUrl = context.switchToHttp().getRequest().url;

    return next.handle().pipe(
      map(data => {
        // 检查URL是否包含 '/raw-html/'，如果包含，直接返回原始数据，否则进行封装
        if (requestUrl.includes('/raw-html/')) {
          return data; // 原样返回，不进行封装
        } else {
          return {
            statusCode: statusCode.toString(), // 状态码转为字符串
            result: data, // 原始的返回数据
          };
        }
      }),
    );
  }
}
