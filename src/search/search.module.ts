import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheSongs } from './entities/cache.songs.entity';
import { Cookies } from './entities/cookies.entity';
import { CacheSongService } from './cache.task.service';
import { SoundalbumModule } from 'src/soundalbum/soundalbum.module';
import { UtilsApiModule } from 'src/utils-api/utils.api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CacheSongs, Cookies]),
    SoundalbumModule,
    UtilsApiModule,
  ],
  controllers: [SearchController],
  providers: [SearchService, CacheSongService],
  exports: [SearchService],
})
export class SearchModule {}
