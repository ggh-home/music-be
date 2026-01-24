import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ErrorMessages } from '../enums/error-code.enum';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  catch(exception: any, host: ArgumentsHost) {
    //this.logger.error(`Unknown Exception: ${exception}`);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const errCode = exceptionResponse?.['errCode'] || 'UNKNOWN_ERROR';
    const message =
      exceptionResponse?.['message'] || ErrorMessages[errCode] || '未知错误';

    const errorResponse = {
      statusCode: status,
      errCode: errCode,
      errorMessage: message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      body: request.body,
      query: request.query,
      params: request.params,
      headers: request.headers,
      errorStack: exception.stack || null,
    };

    // 打印详细错误信息到控制台
    this.logger.error(errorResponse);

    response.status(status).json({
      statusCode: status,
      message: message,
      errCode: errCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
