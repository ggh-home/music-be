import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CustomBadRequestException } from '../global_configs/custom.exception';
import { ErrorCode } from '../enums/error-code.enum';
import { SuccessCode } from '../enums/success-code.enum';
import { generateMd5Hash } from '../utils/md5.util';
import { UserResponseDto } from './dto/user.response.dto';
import { convertDto } from '../utils/convert-dto.util';
import { randomUUID } from 'crypto';
import dayjs, { Dayjs } from 'dayjs';
import { UserStatusCode } from 'src/enums/user-status-code.enum';

import { dateTimeBeforeNow, formatDate } from 'src/utils/my.utils';
import { UserLogs } from './entities/user.logs.entity';

@Injectable()
export class UserService {
  async currentUserInfo(user: User): Promise<UserResponseDto> {
    return convertDto(UserResponseDto, user);
  }

  async updateVip(user: User, weixinId: string): Promise<UserResponseDto> {
    // 未绑定
    if (user.weiXin === null || user.weiXin === undefined) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.USER_NOT_BIND_WX,
      });
    }

    // 微信Id不匹配
    if (user.weiXin !== weixinId) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.USER_WX_NOT_MATCH,
      });
    }

    // 绑定了，但用过了
    if (user.updateVipByWx === 'YES') {
      throw new CustomBadRequestException({
        errCode: ErrorCode.USER_BEEN_UPDATED,
      });
    }

    const currentDayjs: Dayjs = dayjs(); // Dayjs 类型
    const newDate: Dayjs = currentDayjs.add(7, 'day'); // Dayjs 类型
    // 符合要求，设置为VIP
    user.updateVipByWx = 'YES';
    user.vipToTime = newDate.toDate();
    user.userType = 'VIP';
    await this.userRepository.save(user);
    return convertDto(UserResponseDto, user);
  }

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserLogs)
    private readonly userLogsRepository: Repository<UserLogs>,
  ) {}

  async create(user: Partial<User>): Promise<User> {
    const { userName, password } = user;
    const existUser = await this.userRepository.findOne({
      where: { userName },
    });
    if (existUser) {
      throw new CustomBadRequestException({ errCode: ErrorCode.USER_EXIST });
    }
    user.password = generateMd5Hash(userName + password);
    const newUser = this.userRepository.create(user);
    const currentDayjs: Dayjs = dayjs(); // Dayjs 类型
    const threeMonthsLaterDayjs: Dayjs = currentDayjs.add(3, 'month'); // Dayjs 类型
    const threeMonthsLaterDate: Date = threeMonthsLaterDayjs.toDate(); // 转换为 Date 类型
    newUser.expiredTime = threeMonthsLaterDate;
    newUser.status = UserStatusCode.ACTIVE;
    return this.userRepository.save(newUser);
  }

  async login(user: Partial<User>): Promise<UserResponseDto> {
    const { userName, password } = user;
    const existUser = await this.userRepository.findOne({
      where: { userName },
    });
    if (!existUser) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.USER_NOT_EXITS,
      });
    }
    if (existUser.password !== generateMd5Hash(userName + password)) {
      throw new CustomBadRequestException({ errCode: ErrorCode.PWD_NOT_MATCH });
    }
    console.log(
      `existUser:${JSON.stringify(existUser)} new Date:${new Date()}`,
    );
    if (existUser.status === UserStatusCode.DELETED) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.USER_STATUS_DELETED,
      });
    }

    const updatedUser = await this.updateUserStatus(existUser);
    console.log(`updatedUser：${JSON.stringify(updatedUser)}`);
    // 封禁
    if (updatedUser.status === UserStatusCode.BLOCKED) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.USER_STATUS_BLOCKED,
        message:
          '账号已被临时封禁！\n解封时间 ' +
          formatDate(updatedUser.blockedToTime, 'YY年MM月DD日 HH点mm分'),
      });
    }

    // 过期
    if (updatedUser.status === UserStatusCode.EXPIRED) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.USER_STATUS_EXPIRED,
      });
    }

    updatedUser.token = `${updatedUser.id}-${generateMd5Hash(userName)}-${randomUUID()}`;
    await this.userRepository.save(updatedUser);

    return convertDto(UserResponseDto, updatedUser);
  }

  async updateUserStatus(user: User): Promise<User> {
    const updatedUser = { ...user } as User;
    if (updatedUser.expiredTime) {
      updatedUser.status = dateTimeBeforeNow(updatedUser.expiredTime)
        ? UserStatusCode.EXPIRED
        : UserStatusCode.ACTIVE;
      if (updatedUser.status === UserStatusCode.EXPIRED) {
        return await this.userRepository.save(updatedUser);
      }
    }

    if (updatedUser.blockedToTime) {
      updatedUser.status = !dateTimeBeforeNow(updatedUser.blockedToTime)
        ? UserStatusCode.BLOCKED
        : UserStatusCode.ACTIVE;
      if (updatedUser.status === UserStatusCode.ACTIVE) {
        updatedUser.blockedToTime = null;
      }
      return await this.userRepository.save(updatedUser);
    }

    return updatedUser;
  }

  async logout(token: string): Promise<string> {
    const existUser = await this.userRepository.findOne({
      where: { token },
    });
    if (existUser) {
      existUser.token = null;
      await this.userRepository.save(existUser);
    }
    return SuccessCode.SUCCESS;
  }

  async updateStatus(
    userId: number,
    status: UserStatusCode,
    addBlockedMins?: number,
  ): Promise<User> {
    const existUser = await this.userRepository.findOne({
      where: { id: userId },
    });
    existUser.status = status;
    if (addBlockedMins !== undefined && addBlockedMins > 0) {
      const currentBlockedToTime: Dayjs =
        !existUser.blockedToTime ||
        dayjs(existUser.blockedToTime).isBefore(dayjs())
          ? dayjs()
          : dayjs(existUser.blockedToTime);

      const newBlockedTime = currentBlockedToTime
        .add(addBlockedMins, 'minute')
        .toDate();
      existUser.blockedToTime = newBlockedTime;
    }
    console.log(`更新用户数据:${JSON.stringify(existUser)}`);
    return await this.userRepository.save(existUser);
  }

  async addLogs(
    userId: number,
    userName: string,
    logs: Array<Log>,
    brand: string,
    deviceModel: string,
    systemVersion: string,
  ): Promise<void> {
    // 将传入的日志数据转换为 UserLogs 实体对象
    const userLogs = logs.map(log => {
      const userLog = this.userLogsRepository.create();
      userLog.userId = userId;
      userLog.level = log.level;
      userLog.action = log.action;
      userLog.log = log.message;
      userLog.appVersion = log.version;
      userLog.brand = brand;
      userLog.systemVersion = systemVersion;
      userLog.deviceModel = deviceModel;
      return userLog;
    });
    await this.userLogsRepository.save(userLogs);
  }
}
