import { forwardRef, Module } from '@nestjs/common';
import { SoundalbumService } from './soundalbum.service';
import { SoundalbumController } from './soundalbum.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheSoundAlbums } from './entities/cache.sound.albums.entity';
import { CacheSounds } from './entities/cache.sound.entity';
import { SoundAlbums } from './entities/sound.albums.entity';
import { SoundPlayHistory } from './entities/sound.play.history.entity';
import { SearchModule } from 'src/search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CacheSoundAlbums,
      CacheSounds,
      SoundAlbums,
      SoundPlayHistory,
    ]),
    forwardRef(() => SearchModule),
  ],
  controllers: [SoundalbumController],
  providers: [SoundalbumService],
  exports: [TypeOrmModule],
})
export class SoundalbumModule {}
