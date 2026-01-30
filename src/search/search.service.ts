import { Injectable } from '@nestjs/common';
import { QQApiClint } from './client/qq.music.api.client';
import { PlatformApi } from './client/platform.api.interface';
import { XmlyApiClient } from './client/ximalaya.sound.api.client';

import { CustomBadRequestException } from 'src/global_configs/custom.exception';
import { ErrorCode } from 'src/enums/error-code.enum';
import { mixUpArrays } from 'src/utils/my.utils';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheSongs } from './entities/cache.songs.entity';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import WebDAVClient from 'src/utils/web-dav.util';
import { Cookies } from './entities/cookies.entity';
import { WyyApiClient } from './client/wyy.music.api.client';

import { isEmpty } from 'lodash';
import { CacheSounds } from '../soundalbum/entities/cache.sound.entity';
import { CacheSoundAlbums } from 'src/soundalbum/entities/cache.sound.albums.entity';
import { ThirdPlatformType } from 'src/playlist/enums/platform-type.enum';
import { MusicLevelCode } from 'src/enums/music-level-code.enum';
import { UtilsApiService } from 'src/utils-api/utils.api.service';
import { ConfigKeyCode, ConfigValueCode } from 'src/enums/config.key.code.enum';

@Injectable()
export class SearchService {
  private readonly platforms: PlatformApi[] = [];

  constructor(
    private readonly utilsApiSearvice: UtilsApiService,
    @InjectRepository(CacheSongs)
    private readonly cacheSongsRepository: Repository<CacheSongs>,
    @InjectRepository(CacheSounds)
    private readonly cacheSoundsRepository: Repository<CacheSounds>,
    @InjectRepository(CacheSoundAlbums)
    private readonly cacheSoundAlbumsRespository: Repository<CacheSoundAlbums>,
    @InjectRepository(Cookies)
    private readonly cookiesRepository: Repository<Cookies>,
  ) {
    this.platforms.push(new QQApiClint());
    this.platforms.push(new WyyApiClient());
    this.platforms.push(new XmlyApiClient(utilsApiSearvice));
  }

  async searchMusic(keyWord, pageNum): Promise<Array<Song>> {
    const promises = this.platforms.map(platform =>
      platform.searchMusic(keyWord, pageNum),
    );
    const results = await Promise.all(promises);
    return mixUpArrays(results);
  }

  async searchSinger(keyWord, pageNum): Promise<Array<Singer>> {
    const promises = this.platforms.map(platform =>
      platform.searchSinger(keyWord, pageNum),
    );
    return mixUpArrays(await Promise.all(promises));
  }

  async searchAlbumSound(keyWord, pageNum): Promise<Array<SoundAlbum>> {
    const promises = this.platforms.map(platform =>
      platform.searchSoundAlbum(keyWord, pageNum),
    );
    return mixUpArrays(await Promise.all(promises));
  }

  async generateRandomArray() {
    // 创建一个包含 1 到 3 的数组
    const array = [1, 2, 3];

    // 使用 Fisher-Yates 洗牌算法随机打乱数组
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // 交换元素
    }

    return array;
  }

  async getCurrentVipCookie() {
    const cookie = await this.utilsApiSearvice.getConfigValue(
      ConfigKeyCode.XMLY_VIP_COOKIE,
    );
    const bid = await this.utilsApiSearvice.getConfigValue(
      ConfigKeyCode.XMLY_VIP_BID,
    );
    const ctn = await this.utilsApiSearvice.getConfigValue(
      ConfigKeyCode.XMLY_VIP_CTN,
    );

    return { cookie, bid, ctn };
  }

  async verifySearchSoundList(platform): Promise<boolean> {
    if (platform === ThirdPlatformType.XMLY) {
      // 有三组cookie
      // const cookieOrders = await this.generateRandomArray();
      // let searchResult;
      //let currentCookieOrder;
      // while (cookieOrders.length > 0) {
      //   currentCookieOrder = cookieOrders.shift();
      //   // console.log(`当前order的顺序：${currentCookieOrder}`);
      //   const { cookie, bid, ctn } =
      //     await this.getCurrentFreeCookie(currentCookieOrder);
      //   // 验证喜玛拉雅是否被风控
      //   searchResult = await this.getTargetPlatform(platform).searchSoundList(
      //     '406085', // 这个是守望者专辑
      //     1,
      //     1,
      //     'ASC',
      //     cookie,
      //     bid,
      //     ctn,
      //   );
      //   if (!isEmpty(searchResult)) {
      //     console.log(
      //       `当前cookie有效，已经拿到了数据，order编号：${currentCookieOrder}`,
      //     );
      //     break;
      //   } else {
      //     console.log(
      //       `当前cookie已经失效，被风控了，order编号：${currentCookieOrder}`,
      //     );
      //   }
      // }
      const { cookie, bid, ctn } = await this.getCurrentVipCookie();
      // 验证喜玛拉雅是否被风控
      const searchResult = await this.getTargetPlatform(
        platform,
      ).searchSoundList(
        '406085', // 这个是守望者专辑
        1,
        1,
        'ASC',
        cookie,
        bid,
        ctn,
      );

      if (isEmpty(searchResult)) {
        console.log(
          `该平台${platform}的声音资源被风控了，返回结果：${JSON.stringify(searchResult)}`,
        );
        await this.utilsApiSearvice.updateConfigValue(
          ConfigKeyCode.XMLY_FREE_STATUS,
          ConfigValueCode.DISABLED,
        );
        return false;
      } else {
        console.log(
          `该平台${platform}的声音资源目前正常，返回结果：${JSON.stringify(searchResult)}`,
        );
        await this.utilsApiSearvice.updateConfigValue(
          ConfigKeyCode.XMLY_FREE_STATUS,
          ConfigValueCode.ENABLED,
        );
        return true;
      }
    }
    return false;
  }

  async isSearchSoundListEnabled(platform) {
    if (platform === ThirdPlatformType.XMLY) {
      const result = await this.utilsApiSearvice.getConfigValue(
        ConfigKeyCode.XMLY_FREE_STATUS,
      );
      return result !== ConfigValueCode.DISABLED;
    }
    return false;
  }

  async searchSoundList(
    platform,
    soundAlbum: SoundAlbum,
    sort: SortType,
    pageNum,
    pageSize,
    ignoreCache: boolean = false,
  ): Promise<Array<Sound>> {
    const { cookie, bid, ctn } = await this.getCurrentVipCookie();
    // 是否忽略缓存
    if (ignoreCache) {
      return await this.getTargetPlatform(platform).searchSoundList(
        soundAlbum.albumId,
        pageNum,
        pageSize,
        sort,
        cookie,
        bid,
        ctn,
      );
    }
    const existCacheSoundAlbum = await this.cacheSoundAlbumsRespository.findOne(
      { where: { platform: platform, albumId: soundAlbum.albumId } },
    );
    // 不存在数据
    if (isEmpty(existCacheSoundAlbum)) {
      return [];
      // 需要提示用户先收藏，返回空数据就代表需要先收藏，或者调用这个结果之前，先调用另一个接口，用于查询专辑缓存状态，如果没有记录，则提示收藏，专辑还在缓存中的，提示专辑还在缓存中，
      // console.log(`用户准备获取专辑列表，没有缓存数据，创建缓存记录~`);
      // // 保存缓存记录
      // const newCacheSoundAlbum =
      //   this.cacheSoundAlbumsRespository.create(soundAlbum);
      // console.log(
      //   `newCacheSoundAlbum:${JSON.stringify(newCacheSoundAlbum)} soundAlbum:${JSON.stringify(soundAlbum)}`,
      // );
      // newCacheSoundAlbum.cacheStatus = 'WaitUpload';
      // newCacheSoundAlbum.cacheCheckTime = dayjs().toDate();
      // await this.cacheSoundAlbumsRespository.save(newCacheSoundAlbum);
      // if (!(await this.isSearchSoundListEnabled(soundAlbum.platform))) {
      //   // 被风控了
      //   throw new CustomBadRequestException({
      //     errCode: ErrorCode.SOUND_LIST_DISABLED,
      //   });
      // }
      // return await this.getTargetPlatform(platform).searchSoundList(
      //   soundAlbum.albumId,
      //   pageNum,
      //   pageSize,
      //   sort,
      //   cookie,
      //   bid,
      //   ctn,
      // );
    }
    // 存在数据的情况，数据太旧或者没有完成列表拉取，则不使用缓存
    if (
      existCacheSoundAlbum.cacheStatus !== 'Done'
    ) {
      console.log(
        `用户准备获取专辑列表，有缓存数据，但尚未缓存完成，或者检查时间太过久远，本次不准备使用缓存~`,
      );
      return [];
    }
    // 将会从数据库查询声音列表数据，这个等一等再实现，先把缓存做了
    const queryResult = await this.cacheSoundsRepository.find({
      where: {
        soundAlbumId: soundAlbum.albumId,
        platform: soundAlbum.platform,
      },
      order: { sort: sort },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });
    console.log(
      `从数据库中获取专辑的声音列表数据，总条数：${queryResult.length}`,
    );
    existCacheSoundAlbum.usedCount += 1;
    await this.cacheSoundAlbumsRespository.save(existCacheSoundAlbum);
    return queryResult.map(item => this.convertCacheSoundToSound(item));
  }

  convertCacheSoundToSound(cacheSound: CacheSounds): Sound {
    return {
      ...cacheSound,
      albumId: '',
      albumTitle: '',
      isBookmarked: false,
      songType: 'sound',
      valid: cacheSound.cacheStatus === 'Done',
      cacheStatus: cacheSound.cacheStatus,
    };
  }

  async searchSingerSongs(platform, singerId, pageNum): Promise<Array<Song>> {
    return await this.getTargetPlatform(platform).searchSingerSongs(
      singerId,
      pageNum,
    );
  }

  async searchSingerAlbums(platform, singerId, pageNum): Promise<Array<Album>> {
    return await this.getTargetPlatform(platform).searchSingerAlbums(
      singerId,
      pageNum,
    );
  }

  async searchAlumDetail(platform, albumId): Promise<Array<Song>> {
    return await this.getTargetPlatform(platform).searchAlbumDetail(albumId);
  }

  getTargetPlatform(platform): PlatformApi {
    const targetPlatform = this.platforms.find(
      item => item.name.toUpperCase() === platform.toUpperCase(),
    );
    if (!targetPlatform) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.DATA_NOT_FOUND,
      });
    }
    return targetPlatform;
  }

  async searchPlaylist(keyWord: string, pageNum: number): Promise<Array<any>> {
    const promises = this.platforms.map(platform =>
      platform.searchPlaylist(keyWord, pageNum),
    );
    return mixUpArrays(await Promise.all(promises));
  }

  async setCookie(platform: string, cookie: string) {
    const existCookie = await this.cookiesRepository.findOne({
      where: { platform },
    });
    if (!existCookie) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.DATA_NOT_FOUND,
      });
    }
    existCookie.cookie = cookie;
    await this.cookiesRepository.save(existCookie);
  }

  async searchPlaylistSongs(
    platform: string,
    playlistId: string,
    pageNum: number,
    pageSize: number,
  ): Promise<Array<Song>> {
    return this.getTargetPlatform(platform).searchPlaylistSongs(
      playlistId,
      pageNum,
      pageSize,
    );
  }

  async tryCacheMoreSounds(existCacheSound: CacheSounds) {
    const maxTryCount = 3;
    for (
      let i = existCacheSound.sort + 1;
      i <= existCacheSound.sort + 1 + maxTryCount;
      i++
    ) {
      const targetCacheSound = await this.cacheSoundsRepository.findOne({
        where: { soundAlbumId: existCacheSound.soundAlbumId, sort: i },
      });
      if (isEmpty(targetCacheSound)) {
        console.log(`这个声音专辑不存在sort：${i}的声音数据~`);
        break;
      }
      if (targetCacheSound.cacheStatus === 'Init') {
        targetCacheSound.cacheStatus = 'WaitUpload';
        await this.cacheSoundsRepository.save(targetCacheSound);
        console.log(
          `成功往后拓展缓存数据：${JSON.stringify(targetCacheSound)}`,
        );
      }
    }
  }

  async getSoundDetail(platform: string, soundId: string): Promise<any> {

    // 这段逻辑是给后台服务使用的
    const { cookie, bid, ctn } = await this.getCurrentVipCookie();
    // 检查缓存，没有记录的话不管，因为有另外的任务负责创建
    const existCacheSound = await this.cacheSoundsRepository.findOne({
      where: { platform: platform, songId: soundId },
    });
    if (isEmpty(existCacheSound)) {
      console.log(
        `该声音${soundId}未发现任何缓存记录，准备用vipCookie获取声音~`,
      );
      return await this.getTargetPlatform(platform).getSoundDetail(
        soundId,
        cookie,
        bid,
        ctn,
      );
    }

    const cacheSoundAlbum = await this.cacheSoundAlbumsRespository.findOne({
      where: { albumId: existCacheSound.soundAlbumId },
    });
    const isFree =
      cacheSoundAlbum !== null &&
      cacheSoundAlbum !== undefined &&
      cacheSoundAlbum.vipType === 'Free';
    console.log(`本专辑是否免费：${isFree}`);
    // 有记录，状态是Init，则更新为WaitUpload，然后继续原有逻辑
    if (existCacheSound.cacheStatus === 'Init') {
      existCacheSound.cacheStatus = 'WaitUpload';
      await this.cacheSoundsRepository.save(existCacheSound);
      console.log(`更改声音${soundId}缓存状态为WaitUpload~`);
      return await this.getTargetPlatform(platform).getSoundDetail(
        soundId,
        cookie,
        bid,
        ctn,
      );
    }

    // 有记录，状态不是Done，不做什么，继续原有逻辑
    if (existCacheSound.cacheStatus !== 'Done') {
      console.log(`该声音${soundId}正在缓存中，本次仍然直接调用官方api~`);
      return await this.getTargetPlatform(platform).getSoundDetail(
        soundId,
        cookie,
        bid,
        ctn,
      );
    }

    // 有记录并且状态是Done，直接用云盘数据
    if (existCacheSound.cacheStatus === 'Done') {
      console.log(`该声音${soundId}存在已缓存数据`);
      const songUrl = await WebDAVClient.getFileUrl(existCacheSound.cachePath);
      existCacheSound.lastUsedTime = dayjs().toDate();
      existCacheSound.usedCount++;
      this.cacheSoundsRepository.save(existCacheSound);

      // 如果当前声音已经有缓存了，则尝试后续拓展
      await this.tryCacheMoreSounds(existCacheSound);
      return { songUrl };
    }
  }

  async isLosslessLevel(platform: string, level: string) {
    if (isEmpty(level)) {
      console.log(`level为空，不是想要获取无损音源~`);
      return false;
    }

    if (platform === ThirdPlatformType.QQ && level !== '320') {
      // 是无损
      return true;
    }
    if (platform === ThirdPlatformType.WYY && level !== 'exhigh') {
      return true;
    }
    return false;
  }

  getMusicLevel(platform: string, level: QQLevel | WyyLevel): MusicLevelCode {
    if (isEmpty(level)) {
      return MusicLevelCode.HIGH;
    }

    if (platform === ThirdPlatformType.QQ) {
      if (level === 'flac') {
        return MusicLevelCode.NO_LOSS;
      }
      if (level === 'atmos_51') {
        return MusicLevelCode.SURROUND;
      }
    }
    if (platform === ThirdPlatformType.WYY) {
      if (level === 'lossless') {
        return MusicLevelCode.NO_LOSS;
      }
      if (level === 'sky') {
        return MusicLevelCode.SURROUND;
      }
    }
    return MusicLevelCode.HIGH;
  }

  getCachePath(musicLevel: MusicLevelCode, existCacheSong: CacheSongs) {
    if (isEmpty(existCacheSong)) {
      return null;
    }
    if (musicLevel === MusicLevelCode.HIGH) {
      return existCacheSong.cachePath;
    }
    // 如果请求无损但未缓存无损文件，则回退到高品质缓存路径（如果存在）
    if (musicLevel === MusicLevelCode.NO_LOSS) {
      return (
        existCacheSong.cacheNoLossPath || existCacheSong.cachePath || null
      );
    }
    // 对环绕声也做回退：优先环绕 -> 无损 -> 高品质
    if (musicLevel === MusicLevelCode.SURROUND) {
      return (
        existCacheSong.cacheSurroundPath ||
        existCacheSong.cacheNoLossPath ||
        existCacheSong.cachePath ||
        null
      );
    }
    return null;
  }

  async getMusicDetail(
    platform: string,
    songId: string,
    level: QQLevel | WyyLevel,
  ): Promise<Song> {
    const musicLevel = this.getMusicLevel(platform, level);

    // 优先从缓存获取，如果缓存有数据，从缓存获取，并且更新count和lastUsedTime
    const existCacheSong = await this.cacheSongsRepository.findOne({
      where: { platform, songId },
    });
    if (existCacheSong?.cacheStatus === 'Done') {
      // 可能不存在无损的音源
      const cachePath = this.getCachePath(musicLevel, existCacheSong);
      console.log(
        `歌曲，platform：${platform} songId：${songId} 存在缓存Done状态的数据，当前musicLevel:${musicLevel} 获取到cachePath：${cachePath}`,
      );
      const cacheExist = await WebDAVClient.existWithRootPath(cachePath);
      if (cacheExist) {
        console.log(
          `歌曲，platform：${platform} songId：${songId} 存在缓存Done状态的数据，当前musicLevel:${musicLevel} 在云盘存在缓存数据，直接使用云盘缓存~`,
        );
        const songUrl = await WebDAVClient.getFileUrl(cachePath);
        existCacheSong.lastUsedTime = dayjs().toDate();
        existCacheSong.usedCount++;
        this.cacheSongsRepository.save(existCacheSong);
        return {
          songImg: existCacheSong.songImg,
          songUrl: songUrl,
          songLyric: existCacheSong.songLyric,
          finalLevel: level,
        } as any;
      }
    }

    const cookie = await this.cookiesRepository.findOne({
      where: { platform: platform },
    });

    const { songImg, songUrl, songLyric, finalLevel } =
      await this.getTargetPlatform(platform).getMusicDetail(
        songId,
        cookie.cookie,
        level,
      );
    if (existCacheSong) {
      console.log(
        `歌曲，platform：${platform} songId：${songId} musicLevel:${musicLevel} 正在上传云盘`,
      );
      existCacheSong.lastUsedTime = dayjs().toDate();
      existCacheSong.usedCount++;
      this.cacheSongsRepository.save(existCacheSong);
      return {
        songImg: songImg,
        songUrl: songUrl,
        songLyric: songLyric,
        finalLevel: finalLevel,
      } as any;
    }
    console.log(
      `歌曲，platform：${platform} songId：${songId} 不存在缓存数据，准备下载并上传云盘`,
    );
    const cacheSong = this.cacheSongsRepository.create();
    cacheSong.songImg = songImg;
    cacheSong.platform = platform;
    cacheSong.songId = songId;
    cacheSong.songUrl = musicLevel === MusicLevelCode.HIGH ? songUrl : ''; // 其他品质的音乐源可以留空
    cacheSong.songLyric = songLyric;
    cacheSong.usedCount = 1;
    cacheSong.cacheStatus = 'WaitUpload';
    this.cacheSongsRepository.save(cacheSong);
    return {
      songImg: songImg,
      songUrl: songUrl,
      songLyric: songLyric,
      finalLevel: finalLevel,
    } as any;
  }

  async refreshMusicDetail(
    platform: string,
    songId: string,
    musicLevel: MusicLevelCode = MusicLevelCode.HIGH,
  ): Promise<Song> {
    const cookie = await this.cookiesRepository.findOne({
      where: { platform: platform },
    });
    let level: QQLevel | WyyLevel;
    if (platform === ThirdPlatformType.QQ) {
      if (musicLevel === MusicLevelCode.HIGH) {
        level = '320';
      }
      if (musicLevel === MusicLevelCode.NO_LOSS) {
        level = 'flac';
      }
      if (musicLevel === MusicLevelCode.SURROUND) {
        level = 'atmos_51';
      }
    }
    if (platform === ThirdPlatformType.WYY) {
      if (musicLevel === MusicLevelCode.HIGH) {
        level = 'exhigh';
      }
      if (musicLevel === MusicLevelCode.NO_LOSS) {
        level = 'lossless';
      }
      if (musicLevel === MusicLevelCode.SURROUND) {
        level = 'sky';
      }
    }
    const { songUrl, songLyric } = await this.getTargetPlatform(
      platform,
    ).getMusicDetail(songId, cookie.cookie, level);

    return { songUrl, songLyric } as any;
  }
}
