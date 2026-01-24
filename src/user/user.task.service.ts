import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';

import { User } from 'src/user/entities/user.entity';

@Injectable()
export class UserTaskService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Cron('*/10 * * * * *')
  async updateUserInfo() {
    console.log(`updateUserInfo开始执行`);
    const vipExpiredData = await this.userRepository
      .createQueryBuilder('data')
      .andWhere('data.vipToTime < :currentTime', { currentTime: new Date() }) // 当前时间
      .getMany();
    console.log(`查询到vip过期用户的数据：${JSON.stringify(vipExpiredData)}`);
    if (isEmpty(vipExpiredData)) {
      console.log(`updateUserInfo当前已过期的vip用户为空，任务提前退出~`);
      return;
    }

    for (const expiredUser of vipExpiredData) {
      expiredUser.userType = 'FREE';
      expiredUser.vipToTime = null;
      await this.userRepository.save(expiredUser);
      console.log(`用户${expiredUser.userName}从vip变成free`);
    }
  }
}
