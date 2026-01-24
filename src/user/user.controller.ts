/*
 * @Author: gouguohua gh0410
 * @Date: 2025-04-20 17:22:36
 * @LastEditors: gouguohua gh0410
 * @LastEditTime: 2025-11-21 22:26:18
 * @FilePath: /music-be/src/user/user.controller.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Headers, Body, Controller, Post, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserRequestDto } from './dto/create.user.request.dto';
import { ErrorCode } from '../enums/error-code.enum';
import { CustomBadRequestException } from '../global_configs/custom.exception';
import { SuccessCode } from '../enums/success-code.enum';
import { LoginUserRequestDto } from './dto/login.user.request.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { NonAuth } from '../global_configs/non-auth.decorator';
import { Throttle } from 'src/global_configs/throttle.decorator';
import { ThrottleLeveCode } from 'src/enums/throttle-level-code.enum';
import { UserDecorator } from 'src/global_configs/user.decorator';
import { SourceTextModule } from 'vm';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @NonAuth()
  @Throttle(ThrottleLeveCode.NO_LIMIT)
  @Post('/create')
  async create(
    @Headers('deviceModel') deviceModel: string,
    @Headers('systemVersion') systemVersion: string,
    @Headers('brand') brand: string,
    @Body() user: CreateUserRequestDto,
  ): Promise<string> {
    if (user.password !== user.confirmPassword) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.REPEAT_PWD_NOT_MATCH,
      });
    }
    user.brand = brand;
    user.deviceModel = deviceModel;
    user.systemVersion = systemVersion;
    await this.userService.create(user);
    return SuccessCode.SUCCESS;
  }

  @NonAuth()
  @Throttle(ThrottleLeveCode.NO_LIMIT)
  @Post('/login')
  async login(@Body() user: LoginUserRequestDto): Promise<UserResponseDto> {
    console.log(`用户${user.userName}开始登录`);
    return this.userService.login(user);
  }

  @NonAuth()
  @Throttle(ThrottleLeveCode.NO_LIMIT)
  @Post('/logout')
  async logout(@Headers('token') token: string): Promise<string> {
    return this.userService.logout(token);
  }

  @Throttle(ThrottleLeveCode.NO_LIMIT)
  @Post('/add-logs')
  async addLogs(
    @UserDecorator() user,
    @Headers('deviceModel') deviceModel: string,
    @Headers('systemVersion') systemVersion: string,
    @Headers('brand') brand: string,
    @Body('logs') logs: Array<Log>,
  ) {
    return this.userService.addLogs(
      user.id,
      user.userName,
      logs,
      brand,
      deviceModel,
      systemVersion,
    );
  }

  @Throttle(ThrottleLeveCode.NO_LIMIT)
  @Get('/currentUserInfo')
  async currentUserInfo(@UserDecorator() user): Promise<UserResponseDto> {
    return this.userService.currentUserInfo(user);
  }

  @Throttle(ThrottleLeveCode.STRICT)
  @Post('/updateVip')
  async updateVip(
    @UserDecorator() user,
    @Query('weixinId') weixinId: string,
  ): Promise<UserResponseDto> {
    console.log(`获取到微信id：${weixinId}`);
    return this.userService.updateVip(user, weixinId);
  }
}
