import { Injectable } from '@nestjs/common';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { Repository } from 'typeorm';

import { CustomBadRequestException } from 'src/global_configs/custom.exception';
import { ErrorCode } from 'src/enums/error-code.enum';
import { BookmarkPlaylistDto } from './dto/bookmark-playlist.dto';
import { RemoveSongDto } from './dto/remove-song.dto';
import { PlaylistSong } from './entities/playlist-songs.entity';
import { PlaylistType } from './enums/playlist-type.enum';
import { AddSongDto } from './dto/add-song.dto';
import { isEmpty } from 'lodash';
import { UnBookmarkPlaylistDto } from './dto/un-bookmark-playlist.dto';
import { ImportSongs } from './dto/import-songs.dto';
import { SearchService } from 'src/search/search.service';
import { User } from 'src/user/entities/user.entity';
import { ThirdPlatformType } from './enums/platform-type.enum';

@Injectable()
export class PlaylistService {
  constructor(
    private readonly searchService: SearchService,
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,

    @InjectRepository(PlaylistSong)
    private readonly playlistSongReposity: Repository<PlaylistSong>,
  ) {}

  async getAllPlaylists(playlistType, userId: number) {
    const allPlaylists = await this.playlistRepository.find({
      where: { userId },
    });
    if (isEmpty(allPlaylists)) {
      return [];
    }
    if (playlistType === PlaylistType.ALL) {
      return allPlaylists;
    }
    const result = [];
    if (playlistType === PlaylistType.CUSTOM) {
      const favoritePlaylist = allPlaylists.filter(
        item => item.type === PlaylistType.FAVORITE,
      );
      result.push(...favoritePlaylist);
      const customPlaylist = allPlaylists.filter(
        item => item.type === PlaylistType.CUSTOM,
      );
      result.push(...customPlaylist);
    }

    if (playlistType === PlaylistType.THIRD_PLATFORM) {
      const thirdPlaylist = allPlaylists.filter(
        item => item.type === PlaylistType.THIRD_PLATFORM,
      );
      result.push(...thirdPlaylist);
    }

    return result;
  }

  async create(createPlaylistDto: CreatePlaylistDto, userId: number) {
    const existPlaylist = await this.playlistRepository.findOne({
      where: {
        userId,
        playListName: createPlaylistDto.playListName,
        type: PlaylistType.CUSTOM,
      },
    });

    if (existPlaylist) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.PLAYLIST_EXIST,
      });
    }
    const newPlaylist = this.playlistRepository.create(createPlaylistDto);
    newPlaylist.type = PlaylistType.CUSTOM;
    newPlaylist.userId = userId;
    return this.playlistRepository.save(newPlaylist);
  }

  async bookmarkPlaylist(
    bookmarkPlaylistDto: BookmarkPlaylistDto,
    userId: number,
  ) {
    const existPlaylist = await this.playlistRepository.findOne({
      where: {
        userId,
        type: PlaylistType.THIRD_PLATFORM,
        playListId: bookmarkPlaylistDto.playListId,
        platform: bookmarkPlaylistDto.platform,
      },
    });
    if (existPlaylist) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.PLAYLIST_BOOKMARKED,
      });
    }
    const newPlaylist = this.playlistRepository.create(bookmarkPlaylistDto);
    newPlaylist.userId = userId;
    newPlaylist.type = PlaylistType.THIRD_PLATFORM;
    return this.playlistRepository.save(newPlaylist);
  }

  async unBookmarkPlaylist(
    unBookmarkPlaylistDto: UnBookmarkPlaylistDto,
    userId: number,
  ) {
    const existPlaylist = await this.playlistRepository.findOne({
      where: {
        userId,
        type: PlaylistType.THIRD_PLATFORM,
        playListId: unBookmarkPlaylistDto.playListId,
        platform: unBookmarkPlaylistDto.platform,
      },
    });
    if (!existPlaylist) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.DATA_NOT_FOUND,
      });
    }
    const result = this.playlistRepository.delete(existPlaylist.id);
    return (await result).affected > 0;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const deletePlaylist = await this.playlistRepository.findOne({
      where: { id: id },
    });
    if (!deletePlaylist) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.DATA_NOT_FOUND,
      });
    }
    if (deletePlaylist.userId !== userId) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.NOT_AUTH,
      });
    }
    if (PlaylistType.FAVORITE === deletePlaylist.type) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.FORBIDDEN,
      });
    }
    const playlistDeleteResult = await this.playlistRepository.delete(id);
    const songDeleteResult = await this.playlistSongReposity.delete({
      playListId: id,
    });

    return playlistDeleteResult.affected > 0 || songDeleteResult.affected > 0;
  }

  async removeSong(removeSong: RemoveSongDto, userId: number) {
    if (removeSong.removeFromFavorite) {
      const favoritePlaylist = await this.playlistRepository.findOne({
        where: { type: PlaylistType.FAVORITE, userId: userId },
      });
      if (!favoritePlaylist) {
        throw new CustomBadRequestException({
          errCode: ErrorCode.DATA_NOT_FOUND,
        });
      }
      removeSong.removePlayListId = favoritePlaylist.id;
    }

    const deleteSong = await this.playlistSongReposity.findOne({
      where: {
        userId: userId,
        songId: removeSong.removeSongRefId,
        platform: removeSong.removePlatform,
        playListId: removeSong.removePlayListId,
      },
    });
    if (!deleteSong) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.DATA_NOT_FOUND,
      });
    }
    const playList = await this.playlistRepository.findOne({
      where: { id: deleteSong.playListId },
    });
    if (playList.userId !== userId) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.NOT_AUTH,
      });
    }
    const result = await this.playlistSongReposity.delete(deleteSong.id);
    return result.affected > 0;
  }

  async addSong(addSong: AddSongDto, userId: number) {
    if (addSong.addToFavorite) {
      const favoritePlaylist = await this.playlistRepository.findOne({
        where: { type: PlaylistType.FAVORITE, userId: userId },
      });
      if (!favoritePlaylist) {
        const newFavoritePlaylist = this.playlistRepository.create();
        newFavoritePlaylist.userId = userId;
        newFavoritePlaylist.type = PlaylistType.FAVORITE;
        newFavoritePlaylist.playListName = '我的红心歌单';
        addSong.playListId = (
          await this.playlistRepository.save(newFavoritePlaylist)
        ).id;
      } else {
        addSong.playListId = favoritePlaylist.id;
      }
    }

    const existPlaylistSong = await this.playlistSongReposity.findOne({
      where: {
        playListId: addSong.playListId,
        songId: addSong.songId,
        platform: addSong.platform,
      },
    });
    if (existPlaylistSong) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.PLAYLIST_SONG_EXIST,
      });
    }
    const newPlaylistSong = this.playlistSongReposity.create(addSong);
    newPlaylistSong.userId = userId;
    return this.playlistSongReposity.save(newPlaylistSong);
  }

  async getAllSongs(playlistId, userId) {
    const playList = await this.playlistRepository.findOne({
      where: { id: playlistId },
    });
    if (!playList) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.DATA_NOT_FOUND,
      });
    }
    if (playList.userId !== userId) {
      throw new CustomBadRequestException({ errCode: ErrorCode.NOT_AUTH });
    }
    return await this.playlistSongReposity.find({
      where: { playListId: playlistId },
    });
  }

  async getAllBookmarkedSongs(userId: number) {
    return await this.playlistSongReposity.find({
      select: ['platform', 'songId'],
      where: { userId: userId },
    });
  }

  async checkHeart(
    platform: string,
    songId: string,
    userId: number,
  ): Promise<boolean> {
    const heartPlayList = await this.playlistRepository.findOne({
      where: { userId: userId, type: PlaylistType.FAVORITE },
    });
    if (isEmpty(heartPlayList)) {
      return false;
    }

    const existPlayListSong = await this.playlistSongReposity.find({
      where: {
        platform: platform,
        songId: songId,
        userId: userId,
        playListId: heartPlayList.id,
      },
    });

    return !isEmpty(existPlayListSong);
  }

  async importSongs(importSongs: ImportSongs, user: User) {
    const rawUrl = importSongs.url;
    const urlMatch = rawUrl.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      importSongs.url = urlMatch[0];
    } else {
      throw new CustomBadRequestException({
        errCode: ErrorCode.PLAYLIST_SONG_IMPORT_URL_ERROR,
      });
    }

    // 识别ＱＱ还是网易云
    if (importSongs.url.includes('qq.com')) {
      importSongs.platform = ThirdPlatformType.QQ;
    } else if (importSongs.url.includes('163.com')) {
      importSongs.platform = ThirdPlatformType.WYY;
    }
    if (isEmpty(importSongs.platform)) {
      throw new CustomBadRequestException({
        errCode: ErrorCode.PLAYLIST_SONG_IMPORT_PLATFORM_ERROR,
      });
    }

    const importSongsResult = await this.searchService
      .getTargetPlatform(importSongs.platform)
      .importSongs(importSongs);
    // 创建网络歌单，然后依次导入歌曲
    return await this.bookmarkPlaylist(
      {
        playListName: importSongsResult.playlistName,
        playListImg: importSongsResult.playlistImg,
        playListId: importSongsResult.playlistId,
        platform: importSongs.platform,
      },
      user.id,
    );
    // for (const importSong of importSongsResult?.importSongs) {
    //   //console.log(`准备添加歌单，歌曲信息：${JSON.stringify(importSong)}`);
    //   await this.addSong(
    //     {
    //       playListId: newPlaylist.id,
    //       platform: importSongs.platform,
    //       songId: importSong.songId,
    //       songTitle: importSong.songTitle,
    //       singerName: importSong.singerName,
    //       songImg: importSong.songImg,
    //       albumId: importSong.albumId,
    //       albumTitle: importSong.albumTitle,
    //       valid: importSong.valid,
    //       rawDetail: importSong,
    //       addToFavorite: false,
    //     },
    //     user.id,
    //   );
    // }
  }
}
