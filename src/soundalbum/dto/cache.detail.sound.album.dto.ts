export class CacheDetailSoundAlbumDto {
  platform: string;

  soundAlbumId: string;

  cacheStatus: CacheStatus;

  cacheCheckDate?: Date;

  countOfSounds?: number;

  cachedSounds?: number;

  cachingSounds?: number;
}
