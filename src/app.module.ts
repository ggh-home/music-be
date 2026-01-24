/*
 * @Author: gouguohua gh0410
 * @Date: 2025-06-01 01:58:18
 * @LastEditors: gouguohua gh0410
 * @LastEditTime: 2025-11-29 17:31:00
 * @FilePath: /music-be/src/app.module.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './global_configs/auth.guard';
import { User } from './user/entities/user.entity';
import { TokenService } from './user/token.service';
import { SearchModule } from './search/search.module';
import { PlaylistModule } from './playlist/playlist.module';
import { ThrottleGuard } from './global_configs/throttle.guard';
import { UserService } from './user/user.service';
import { UserLogs } from './user/entities/user.logs.entity';
import { UtilsApiModule } from './utils-api/utils.api.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SoundalbumModule } from './soundalbum/soundalbum.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '172.25.11.213',
      // host: 'host.docker.internal', // docker替换为数据库地址
      // host: 'localhost',//本地使用
      port: 3306, // MySQL 端口
      username: 'root', // 数据库用户名
      password: 'root', // 数据库密码 
      database: 'music_be', // 数据库名称
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // 自动加载实体
      synchronize: true, // 不自动同步表结构
      //subscribers: [TimezoneSubscriber], // 注册订阅器
    }),
    UserModule, // 导入用户模块
    TypeOrmModule.forFeature([User, UserLogs]),
    SearchModule,
    PlaylistModule,
    UtilsApiModule,
    SoundalbumModule,
  ],
  providers: [
    UserService,
    TokenService, // TokenService 作为依赖注入
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // 全局注册 AuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: ThrottleGuard,
    },
  ],
})
// eslint-disable-next-line prettier/prettier
export class AppModule { }
