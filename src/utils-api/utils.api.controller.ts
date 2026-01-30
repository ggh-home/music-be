import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UtilsApiService } from './utils.api.service';
import { NonAuth } from '../global_configs/non-auth.decorator';
import { Throttle } from 'src/global_configs/throttle.decorator';
import { ThrottleLeveCode } from 'src/enums/throttle-level-code.enum';
import * as fs from 'fs';
import path from 'path';
import { UserDecorator } from 'src/global_configs/user.decorator';
import { SuccessCode } from 'src/enums/success-code.enum';
import { UserActionDto } from './dto/user.action.dto';

@Controller('utils')
export class UtilsApiController {
  constructor(private readonly utilsApiService: UtilsApiService) { }

  @Throttle(ThrottleLeveCode.NO_LIMIT)
  @NonAuth()
  @Get('/raw-html/wechat-groups')
  async getHtmlPage(): Promise<string> {
    let htmlStr = '';
    const group = await this.utilsApiService.getWechatGroups();
    if (group === null) {
      const filePath = path.join(
        __dirname,
        '..',
        '..',
        '/public/',
        'no.valid.group.html',
      );
      htmlStr = fs.readFileSync(filePath, 'utf-8');
    } else {
      const filePath = path.join(
        __dirname,
        '..',
        '..',
        '/public/',
        'wechat.group.html',
      );
      const rawHtml = fs.readFileSync(filePath, 'utf-8');
      htmlStr = rawHtml
        .replace('$qrCodeName', group.groupName)
        .replace('$groupImg', group.groupImg);
    }

    return htmlStr;
  }

  @Post('/user-action')
  async userAction(@UserDecorator() user, @Body() userAction: UserActionDto) {
    await this.utilsApiService.saveUserAction(userAction, user);
    return SuccessCode.SUCCESS;
  }

  @Get('/user-action/count/day')
  async userActionCountOfDay(
    @UserDecorator() user,
    @Query('action') action: string,
  ) {
    return await this.utilsApiService.countByDay(action, user);
  }

  @Get('/user-action/count/hour')
  async userActionCountOfHour(
    @UserDecorator() user,
    @Query('action') action: string,
  ) {
    return await this.utilsApiService.countByHour(action, user);
  }

  @Get('/no-loss/limit')
  async limitOfNoLoss(@UserDecorator() user) {
    return await this.utilsApiService.limitOfNoLoss(user);
  }

  @Get('/music/limit')
  async limitOfMusic(@UserDecorator() user) {
    return await this.utilsApiService.limitOfMusic(user);
  }

  @Get('/sound/limit')
  async limitOfSound(@UserDecorator() user) {
    return await this.utilsApiService.limitOfSound(user);
  }

  @Get('/download/limit')
  async limitOfDownload(@UserDecorator() user) {
    return await this.utilsApiService.limitOfDownload(user);
  }

  @Get('/bookmark-soundalbum/limit')
  async limitOfBookmarkSoundAlbum(@UserDecorator() user) {
    return await this.utilsApiService.limitOfBookmarkSoundAlbum(user);
  }

  @Get('/sound-cache/limit')
  async limitOfBSoundCache(@UserDecorator() user) {
    return await this.utilsApiService.limitOfBSoundCache(user);
  }

  @Get('/user-msg')
  async getUserMsg(@UserDecorator() user) {
    return await this.utilsApiService.getUserMsg(user);
  }
}
