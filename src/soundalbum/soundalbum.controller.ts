import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SoundalbumService } from './soundalbum.service';
import { UserDecorator } from 'src/global_configs/user.decorator';
import { BookmarkSoundAlbumDto } from './dto/bookmark.soundalbum.dto';
import { SuccessCode } from 'src/enums/success-code.enum';
import { SoundPlayHistory } from './entities/sound.play.history.entity';
import { PlayHistoryDto } from './dto/play.history.dto';
import { ImportSounds } from './dto/import-sounds.dto';

@Controller('soundalbum')
export class SoundalbumController {
  constructor(private readonly soundalbumService: SoundalbumService) {}

  // 添加收藏
  @Post('/bookmark')
  async bookmark(
    @UserDecorator() user,
    @Body() BookmarkSoundAlbumDto: BookmarkSoundAlbumDto,
  ) {
    await this.soundalbumService.bookmarkSoundAlbum(
      BookmarkSoundAlbumDto,
      user.id,
    );
    return SuccessCode.SUCCESS;
  }

  // 取消收藏
  @Post('/un-bookmark')
  async unbookmark(
    @UserDecorator() user,
    @Body() BookmarkSoundAlbumDto: BookmarkSoundAlbumDto,
  ) {
    await this.soundalbumService.unBookmarkSoundAlbum(
      BookmarkSoundAlbumDto,
      user.id,
    );
    return SuccessCode.SUCCESS;
  }

  // 获取列表以及详情
  @Get('/all')
  async getAll(@UserDecorator() user) {
    return this.soundalbumService.getAllSoundAlbums(user.id);
  }

  // todo 保存更新播放进度
  @Post('/play-history/save')
  async savePlayHistory(
    @UserDecorator() user,
    @Body() playHistoryDto: PlayHistoryDto,
  ) {
    await this.soundalbumService.savePlayHistory(playHistoryDto, user.id);
    return SuccessCode.SUCCESS;
  }

  // todo 获取播放进度

  @Get('/play-history/all/:platform/:soundAlbumId')
  async getAllPlayHistory(
    @UserDecorator() user,
    @Param('platform') platform: string,
    @Param('soundAlbumId') soundAlbumId: string,
  ) {
    return this.soundalbumService.getAllPlayHistory(
      platform,
      soundAlbumId,
      user.id,
    );
  }

  // todo 导入喜马拉雅分享
  @Post('/import-sounds')
  async importSounds(
    @UserDecorator() user,
    @Body() importSounds: ImportSounds,
  ) {
    await this.soundalbumService.importSounds(importSounds, user);
    return SuccessCode.SUCCESS;
  }

  // 尝试获取该声音专辑的缓存信息
  @Get('/cache-detail/:platform/:soundAlbumId')
  async getCacheDetail(
    @UserDecorator() user,
    @Param('platform') platform: string,
    @Param('soundAlbumId') soundAlbumId: string,
  ) {
    return this.soundalbumService.getCacheDetail(
      platform,
      soundAlbumId,
      user.id,
    );
  }

  // 尝试获取该声音专辑的缓存信息
  @Post('/cache/:platform/:soundId')
  async cacheSound(
    @UserDecorator() user,
    @Param('platform') platform: string,
    @Param('soundId') soundId: string,
  ) {
    return this.soundalbumService.cacheSound(platform, soundId, user.id);
  }
}
