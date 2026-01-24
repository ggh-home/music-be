import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UtilsWechatGroup } from './entities/utils.wechat.group.entity';
import { UserAction } from './entities/user.action.entity';
import { User } from 'src/user/entities/user.entity';
import dayjs from 'dayjs';
import { UserActionDto } from './dto/user.action.dto';
import { Config } from './entities/config.entity';
import { ConfigKeyCode, ConfigValueCode } from 'src/enums/config.key.code.enum';
import { UserMsg } from './entities/user.msg.entity';

@Injectable()
export class UtilsApiService {
  constructor(
    @InjectRepository(UtilsWechatGroup)
    private readonly utilsWechatGroupRepository: Repository<UtilsWechatGroup>,
    @InjectRepository(UserAction)
    private readonly userActionRepository: Repository<UserAction>,
    @InjectRepository(Config)
    private readonly configRepository: Repository<Config>,
    @InjectRepository(UserMsg)
    private readonly userMsgRepository: Repository<UserMsg>,
  ) {}

  async getUserMsg(user: User) {
    const currentUserType =
      user.userType === null ||
      user.userType === undefined ||
      user.userType?.toUpperCase() === 'FREE'
        ? 'FREE'
        : 'VIP';

    const userMsgs = await this.userMsgRepository.find({
      order: { createTime: 'ASC' },
    });
    if (userMsgs === null || userMsgs === undefined) {
      return [];
    }
    const userMsgResults = [];
    for (const userMsg of userMsgs) {
      if (
        userMsg.targetUserType !== 'ALL' &&
        userMsg.targetUserType !== currentUserType
      ) {
        // 用户类型不符合，跳过本条消息
        continue;
      }

      if (userMsg.targetUserIds.toUpperCase() === 'ALL') {
        userMsgResults.push(userMsg);
        continue;
      }
      if (userMsg.targetUserIds.split(',').includes(String(user.id))) {
        userMsgResults.push(userMsg);
      }
    }
    return userMsgResults;
  }

  async limitOfNoLoss(user: User) {
    const defaultConfigValue = 10;
    let config;
    if (user.userType?.toUpperCase() === 'VIP') {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_NO_LOSS_VIP },
      });
    } else {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_NO_LOSS_FREE },
      });
    }
    if (config === null || config === undefined) {
      return defaultConfigValue; // 默认值
    }
    return config.configValue;
  }

  async limitOfSound(user: User) {
    const defaultConfigValue = 5;
    let config;
    if (user.userType?.toUpperCase() === 'VIP') {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_SOUND_VIP },
      });
    } else {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_SOUND_FREE },
      });
    }
    if (config === null || config === undefined) {
      return defaultConfigValue; // 默认值
    }
    return config.configValue;
  }

  async limitOfMusic(user: User) {
    const defaultConfigValue = 20;
    let config;
    if (user.userType?.toUpperCase() === 'VIP') {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_MUSIC_VIP },
      });
    } else {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_MUSIC_FREE },
      });
    }
    if (config === null || config === undefined) {
      return defaultConfigValue; // 默认值
    }
    return config.configValue;
  }

  async limitOfDownload(user: User) {
    const defaultConfigValue = 10;
    let config;
    if (user.userType?.toUpperCase() === 'VIP') {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_DOWNLOAD_VIP },
      });
    } else {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_DOWNLOAD_FREE },
      });
    }
    if (config === null || config === undefined) {
      return defaultConfigValue; // 默认值
    }
    return config.configValue;
  }

  async limitOfBookmarkSoundAlbum(user: User) {
    const defaultConfigValue = 5;
    let config;
    if (user.userType?.toUpperCase() === 'VIP') {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_BOOKMARK_SOUND_ALBUM_VIP },
      });
    } else {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_BOOKMARK_SOUND_ALBUM_FREE },
      });
    }
    if (config === null || config === undefined) {
      return defaultConfigValue; // 默认值
    }
    return config.configValue;
  }

  async limitOfBSoundCache(user: User) {
    const defaultConfigValue = 20;
    let config;
    if (user.userType?.toUpperCase() === 'VIP') {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_SOUND_CACHE_VIP },
      });
    } else {
      config = await this.configRepository.findOne({
        where: { configKey: ConfigKeyCode.LIMIT_SOUND_CACHE_FREE },
      });
    }
    if (config === null || config === undefined) {
      return defaultConfigValue; // 默认值
    }
    return config.configValue;
  }

  async getConfigValue(configKey: ConfigKeyCode) {
    const result = await this.configRepository.findOne({
      where: { configKey: configKey },
    });
    return result?.configValue;
  }

  async updateConfigValue(
    configKey: ConfigKeyCode,
    configValue: ConfigValueCode | string,
  ) {
    let existResult = await this.configRepository.findOne({
      where: { configKey: configKey },
    });
    if (existResult === null || existResult === undefined) {
      existResult = await this.configRepository.create();
      existResult.configKey = configKey;
    }
    existResult.configValue = configValue;
    await this.configRepository.save(existResult);
  }

  async getWechatGroups(): Promise<UtilsWechatGroup> {
    const group = await this.utilsWechatGroupRepository
      .createQueryBuilder('data')
      .where('data.scanCount < data.maxCount')
      .andWhere('data.expiredTime > :currentTime', { currentTime: new Date() }) // 当前时间
      .orderBy('data.order', 'ASC')
      .take(1)
      .getOne();
    if (group === null) {
      return null;
    }
    group.scanCount++;
    this.utilsWechatGroupRepository.save(group);
    return group;
  }

  async saveUserAction(userAction: UserActionDto, user: User) {
    const newUserAction = this.userActionRepository.create(userAction);
    newUserAction.userId = user.id;
    newUserAction.createdDate = dayjs().format('YYYY-MM-DD');
    newUserAction.createdHour = String(dayjs().hour());
    await this.userActionRepository.save(newUserAction);
  }

  async countByDay(action: string, user: User) {
    const results = await this.userActionRepository.find({
      where: {
        userId: user.id,
        action: action,
        createdDate: dayjs().format('YYYY-MM-DD'),
      },
    });
    return results.length;
  }

  async countByHour(action: string, user: User) {
    const results = await this.userActionRepository.find({
      where: {
        userId: user.id,
        action: action,
        createdDate: dayjs().format('YYYY-MM-DD'),
        createdHour: String(dayjs().hour()),
      },
    });
    return results.length;
  }
}
