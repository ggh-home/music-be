import { Controller, Get, Param, Query, Body, Post } from '@nestjs/common';
import { SearchService } from './search.service';
import { NonAuth } from 'src/global_configs/non-auth.decorator';
import { UserDecorator } from 'src/global_configs/user.decorator';
import { CustomBadRequestException } from 'src/global_configs/custom.exception';
import { ErrorCode } from 'src/enums/error-code.enum';
import { Throttle } from 'src/global_configs/throttle.decorator';
import { ThrottleLeveCode } from 'src/enums/throttle-level-code.enum';

import { SetCookieDto } from './dto/set.cookie.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // GET /music/:keyWord 搜索音乐
  // 返回 platform songId songTitle singerId singerName albumId isBookMarked
  @Get('/music/:keyWord')
  async searchMusic(
    @UserDecorator() user,
    @Param('keyWord') keyWord: string,
    @Query('pageNum') pageNum: number = 1,
  ) {
    return this.searchService.searchMusic(keyWord, pageNum);
  }

  // GET /singer/:keyWord 搜索歌手
  // 返回 platform singerId singerName countOfSong singerImg
  @Get('/singer/:keyWord')
  async searchSinger(
    @UserDecorator() user,
    @Param('keyWord') keyWord: string,
    @Query('pageNum') pageNum: number = 1,
  ) {
    return this.searchService.searchSinger(keyWord, pageNum);
  }

  // 搜索声音专辑
  @Get('/sound-album/:keyWord')
  async searchAlbumSound(
    @UserDecorator() user,
    @Param('keyWord') keyWord: string,
    @Query('pageNum') pageNum: number = 1,
  ) {
    return this.searchService.searchAlbumSound(keyWord, pageNum);
  }

  // 获取专辑的声音列表
  @Post('/sounds/:platform')
  async searchSoundList(
    @UserDecorator() user,
    @Param('platform') platform,
    @Query('sort') sort: SortType,
    @Query('pageNum') pageNum: number = 1,
    @Query('pageSize') pageSize: number = 15,
    @Body() soundAlbumItem: SoundAlbum,
  ) {
    // console.log(
    //   `获取到 albumId:${albumId} pageNum：${pageNum} pageSize：${pageSize}`,
    // );
    return this.searchService.searchSoundList(
      platform,
      soundAlbumItem,
      sort,
      pageNum,
      pageSize,
    );
  }

  // GET /playlist/:keyWord 搜索歌单
  // 返回 platform playlistName playlistId playlistImg countOfSong desc

  // @NonAuth()
  // @Get('/:searchType/:keyWord')
  // async searchMusic(
  //   @Param('searchType') searchType: string,
  //   @Param('keyWord') keyWord: string,
  // ) {
  //   console.log('searchType' + searchType + 'keyWord' + keyWord);
  //   if (searchType === 'song') {
  //     const musicResult = await searchMusic(keyWord, 1);
  //     console.log('音乐搜索结果：', musicResult);
  //     return musicResult.data;
  //   }
  //   if (searchType === 'singer') {
  //     const result = await searchArtist(keyWord, 1);
  //     console.log('歌手搜索结果：', result);
  //     return result.data;
  //   }

  //   if (searchType === 'playList') {
  //     const result = await searchMusicSheet(keyWord, 1);
  //     console.log('歌单搜索结果：', result);
  //     return result.data;
  //   }
  //   return [
  //     {
  //       id: 1,
  //       url: 'http://192.168.0.150:3000/search/music/1', // Load media from the app bundle
  //       title: '十年',
  //       artist: '陈奕迅',
  //     },
  //   ];
  // }

  @Get('/artist/songs/:platform/:singerId')
  async getArtistSongs(
    @Param('platform') platform,
    @Param('singerId') singerId,
    @Query('pageNum') pageNum = 1,
  ) {
    return this.searchService.searchSingerSongs(platform, singerId, pageNum);
  }

  @Get('/artist/albums/:platform/:singerId')
  async getArtistAlbums(
    @Param('platform') platform,
    @Param('singerId') singerId,
    @Query('pageNum') pageNum = 1,
  ) {
    return this.searchService.searchSingerAlbums(platform, singerId, pageNum);
  }

  @Get('/album/detail/:platform/:albumId')
  async getAlbumDetail(@Param('platform') platform, @Param('albumId') albumId) {
    const result = await this.searchService.searchAlumDetail(platform, albumId);
    console.log('专辑搜索结果：', result);
    return result;
  }

  @Get('/playlist/:keyWord')
  async searchPlaylist(
    @Param('keyWord') keyWord: string,
    @Query('pageNum') pageNum: number = 1,
  ) {
    return this.searchService.searchPlaylist(keyWord, pageNum);
  }

  @Get('/playlist/songs/:platform/:playListId/:pageNum?/:pageSize?')
  async getPlayList(
    @Param('platform') platform,
    @Param('playListId') playListId,
    @Param('pageNum') pageNum: number = 1,
    @Param('pageSize') pageSize: number = 15,
  ) {
    return this.searchService.searchPlaylistSongs(
      platform,
      playListId,
      pageNum,
      pageSize,
    );
  }

  @Throttle(ThrottleLeveCode.STRICT)
  @Get('/music/detail/:platform/:songId')
  async getMusicDetial(
    @Param('platform') platform,
    @Param('songId') songId: string,
    @Query('level') level: QQLevel | WyyLevel,
  ) {
    let result = { songImg: '' };
    try {
      result = await this.searchService.getMusicDetail(platform, songId, level);
    } catch (err) {
      console.log(err);
    }
    console.log(`音乐连接获取结果：${JSON.stringify(result)}`);
    return result;
  }

  @Get('/sound/detail/:platform/:soundId')
  async getSoundDetial(
    @Param('platform') platform,
    @Param('soundId') soundId: string,
  ) {
    let result = { songImg: '' };
    try {
      result = await this.searchService.getSoundDetail(platform, soundId);
    } catch (err) {
      console.log(err);
    }
    console.log(`声音链接获取结果：${JSON.stringify(result)}`);
    return result;
  }

  @NonAuth()
  @Throttle(ThrottleLeveCode.NO_LIMIT)
  @Post('/music/cookie/set')
  async setCookie(@Body() setCookieDto: SetCookieDto) {
    if (setCookieDto.passWord !== '3565759@bbk') {
      throw new CustomBadRequestException({ errCode: ErrorCode.FORBIDDEN });
    }
    return await this.searchService.setCookie(
      setCookieDto.platform,
      setCookieDto.cookie,
    );
  }
}
