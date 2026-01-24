import { Module } from '@nestjs/common';
import { UtilsApiService } from './utils.api.service';
import { UtilsApiController } from './utils.api.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsWechatGroup } from './entities/utils.wechat.group.entity';
import { UserAction } from './entities/user.action.entity';
import { Config } from './entities/config.entity';
import { UserMsg } from './entities/user.msg.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UtilsWechatGroup, UserAction, Config, UserMsg]),
  ],
  providers: [UtilsApiService],
  controllers: [UtilsApiController],
  exports: [UtilsApiService],
})
export class UtilsApiModule {}
