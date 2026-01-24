import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CustomBadRequestException } from './custom.exception';
import { ErrorCode } from 'src/enums/error-code.enum';
import { UserService } from 'src/user/user.service';
import { UserStatusCode } from 'src/enums/user-status-code.enum';
import { formatDate } from 'src/utils/my.utils';
import { ThrottleLeveCode } from 'src/enums/throttle-level-code.enum';
import { EnvCode } from 'src/enums/env-code.enum';

@Injectable()
export class ThrottleGuard implements CanActivate {
  private requestsMap: Map<string, { count: number; startTime: number }> =
    new Map();

  // 单位秒，注意timeWindow需要>=60
  private timeWindow: number = 60 * 60; // 1个小时
  private importantApiLimit =
    process.env.NODE_ENV === EnvCode.DEV ? 60 * 5 : 60 * 1;
  private normalApiLimit = 60 * 30;

  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    //const res = context.switchToHttp().getResponse();

    // 获取请求的路由标识
    const handler = context.getHandler();
    let throttleConfig = this.reflector.get<{
      level: ThrottleLeveCode;
    }>('throttle', handler);
    if (!throttleConfig) {
      // 默认使用
      throttleConfig = { level: ThrottleLeveCode.DEFAULT };
    }
    if (throttleConfig.level === ThrottleLeveCode.NO_LIMIT) {
      console.log('api配置了不限制访问，不检测');
      return true;
    }
    // 请求限制 重要api 10秒5次 普通api 10秒10次
    const limit =
      throttleConfig.level === ThrottleLeveCode.STRICT
        ? this.importantApiLimit
        : this.normalApiLimit;
    const key = `${req.user?.token}-${req.route.path}`; // 唯一标识（IP + 路径）
    // todo 已经封禁的账号，不需要判断次数，直接返回封禁时间
    const now = Date.now();
    if (
      req.user.status === UserStatusCode.BLOCKED &&
      req.user.blockedToTime > now
    ) {
      // this.requestsMap.set(key, {
      //   count: this.requestsMap.has(key)
      //     ? this.requestsMap.get(key).count + 1
      //     : 1,
      //   startTime: now,
      // });
      // const user = await this.userService.updateStatus(
      //   req.user.id,
      //   UserStatusCode.BLOCKED,
      //   this.requestsMap.get(key).count * Math.ceil(this.timeWindow / 60),
      // );

      throw new CustomBadRequestException({
        errCode: ErrorCode.USER_STATUS_BLOCKED,
        message:
          '账号已被临时封禁！\n解封时间 ' +
          formatDate(req.user.blockedToTime, 'YY年MM月DD日 HH点mm分'),
      });
    }

    if (this.requestsMap.has(key)) {
      const record = this.requestsMap.get(key);
      record.count++; // 增加请求次数
      const elapsedTime = (now - record.startTime) / 1000;
      if (elapsedTime < this.timeWindow) {
        // 窗口期内，检查是否超出限制
        if (record.count >= limit) {
          // 请求次数超过限制的2倍开始封禁
          if (Math.max(0, record.count - 2 * limit) > 0) {
            // 重置计数器，如果封禁后继续请求，则直接将非法请求次数作为封禁分钟数累加
            record.count = 1;
            record.startTime = now;
            const user = await this.userService.updateStatus(
              req.user.id,
              UserStatusCode.BLOCKED,
              record.count * Math.ceil(this.timeWindow / 60),
            );

            throw new CustomBadRequestException({
              errCode: ErrorCode.USER_STATUS_BLOCKED,
              message:
                '账号已被临时封禁！\n解封时间 ' +
                formatDate(user.blockedToTime, 'YY年MM月DD日 HH点mm分'),
            });
          } else if (Math.max(0, record.count - 1.5 * limit) > 0) {
            throw new CustomBadRequestException({
              errCode: ErrorCode.TOO_MANY_REQUEST,
              message: `请休息 ${Math.ceil(this.timeWindow / 60)} 分钟！\n继续请求会触发临时封禁~`,
            });
          } else {
            throw new CustomBadRequestException({
              errCode: ErrorCode.TOO_MANY_REQUEST,
            });
          }
        }
      } else {
        // 窗口期外，重置计数器
        record.count = 1;
        record.startTime = now;
      }
    } else {
      // 第一次请求，初始化计数器
      this.requestsMap.set(key, { count: 1, startTime: now });
    }

    return true; // 请求通过
  }
}
