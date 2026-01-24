import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

interface CustomError {
  errCode: string; // 规定 code 字段必须为 string
  message?: string; // 规定 message 字段必须为 string
}

export class CustomBadRequestException extends BadRequestException {
  constructor(error: CustomError) {
    super(error); // 调用父类构造函数
  }
}

export class CustomInternalServerErrorException extends InternalServerErrorException {
  constructor(error: CustomError) {
    super(error); // 调用父类构造函数
  }
}
