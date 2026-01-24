import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheSongs } from './entities/cache.songs.entity';
import { DeepPartial, IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmpty } from 'lodash';
import path from 'path';
import WebDAVClient from 'src/utils/web-dav.util';
import axios from 'axios';
import fs from 'fs';
import { EnvCode } from 'src/enums/env-code.enum';
import { SearchService } from './search.service';
import { ThirdPlatformType } from 'src/playlist/enums/platform-type.enum';
import dayjs, { Dayjs } from 'dayjs';
import { dateTimeBefore, dateTimeBeforeNow } from 'src/utils/my.utils';
import { CacheSounds } from '../soundalbum/entities/cache.sound.entity';
import { CacheSoundAlbums } from 'src/soundalbum/entities/cache.sound.albums.entity';
import { MusicLevelCode } from 'src/enums/music-level-code.enum';

type DownloadType = 'sound' | 'music';

let waitCacheMusicCount = 0;

const cronOfCacheMusic =
  process.env.NODE_ENV === EnvCode.DEV
    ? '10 * * * * *'
    : process.env.NODE_ENV === EnvCode.PROD
      ? '0 1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,55,57,59 * * * *'
      : '*/50 * * * * *';
const cronOfCacheSound =
  process.env.NODE_ENV === EnvCode.DEV
    ? '20 * * * * *'
    : process.env.NODE_ENV === EnvCode.PROD
      ? '0 2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58 * * * *'
      : '*/20 * * * * *';
@Injectable()
export class CacheSongService {
  private isCacheMusicRunning = false;
  private isCacheSoundRunning = false;
  private isCacheSoundAlbumRunning = false;
  private isUpdateLyricTaskRunning = false;
  private isTryCacheMoreSoundsRunning = false;

  constructor(
    @InjectRepository(CacheSongs)
    private cacheSongRepository: Repository<CacheSongs>,
    @InjectRepository(CacheSoundAlbums)
    private cacheSoundAlbumRepository: Repository<CacheSoundAlbums>,
    @InjectRepository(CacheSounds)
    private cacheSoundsRepository: Repository<CacheSounds>,
    private readonly searchService: SearchService,
  ) {}

  // @Cron('*/15 * * * * *')
  // async handleCronUpdateLyric() {
  //   console.log(`执行歌词刷新任务`);
  //   if (this.isUpdateLyricTaskRunning) {
  //     return;
  //   }
  //   this.isUpdateLyricTaskRunning = true;
  //   console.log('歌词刷新任务开始执行');

  //   const waitRefreshFirstOne = await this.cacheSongRepository.findOne({
  //     where: { cacheStatus: 'Done', songLyric: IsNull() },
  //   });

  //   if (isEmpty(waitRefreshFirstOne)) {
  //     console.log(`歌词任务列表为空，本次任务退出`);
  //     this.isUpdateLyricTaskRunning = false;
  //     return;
  //   }
  //   try {
  //     console.log(`准备更新歌词信息:${JSON.stringify(waitRefreshFirstOne)}`);

  //     const { songLyric } = await this.searchService.refreshMusicDetail(
  //       waitRefreshFirstOne.platform,
  //       waitRefreshFirstOne.songId,
  //     );
  //     // 检查是否过期，并刷新url
  //     waitRefreshFirstOne.songLyric = songLyric;
  //     this.cacheSongRepository.save(waitRefreshFirstOne);
  //   } catch (err) {
  //     console.log(`歌词刷新任务执行异常，${err}`);
  //   } finally {
  //     console.log(`歌词刷新任务执行完毕`);
  //     // 等待1秒再执行下一个任务
  //     this.isUpdateLyricTaskRunning = false;
  //   }
  // }

  @Cron(cronOfCacheMusic)
  async cacheMusic() {
    if (this.isCacheMusicRunning) {
      waitCacheMusicCount++;
      console.log(
        `cacheMusic上一次缓存音乐的任务还在执行中，当前等待次数:${waitCacheMusicCount}~`,
      );

      if (waitCacheMusicCount < 5 || process.env.NODE_ENV === EnvCode.PROD) {
        console.log(
          `cacheMusic尝试等待下一次任务周期，当前等待次数:${waitCacheMusicCount} 是否生产环境：${process.env.NODE_ENV === EnvCode.PROD}~`,
        );
        return;
      }
      console.log(`cacheMusic忽略标志位isCacheMusicRunning，强制执行`);
    }
    if (this.isCacheSoundRunning && process.env.NODE_ENV === EnvCode.PROD) {
      console.log(
        'cacheMusic上一次缓存声音的任务还在执行中，带宽不够，本次不执行~',
      );
      return;
    }
    this.isCacheMusicRunning = true;
    console.log('cacheMusic缓存音乐任务开始执行');
    waitCacheMusicCount = 0;

    try {
      const waitUploadFirstOne = await this.cacheSongRepository.findOne({
        where: { cacheStatus: 'WaitUpload', usedCount: MoreThan(1) },
        order: {
          usedCount: 'DESC',
        },
      });
      if (isEmpty(waitUploadFirstOne)) {
        console.log(`cacheMusic待上传的高品质音乐列表为空，尝试缓存无损音乐~`);
        await this.cacheNoLossMusic();
        console.log(
          `cacheMusic待上传的高品质音乐列表为空，尝试缓存无损音乐结束~`,
        );
        this.isCacheMusicRunning = false;
        return;
      }
      const localPath = path.join(__dirname, '..', '..', '/music_cache/');
      waitUploadFirstOne.cacheStatus = 'Uploading';
      await this.cacheSongRepository.save(waitUploadFirstOne);

      // 检查是否过期，并刷新url
      let createTime: Dayjs = dayjs(waitUploadFirstOne.createTime); // Dayjs 类型
      if (waitUploadFirstOne.platform === ThirdPlatformType.WYY) {
        createTime = createTime.add(1, 'hour');
      } else if (waitUploadFirstOne.platform === ThirdPlatformType.QQ) {
        createTime = createTime.add(6, 'hour');
      }
      const needRefreshUrl =
        dateTimeBeforeNow(createTime.toDate()) ||
        isEmpty(waitUploadFirstOne.songUrl);
      console.log(`needRefreshUrl:${needRefreshUrl}`);
      if (needRefreshUrl) {
        const { songUrl } = await this.searchService.refreshMusicDetail(
          waitUploadFirstOne.platform,
          waitUploadFirstOne.songId,
        );
        waitUploadFirstOne.songUrl = songUrl;
      }

      await this.downloadFile(
        waitUploadFirstOne.songUrl,
        localPath,
        `${waitUploadFirstOne.platform}-${waitUploadFirstOne.songId}.mp3`,
        waitUploadFirstOne.songImg,
        waitUploadFirstOne.platform,
        waitUploadFirstOne.songId,
        'music',
      );
      console.log(`cacheMusic音乐任务执行完毕`);
      // 等待1秒再执行下一个任务
      this.isCacheMusicRunning = false;
    } catch (err) {
      console.log(`cacheMusic音乐任务执行异常：${err}`);
      // 等待1秒再执行下一个任务
      this.isCacheMusicRunning = false;
    }
  }

  async cacheNoLossMusic() {
    if (process.env.NODE_ENV === EnvCode.PROD) {
      console.log(`cacheNoLoss当前生产环境，不执行任务~`);
      return;
    }
    try {
      console.log(new Date() + 'cacheNoLossMusic缓存无损音乐任务开始执行');

      const waitUploadFirstOne = await this.cacheSongRepository.findOne({
        where: {
          cacheStatus: 'Done',
          cacheNoLossPath: IsNull(),
          usedCount: MoreThan(1),
        },
        order: {
          usedCount: 'DESC',
        },
      });
      console.log(
        `cacheNoLossMusic缓存无损音乐任务，待缓存数据：${waitUploadFirstOne?.songId}`,
      );
      if (isEmpty(waitUploadFirstOne)) {
        console.log(
          `cacheNoLossMusic缓存无损音乐任务，待上传的无损音乐列表为空，尝试缓存环绕声音乐~`,
        );
        await this.cacheSurroundMusic();
        console.log(
          `cacheNoLossMusic缓存无损音乐任务，待上传的无损音乐列表为空，尝试缓存环绕声音乐结束~`,
        );
        return;
      }
      const localPath = path.join(__dirname, '..', '..', '/music_cache/');

      const { songUrl } = await this.searchService.refreshMusicDetail(
        waitUploadFirstOne.platform,
        waitUploadFirstOne.songId,
        MusicLevelCode.NO_LOSS,
      );
      console.log(`cacheNoLossMusic缓存无损音乐任务，获取到songUrl:${songUrl}`);
      // 有可能这首歌曲没有无损音源
      if (isEmpty(songUrl)) {
        waitUploadFirstOne.cacheNoLossPath = 'not-found';
        await this.cacheSongRepository.save(waitUploadFirstOne);
        console.log(`这首歌曲${waitUploadFirstOne.songId} 没有无损音源~`);
        return;
      }
      waitUploadFirstOne.songUrl = songUrl;

      await this.downloadFile(
        waitUploadFirstOne.songUrl,
        localPath,
        `${waitUploadFirstOne.platform}-${waitUploadFirstOne.songId}-No-Loss.flac`,
        waitUploadFirstOne.songImg,
        waitUploadFirstOne.platform,
        waitUploadFirstOne.songId,
        'music',
        MusicLevelCode.NO_LOSS,
      );
      console.log(`cacheNoLossMusic缓存无损音乐任务执行完毕`);
    } catch (err) {
      console.log(`cacheNoLossMusic缓存无损音乐时异常，错误信息：${err}`);
    }
  }

  async cacheSurroundMusic() {
    if (process.env.NODE_ENV === EnvCode.PROD) {
      console.log(`cacheSurroundMusic当前生产环境，不执行此任务~`);
      return;
    }
    try {
      console.log('cacheSurroundMusic缓存环绕声音乐任务开始执行');

      const waitUploadFirstOne = await this.cacheSongRepository.findOne({
        where: {
          cacheStatus: 'Done',
          cacheSurroundPath: IsNull(),
          usedCount: MoreThan(1),
        },
        order: {
          usedCount: 'DESC',
        },
      });
      if (isEmpty(waitUploadFirstOne)) {
        console.log(
          `cacheSurroundMusic缓存环绕声音乐任务，待上传的无损音乐列表为空，尝试缓存环绕声音乐~`,
        );
        return;
      }
      const localPath = path.join(__dirname, '..', '..', '/music_cache/');

      const { songUrl } = await this.searchService.refreshMusicDetail(
        waitUploadFirstOne.platform,
        waitUploadFirstOne.songId,
        MusicLevelCode.SURROUND,
      );
      console.log(
        `cacheSurroundMusic缓存环绕声音乐任务，获取到songUrl:${songUrl}`,
      );
      // 有可能这首歌曲没有环绕声音源
      if (isEmpty(songUrl)) {
        waitUploadFirstOne.cacheSurroundPath = 'not-found';
        await this.cacheSongRepository.save(waitUploadFirstOne);
        console.log(`这首歌曲${waitUploadFirstOne.songId} 没有环绕声音源~`);
        return;
      }
      waitUploadFirstOne.songUrl = songUrl;

      await this.downloadFile(
        waitUploadFirstOne.songUrl,
        localPath,
        `${waitUploadFirstOne.platform}-${waitUploadFirstOne.songId}-Surround.flac`,
        waitUploadFirstOne.songImg,
        waitUploadFirstOne.platform,
        waitUploadFirstOne.songId,
        'music',
        MusicLevelCode.SURROUND,
      );
      console.log(`cacheSurroundMusic缓存环绕声音乐任务执行完毕`);
    } catch (err) {
      console.log(
        `cacheSurroundMusic缓存环绕声音乐任务时异常，错误信息：${err}`,
      );
    }
  }

  @Cron(cronOfCacheSound)
  //@Cron('1-59/2 * * * * *')
  async cacheSound() {
    console.log(`cacheSound任务触发了~`);
    if (process.env.NODE_ENV === EnvCode.PROD) {
      console.log('当前环境是PROD环境，不执行cacheSound~');
      return;
    }
    // if (this.isCacheSoundRunning) {
    //   console.log('cacheSound上一次缓存声音的任务还在执行中~');
    //   return;
    // }
    if (this.isCacheMusicRunning && process.env.NODE_ENV === EnvCode.PROD) {
      console.log(
        'cacheSound上一次缓存音乐的任务还在执行中，带宽不够，本次不执行~',
      );
      return;
    }
    this.isCacheSoundRunning = true;
    console.log('cacheSound任务开始执行');

    try {
      const waitUploadFirstOne = await this.cacheSoundsRepository.findOne({
        where: { cacheStatus: 'WaitUpload' },
        order: { createTime: 'DESC' },
      });
      if (isEmpty(waitUploadFirstOne)) {
        console.log(`cacheSound待上传的声音列表为空，本次任务退出`);
        this.isCacheSoundRunning = false;
        return;
      }
      const localPath = path.join(__dirname, '..', '..', '/music_cache/');
      waitUploadFirstOne.cacheStatus = 'Uploading';
      await this.cacheSoundsRepository.save(waitUploadFirstOne);

      //let finalSongUrl;
      const { songUrl } = await this.searchService.getSoundDetail(
        waitUploadFirstOne.platform,
        waitUploadFirstOne.songId,
      );
      //finalSongUrl = songUrl;
      console.log(`cacheSound，获取songUrl结果:${songUrl}~`);
      // if (!finalSongUrl.includes('http')) {
      //   console.log(`cacheSound，延时5秒后发起重试~`);
      //   // 延时 5 秒执行
      //   await new Promise(resolve => setTimeout(resolve, 5000));
      //   const { songUrl: newSongUrl } = await this.searchService.getSoundDetail(
      //     waitUploadFirstOne.platform,
      //     waitUploadFirstOne.songId,
      //   );
      //   finalSongUrl = newSongUrl;
      //   console.log(`cacheSound重试获取声音链接，新的结果${finalSongUrl}`);
      // }
      // if (!finalSongUrl.includes('http')) {
      //   // 重试仍然拿不到地址，放弃
      //   this.isCacheSoundRunning = false;
      //   console.log(
      //     `cacheSound等待5秒后重新获取声音地址仍然失败，本次任务退出~`,
      //   );
      //   return;
      // }
      waitUploadFirstOne.songUrl = songUrl;

      await this.downloadFile(
        waitUploadFirstOne.songUrl,
        localPath,
        `${waitUploadFirstOne.platform}-${waitUploadFirstOne.songId}.mp3`,
        waitUploadFirstOne.songImg,
        waitUploadFirstOne.platform,
        waitUploadFirstOne.songId,
        'sound',
      );
      console.log(`cacheSound声音缓存任务执行完毕`);
      // 等待1秒再执行下一个任务
      this.isCacheSoundRunning = false;
    } catch (err) {
      this.isCacheSoundRunning = false;
      console.log(`cacheSound声音缓存任务执行异常`);
      // 等待1秒再执行下一个任务
    }
    this.isCacheSoundRunning = false;
  }

  // 每5分钟1次
  @Cron('*/20 * * * * *')
  async tryCacheMoreSounds() {
    if (process.env.NODE_ENV === EnvCode.PROD) {
      console.log(`当前环境是Prod环境，tryCacheMoreSounds任务不执行~`);
      return;
    }
    if (process.env.NODE_ENV === EnvCode.DEV) {
      console.log(`当前环境是Dev环境，tryCacheMoreSounds任务不执行~`);
      return;
    }
    if (this.isTryCacheMoreSoundsRunning) {
      return;
    }
    console.log(`tryCacheMoreSounds任务开始执行~`);
    try {
      // 检查有没有WaitUpload的cacheSound记录，如果有则退出
      const waitCacheFirstOne = await this.cacheSoundsRepository.findOne({
        where: { cacheStatus: 'WaitUpload' },
      });
      console.log(
        `tryCacheMoreSounds获取到waitCacheFirstOne数据：${JSON.stringify(waitCacheFirstOne)}~`,
      );
      if (!isEmpty(waitCacheFirstOne)) {
        console.log(
          `tryCacheMoreSounds当前存在等待上传的声音，所以不继续执行~`,
        );
        this.isTryCacheMoreSoundsRunning = false;
        return;
      }

      // 获取最新的50条记录，随机选择一条，拓展5条记录
      const cacheSounds = await this.cacheSoundsRepository.find({
        where: { cacheStatus: 'Done' },
        order: { updateTime: 'DESC' },
        take: 100,
      });
      if (isEmpty(cacheSounds)) {
        console.log(
          `tryCacheMoreSounds获取最近的100条cacheSound记录为空，所以不继续执行~`,
        );
        this.isTryCacheMoreSoundsRunning = false;
        return;
      }
      const randomIndex = Math.floor(Math.random() * cacheSounds.length);
      const targetCacheSound = cacheSounds[randomIndex];
      const extendCount = 2;
      for (
        let i = targetCacheSound.sort + 1;
        i <= targetCacheSound.sort + 1 + extendCount;
        i++
      ) {
        const extendCacheSound = await this.cacheSoundsRepository.findOne({
          where: { soundAlbumId: targetCacheSound.soundAlbumId, sort: i },
        });
        if (isEmpty(extendCacheSound)) {
          console.log(
            `tryCacheMoreSounds这张专辑：${targetCacheSound.soundAlbumId} 没有sort为：${i}的数据~`,
          );
          break;
        }
        if (extendCacheSound.cacheStatus === 'Init') {
          extendCacheSound.cacheStatus = 'WaitUpload';
          await this.cacheSoundsRepository.save(extendCacheSound);
          console.log(
            `tryCacheMoreSounds任务将  ${extendCacheSound.songTitle} ${extendCacheSound.sort} 从Init改为WaitUpload~`,
          );
        }
      }
    } catch (err) {
      console.log(`tryCacheMoreSounds异常，err:${err}`);
    }

    this.isTryCacheMoreSoundsRunning = false;
    console.log(`tryCacheMoreSounds执行完毕了~`);
    return;
  }

  // 缓存声音专辑的，每2分钟1次
  @Cron('*/30 * * * * *')
  async cacheSoundAlbums() {
    if (process.env.NODE_ENV === EnvCode.PROD) {
      console.log(`当前环境是Prod环境，cacheSoundAlbums任务不执行~`);
      return;
    }
    if (this.isCacheSoundAlbumRunning) {
      return;
    }
    this.isCacheSoundAlbumRunning = true;
    console.log('cacheSoundAlbums缓存声音专辑的任务已经开始执行');

    try {
      let waitCacheFirstOne = await this.cacheSoundAlbumRepository.findOne({
        where: { cacheStatus: 'WaitUpload' },
      });
      if (isEmpty(waitCacheFirstOne)) {
        console.log(
          `cacheSoundAlbums状态为waitUpload的数据没有了，尝试刷新已有专辑`,
        );
        waitCacheFirstOne = await this.cacheSoundAlbumRepository.findOne({
          where: {
            cacheStatus: 'Done',
            isFinished: false,
            cacheCheckTime: LessThan(dayjs().subtract(24, 'hour').toDate()),
          },
          order: {
            cacheCheckTime: 'ASC', // 正向排序
          },
        });
      }
      if (isEmpty(waitCacheFirstOne)) {
        console.log(
          `cacheSoundAlbums状态为waitUpload的数据和已经过期的数据都没有，即将终止任务`,
        );
        this.isCacheSoundAlbumRunning = false;
        return;
      }

      // 检查是否处于被风控状态
      const verifyResult = await this.searchService.verifySearchSoundList(
        waitCacheFirstOne.platform,
      );
      if (!verifyResult) {
        console.log(
          `当前此平台${waitCacheFirstOne.platform}的资源被风控了，无法刷新，本次任务跳过，等待下一周期的任务执行`,
        );
        this.isCacheSoundAlbumRunning = false;
        return;
      }

      // 增加逻辑，检查是否需要刷新，还只能调用search接口了
      let needRefreshSounds = false;
      if (waitCacheFirstOne.cacheStatus === 'WaitUpload') {
        needRefreshSounds = true;
      } else if (waitCacheFirstOne.cacheStatus === 'Done') {
        const searchSoundAlbums = await this.searchService.searchAlbumSound(
          waitCacheFirstOne.albumTitle,
          1,
        );
        let tartgetSoundAlbum = searchSoundAlbums.find(
          item =>
            String(item.albumId) === waitCacheFirstOne.albumId &&
            item.platform === waitCacheFirstOne.platform,
        );

        if (isEmpty(tartgetSoundAlbum)) {
          console.log(
            `缓存专辑重新查询获取不到了，尝试修正albumTitile再次查询~`,
          );
          // 专辑的标题可能被修改，但albumId不会
          const sonudList = await this.searchService.searchSoundList(
            waitCacheFirstOne.platform,
            { ...waitCacheFirstOne, releaseDate: '' },
            'ASC',
            1,
            1,
            true,
          );
          console.log(
            `修正标题时，查询到的soundList结果：${JSON.stringify(sonudList)}`,
          );
          if (isEmpty(sonudList)) {
            console.error(
              `严重异常，已经缓存的数据查询SoundList时，结果为空，albumId:${waitCacheFirstOne.albumId} albumTitile:${waitCacheFirstOne.albumTitle}`,
            );
            // 这种可能是在喜马拉雅那边已经删除资源了
            waitCacheFirstOne.cacheCheckTime = dayjs().toDate();
            this.cacheSoundAlbumRepository.save(waitCacheFirstOne);
            this.isCacheSoundAlbumRunning = false;
            return;
          }
          waitCacheFirstOne.albumTitle = sonudList[0].albumTitle;

          const maxTryPages = 50;
          let currentPageNum = 1;
          while (true) {
            console.log(`查询第${currentPageNum}页数据~`);
            const searchSoundAlbums = await this.searchService.searchAlbumSound(
              waitCacheFirstOne.albumTitle,
              currentPageNum++,
            );
            if (isEmpty(searchSoundAlbums)) {
              console.log(
                `循环插叙专辑数据时，获取到空数据页，当前专辑信息：${JSON.stringify(waitCacheFirstOne)}`,
              );
              break;
            }
            tartgetSoundAlbum = searchSoundAlbums.find(
              item =>
                String(item.albumId) === waitCacheFirstOne.albumId &&
                item.platform === waitCacheFirstOne.platform,
            );
            if (!isEmpty(tartgetSoundAlbum)) {
              break;
            }
            if (currentPageNum > maxTryPages) {
              console.log(
                `已经查询${maxTryPages}页数据，仍然无法找到匹配的专辑数据，当前专辑信息：${JSON.stringify(waitCacheFirstOne)}`,
              );
              break;
            }
            // 每个分页之间间隔5秒，防止被风控
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }

        if (isEmpty(tartgetSoundAlbum)) {
          console.log(
            `cacheSoundAlbums严重错误，在数据库中有声音专辑数据，但是重新搜索已经查询不到了，缓存的专辑信息:${JSON.stringify(waitCacheFirstOne)}，查询到的所有专辑信息：${searchSoundAlbums.length}`,
          );
          this.isCacheSoundAlbumRunning = false;
          return;
        }
        needRefreshSounds =
          String(tartgetSoundAlbum.soundAlbumUpdateAt) !==
          String(waitCacheFirstOne.soundAlbumUpdateAt);
        console.log(
          `String(tartgetSoundAlbum.soundAlbumUpdateAt):${String(tartgetSoundAlbum.soundAlbumUpdateAt)} String(waitCacheFirstOne.soundAlbumUpdateAt)：${String(waitCacheFirstOne.soundAlbumUpdateAt)}`,
        );
        waitCacheFirstOne.soundAlbumUpdateAt =
          tartgetSoundAlbum.soundAlbumUpdateAt;
        waitCacheFirstOne.countOfSounds = tartgetSoundAlbum.countOfSounds;
      }
      console.log(
        `该专辑${waitCacheFirstOne.albumId}:${waitCacheFirstOne.albumTitle}是否需要刷新的判断结果：${needRefreshSounds}`,
      );

      const maxRefreshPages =
        waitCacheFirstOne.cacheStatus === 'WaitUpload' ? 100 : 1;
      if (needRefreshSounds) {
        let pageNum = 1;
        const batchPageSize = 100;
        const soundResult = [];
        while (true) {
          if (pageNum > maxRefreshPages) {
            console.log(
              `已经获取了最大页数：${maxRefreshPages}页数据了，停止本次循环，当前声音列表数据总条数:${soundResult.length}`,
            );
            break;
          }

          const sounds = await this.searchService.searchSoundList(
            waitCacheFirstOne.platform,
            {
              platform: waitCacheFirstOne.platform,
              albumId: waitCacheFirstOne.albumId,
              albumTitle: waitCacheFirstOne.albumTitle,
              albumImg: waitCacheFirstOne.albumImg,
              countOfSounds: waitCacheFirstOne.countOfSounds,
              desc: waitCacheFirstOne.desc,
              vipType: waitCacheFirstOne.vipType,
              isFinished: waitCacheFirstOne.isFinished,
              releaseDate: '',
            },
            'DESC',
            pageNum,
            batchPageSize,
            true,
          );
          if (
            isEmpty(sounds) ||
            sounds.length < batchPageSize ||
            maxRefreshPages === 1
          ) {
            soundResult.push(...sounds);
            console.log(
              `cacheSoundAlbums声音列表已经拉取完了，准备退出循环逻辑，当前声音列表数据总条数:${soundResult.length}`,
            );
            break;
          } else {
            soundResult.push(...sounds);
            pageNum++;
            await new Promise(resolve => setTimeout(resolve, 10 * 1000));
          }
        }

        const existSounds = await this.cacheSoundsRepository.find({
          where: { soundAlbumId: waitCacheFirstOne.albumId },
        });
        for (const sound of soundResult) {
          const existIndex = existSounds.findIndex(
            item =>
              item.platform === sound.platform &&
              String(item.songId) === String(sound.songId),
          );
          if (existIndex !== -1) {
            console.log(
              `cacheSoundAlbums这个声音的信息已经存在，id:${sound.songId} 尝试更新这条声音数据~`,
            );
            const existSound = existSounds[existIndex];
            existSound.songTitle = sound.songTitle;
            existSound.songImg = sound.songImg;
            existSound.singerName = sound.singerName;
            existSound.sort = sound.sort;
            await this.cacheSoundsRepository.save(existSound);
          } else {
            // 不存在则新建数据
            const newCacheSound = this.cacheSoundsRepository.create(
              sound as DeepPartial<CacheSounds>,
            );
            newCacheSound.soundAlbumId = waitCacheFirstOne.albumId;
            if (newCacheSound.sort <= 5) {
              // 前5个自动缓存
              newCacheSound.cacheStatus = 'WaitUpload';
            } else {
              newCacheSound.cacheStatus = 'Init';
            }

            console.log(
              `cacheSoundAlbums准备保存的数据如下newCacheSound：${JSON.stringify(newCacheSound)}`,
            );
            await this.cacheSoundsRepository.save(newCacheSound);
          }
        }
      }

      waitCacheFirstOne.cacheStatus = 'Done';
      waitCacheFirstOne.cacheCheckTime = dayjs().toDate();
      this.cacheSoundAlbumRepository.save(waitCacheFirstOne);
    } catch (err) {
      console.log(`执行cacheSoundAlbums的时候发生异常：${err}`);
    }

    console.log(`cacheSoundAlbums本次任务执行完毕`);
    // 等待1秒再执行下一个任务
    this.isCacheSoundAlbumRunning = false;
  }

  // 文件下载并保存到本地
  async downloadFile(
    songUrl: string,
    localPath: string,
    fileName: string,
    songImg: string,
    platform: string,
    songId: string,
    downloadType: DownloadType,
    musicLevel: MusicLevelCode = MusicLevelCode.HIGH,
  ): Promise<void> {
    try {
      // 使用axios发送GET请求获取文件流
      const response = await axios({
        url: songUrl, // 下载的URL
        method: 'GET',
        responseType: 'stream', // 将响应类型设置为流
      });

      // 创建一个可写流，将文件保存到本地
      const writer = fs.createWriteStream(localPath + fileName);
      // 创建一个 Promise 来控制整个下载过程
      await new Promise<void>((resolve, reject) => {
        // 将响应的文件流管道到本地文件
        response.data.pipe(writer);

        // 当文件写入完成
        writer.on('finish', async () => {
          try {
            console.log('音乐或声音文件已成功下载到：', localPath + fileName);
            const firstPath = Math.floor(Math.random() * 1000) + 1;
            const secondPath = Math.floor(Math.random() * 1000) + 1;
            const thirdPath = Math.floor(Math.random() * 1000) + 1;
            const cloudPath = `${firstPath}/${secondPath}/${thirdPath}/`;

            await WebDAVClient.tryCreateRootPathIfNotExist();
            await WebDAVClient.tryCreateDirectoryIfNotExist(`${firstPath}/`);
            await WebDAVClient.tryCreateDirectoryIfNotExist(
              `${firstPath}/${secondPath}/`,
            );
            await WebDAVClient.tryCreateDirectoryIfNotExist(
              `${firstPath}/${secondPath}/${thirdPath}/`,
            );

            await WebDAVClient.uploadFile(
              localPath + fileName,
              cloudPath + fileName,
            );

            if (downloadType === 'music') {
              const cacheSong = await this.cacheSongRepository.findOne({
                where: { platform, songId },
              });
              cacheSong.cacheStatus = 'Done';
              if (musicLevel === MusicLevelCode.HIGH) {
                cacheSong.cachePath = cloudPath + fileName;
              }
              if (musicLevel === MusicLevelCode.NO_LOSS) {
                cacheSong.cacheNoLossPath = cloudPath + fileName;
              }
              if (musicLevel === MusicLevelCode.SURROUND) {
                cacheSong.cacheSurroundPath = cloudPath + fileName;
              }

              await this.cacheSongRepository.save(cacheSong);
              console.log(`歌曲缓存信息记录成功，准备删除本地下载文件`);
            } else {
              const cacheSound = await this.cacheSoundsRepository.findOne({
                where: { platform, songId },
              });
              cacheSound.cacheStatus = 'Done';
              cacheSound.cachePath = cloudPath + fileName;
              await this.cacheSoundsRepository.save(cacheSound);
              console.log(`声音缓存信息记录成功，准备删除本地下载文件`);
            }

            fs.unlink(`${localPath}${fileName}`, err => {
              if (err) {
                console.error(
                  `删除文件${localPath}${fileName}时发生错误:`,
                  err,
                );
              } else {
                console.log(`文件${localPath}${fileName}已成功删除`);
              }
            });

            resolve(); // 确保方法执行结束
          } catch (err) {
            reject(err); // 捕获并拒绝 Promise
          }
        });

        // 处理文件写入错误
        writer.on('error', err => {
          reject(err); // 发生错误时拒绝 Promise
        });
      });
    } catch (error) {
      console.error('下载文件失败：', error);
      if (downloadType === 'music') {
        const cacheSong = await this.cacheSongRepository.findOne({
          where: { platform, songId },
        });
        cacheSong.cacheStatus = 'Done';
        if (musicLevel === MusicLevelCode.HIGH) {
          cacheSong.cachePath = 'failed';
        }
        if (musicLevel === MusicLevelCode.NO_LOSS) {
          cacheSong.cacheNoLossPath = 'failed';
        }
        if (musicLevel === MusicLevelCode.SURROUND) {
          cacheSong.cacheSurroundPath = 'failed';
        }

        await this.cacheSongRepository.save(cacheSong);
        console.log(`因为文件下载失败，歌曲缓存信息记录为failed~`);
      }
    }
  }
}
