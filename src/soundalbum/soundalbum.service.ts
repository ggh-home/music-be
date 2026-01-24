import { Injectable } from '@nestjs/common';
import { BookmarkSoundAlbumDto } from './dto/bookmark.soundalbum.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SoundAlbums } from './entities/sound.albums.entity';
import { ErrorCode } from 'src/enums/error-code.enum';
import { CustomBadRequestException } from 'src/global_configs/custom.exception';
import { CacheSoundAlbums } from './entities/cache.sound.albums.entity';
import dayjs from 'dayjs';
import { PlayHistoryDto } from './dto/play.history.dto';
import { ImportSounds } from './dto/import-sounds.dto';
import { SoundPlayHistory } from './entities/sound.play.history.entity';
import axios from 'axios';
import { User } from 'src/user/entities/user.entity';
import { isEmpty } from 'class-validator';
import { SearchService } from 'src/search/search.service';
import { CacheSounds } from './entities/cache.sound.entity';
import { ThirdPlatformType } from 'src/playlist/enums/platform-type.enum';
import { CacheDetailSoundAlbumDto } from './dto/cache.detail.sound.album.dto';

@Injectable()
export class SoundalbumService {
  constructor(
    private readonly searchService: SearchService,
    @InjectRepository(SoundAlbums)
    private readonly soundAblumRepository: Repository<SoundAlbums>,
    @InjectRepository(CacheSoundAlbums)
    private readonly cacheSoundAblumRepository: Repository<CacheSoundAlbums>,
    @InjectRepository(CacheSounds)
    private readonly cacheSoundsRepository: Repository<CacheSounds>,
    @InjectRepository(SoundPlayHistory)
    private readonly soundPlaylistHistoryRepository: Repository<SoundPlayHistory>,
  ) {}

  async getCacheDetail(
    platform: string,
    soundAlbumId: string,
    userId: number,
  ): Promise<CacheDetailSoundAlbumDto> {
    const cacheDetailSoundAlbumDto: CacheDetailSoundAlbumDto = {
      platform: platform,
      soundAlbumId: soundAlbumId,
      cacheStatus: 'Not-Found',
    };
    const existCacheSoundAlbum = await this.cacheSoundAblumRepository.findOne({
      where: { albumId: soundAlbumId },
    });
    if (isEmpty(existCacheSoundAlbum)) {
      return cacheDetailSoundAlbumDto;
    }
    cacheDetailSoundAlbumDto.cacheStatus = existCacheSoundAlbum.cacheStatus;
    cacheDetailSoundAlbumDto.cacheCheckDate =
      existCacheSoundAlbum.cacheCheckTime;
    cacheDetailSoundAlbumDto.countOfSounds = existCacheSoundAlbum.countOfSounds;
    const cachedSounds = await this.cacheSoundsRepository.find({
      where: {
        soundAlbumId: existCacheSoundAlbum.albumId,
        cacheStatus: 'Done',
      },
    });
    const cachingSounds = await this.cacheSoundsRepository.find({
      where: {
        soundAlbumId: existCacheSoundAlbum.albumId,
        cacheStatus: 'Uploading',
      },
    });
    const waitCacheSounds = await this.cacheSoundsRepository.find({
      where: {
        soundAlbumId: existCacheSoundAlbum.albumId,
        cacheStatus: 'WaitUpload',
      },
    });
    cacheDetailSoundAlbumDto.cachedSounds = cachedSounds.length;
    cacheDetailSoundAlbumDto.cachingSounds =
      cachingSounds.length + waitCacheSounds.length;
    return cacheDetailSoundAlbumDto;
  }

  async cacheSound(platform: string, soundId: string, userId: number) {
    const existCacheSound = await this.cacheSoundsRepository.findOne({
      where: { platform: platform, songId: soundId },
    });
    if (existCacheSound.cacheStatus === 'Init') {
      existCacheSound.cacheStatus = 'WaitUpload';
      await this.cacheSoundsRepository.save(existCacheSound);
    }
    console.log(
      `返回了当前存在的cacheSound数据：${JSON.stringify(existCacheSound)}`,
    );
    return existCacheSound;
  }

  async importSounds(importSounds: ImportSounds, user: User) {
    console.log(`获取到url:${importSounds.url}`);
    // todo 需要添加异常处理
    const regex = /^https:\/\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]+$/;
    if (!regex.test(importSounds.url)) {
      // 非法的
      throw new CustomBadRequestException({
        errCode: ErrorCode.SOUND_ALBUM_IMPORT_URL_ERROR,
      });
    }

    // 发起 GET 请求
    const response = await axios.get(importSounds.url, {
      maxRedirects: 0, // 不允许重定向
      validateStatus: function (status) {
        return status >= 200 && status < 400; // 允许正常的响应状态码
      },
    });

    // 获取最终的重定向 URL
    const redirectedUrl = response.headers.location;
    console.log(`redirectedUrl:${redirectedUrl}`);
    const regexAlbumId = /album%2F(\d+)%3F/;
    const albumIdMatch = redirectedUrl.match(regexAlbumId);
    if (!albumIdMatch) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.SOUND_ALBUM_IMPORT_ALBUM_ID_NOT_FOUND,
      });
    }
    const albumId = albumIdMatch[1];
    console.log(`解析到albumId：${albumId}`);
    const sounds = await this.searchService.searchSoundList(
      ThirdPlatformType.XMLY,
      {
        albumId: albumId,
        platform: ThirdPlatformType.XMLY,
        albumTitle: '',
        albumImg: '',
        releaseDate: '',
        countOfSounds: 0,
        desc: '',
        vipType: undefined,
        isFinished: false,
      },
      'ASC',
      1,
      1,
      true,
    );
    if (isEmpty(sounds)) {
      console.log(`导入专辑时，通过albumId查询声音列表为空~`);
      throw new CustomBadRequestException({
        errCode: ErrorCode.SOUND_ALBUM_IMPORT_ALBUM_NOT_FOUND,
      });
    }
    const albumTitle = sounds[0].albumTitle;
    console.log(`解析到：${albumTitle}`);
    if (isEmpty(albumTitle) || isEmpty(albumId)) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.SOUND_ALBUM_IMPORT_ALBUM_NOT_FOUND,
      });
    }

    const searchSoundAlbums = await this.searchService.searchAlbumSound(
      albumTitle,
      1,
    );
    const tartgetSoundAlbum = searchSoundAlbums.find(
      item => String(item.albumId) === albumId,
    );
    if (isEmpty(tartgetSoundAlbum)) {
      console.log('无法查询到专辑信息~');
      throw new CustomBadRequestException({
        errCode: ErrorCode.SOUND_ALBUM_IMPORT_ALBUM_NOT_FOUND,
      });
    }
    await this.bookmarkSoundAlbum(
      {
        platform: tartgetSoundAlbum.platform,
        albumId: tartgetSoundAlbum.albumId,
        albumImg: tartgetSoundAlbum.albumImg,
        albumTitle: tartgetSoundAlbum.albumTitle,
        countOfSounds: tartgetSoundAlbum.countOfSounds,
        desc: tartgetSoundAlbum.desc,
        vipType: tartgetSoundAlbum.vipType,
        isFinished: tartgetSoundAlbum.isFinished,
        soundAlbumUpdateAt: tartgetSoundAlbum.soundAlbumUpdateAt,
        releaseDate: tartgetSoundAlbum.releaseDate,
      },
      user.id,
    );
  }

  async bookmarkSoundAlbum(
    bookmarkSoundAlbumDto: BookmarkSoundAlbumDto,
    userId: number,
  ) {
    // 校验有无收藏过
    const existSoundAlbum = await this.soundAblumRepository.findOne({
      where: {
        platform: bookmarkSoundAlbumDto.platform,
        albumId: bookmarkSoundAlbumDto.albumId,
        userId: userId,
      },
    });
    if (existSoundAlbum) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.SOUND_ALBUM_EXIST,
      });
    }
    // 不存在就保存
    const newSoundAlbum = await this.soundAblumRepository.create(
      bookmarkSoundAlbumDto,
    );
    newSoundAlbum.userId = userId;
    await this.soundAblumRepository.save(newSoundAlbum);

    // 转存一份数据给cache，但是cache那边说不定已经有了，所以要检查
    const existCacheSoundAlbum = await this.cacheSoundAblumRepository.findOne({
      where: {
        platform: bookmarkSoundAlbumDto.platform,
        albumId: bookmarkSoundAlbumDto.albumId,
      },
    });
    if (!existCacheSoundAlbum) {
      // 不存在，则转存一份数据
      const newCacheSoundAlbum =
        await this.cacheSoundAblumRepository.create(newSoundAlbum);
      newCacheSoundAlbum.cacheStatus = 'WaitUpload';
      newCacheSoundAlbum.cacheCheckTime = dayjs().toDate();
      await this.cacheSoundAblumRepository.save(newCacheSoundAlbum);
    }
    return;
  }

  async unBookmarkSoundAlbum(
    unBookmarkSoundAlbumDto: BookmarkSoundAlbumDto,
    userId: number,
  ) {
    // 校验有无收藏过
    const existSoundAlbum = await this.soundAblumRepository.findOne({
      where: {
        platform: unBookmarkSoundAlbumDto.platform,
        albumId: unBookmarkSoundAlbumDto.albumId,
        userId: userId,
      },
    });
    if (!existSoundAlbum) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.SOUND_ALBUM_EXIST,
      });
    }
    return await this.soundAblumRepository.delete(existSoundAlbum.id);
  }

  async getAllSoundAlbums(userId: number) {
    return await this.soundAblumRepository.find({ where: { userId: userId } });
  }

  async savePlayHistory(playHistoryDto: PlayHistoryDto, userId: number) {
    if (playHistoryDto.sort === undefined || playHistoryDto.sort === 0) {
      const cacheSound = await this.cacheSoundsRepository.findOne({
        where: {
          songId: playHistoryDto.songId,
          platform: playHistoryDto.platform,
        },
      });
      if (!isEmpty(cacheSound)) {
        playHistoryDto.sort = cacheSound.sort;
      }
    }

    let playHistory = await this.soundPlaylistHistoryRepository.findOne({
      where: {
        platform: playHistoryDto.platform,
        soundAlbumId: playHistoryDto.soundAlbumId,
        songId: playHistoryDto.songId,
        userId: userId,
      },
    });

    if (!playHistory) {
      // 不存在
      playHistory =
        await this.soundPlaylistHistoryRepository.create(playHistoryDto);
      playHistory.userId = userId;
    }
    playHistory.playDuration = playHistoryDto.playDuration;
    playHistory.playPosition = playHistoryDto.playPosition;
    playHistory.percentDesc = `${Math.round((playHistory.playPosition / playHistory.playDuration) * 100)}%`;
    await this.soundPlaylistHistoryRepository.save(playHistory);
  }

  async getAllPlayHistory(
    platform: string,
    soundAlbumId: string,
    userId: number,
  ) {
    return await this.soundPlaylistHistoryRepository.find({
      where: { platform, soundAlbumId, userId },
    });
  }
}
