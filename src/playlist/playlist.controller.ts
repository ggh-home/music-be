import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UserDecorator } from 'src/global_configs/user.decorator';
import { BookmarkPlaylistDto } from './dto/bookmark-playlist.dto';
import { RemoveSongDto } from './dto/remove-song.dto';
import { AddSongDto } from './dto/add-song.dto';
import { SuccessCode } from 'src/enums/success-code.enum';
import { UnBookmarkPlaylistDto } from './dto/un-bookmark-playlist.dto';
import { ImportSongs } from './dto/import-songs.dto';

@Controller('playlist')
export class PlaylistController {
  // eslint-disable-next-line prettier/prettier
  constructor(private readonly playlistService: PlaylistService) {}

  // GET /all 获取所有歌单

  @Get('/all/:playListType')
  async getAllPlaylists(
    @UserDecorator() user,
    @Param('playListType') playListType,
  ) {
    return this.playlistService.getAllPlaylists(playListType, user.id);
  }

  // POST /create 创建歌单
  @Post('/create')
  async create(
    @UserDecorator() user,
    @Body() createPlaylistDto: CreatePlaylistDto,
  ) {
    await this.playlistService.create(createPlaylistDto, user.id);
    return SuccessCode.SUCCESS;
  }

  // POST /like 收藏歌单
  @Post('/bookmark')
  async bookmark(
    @UserDecorator() user,
    @Body() bookmarkPlaylistDto: BookmarkPlaylistDto,
  ) {
    await this.playlistService.bookmarkPlaylist(bookmarkPlaylistDto, user.id);
    return SuccessCode.SUCCESS;
  }

  @Post('/un-bookmark')
  async unBookmark(
    @UserDecorator() user,
    @Body() unBookmarkPlaylistDto: UnBookmarkPlaylistDto,
  ) {
    await this.playlistService.unBookmarkPlaylist(
      unBookmarkPlaylistDto,
      user.id,
    );
    return SuccessCode.SUCCESS;
  }

  // POST /delete // 删除歌单
  @Post('/delete')
  async delete(
    @UserDecorator() user,
    @Body('id') id: number,
  ): Promise<boolean> {
    return this.playlistService.delete(id, user.id);
  }

  // POST  从指定歌单取消收藏
  @Post('/remove-song')
  async removeSong(
    @UserDecorator() user,
    @Body() removeSong: RemoveSongDto,
  ): Promise<boolean> {
    console.log(`remove song:${JSON.stringify(removeSong)}`);
    return this.playlistService.removeSong(removeSong, user.id);
  }

  // 收藏歌曲到指定歌单
  @Post('/add-song')
  async addSong(@UserDecorator() user, @Body() addSong: AddSongDto) {
    await this.playlistService.addSong(addSong, user.id);
    return SuccessCode.SUCCESS;
  }

  @Get('/songs/:playListId')
  async getPlaylistAllSongs(
    @UserDecorator() user,
    @Param('playListId') playListId,
  ) {
    return this.playlistService.getAllSongs(playListId, user.id);
  }

  @Get('/all-bookmarked-songs')
  async getAllBookmarkedSongs(@UserDecorator() user) {
    return this.playlistService.getAllBookmarkedSongs(user.id);
  }

  @Get('/check-heart/:platform/:songId')
  async checkHeart(
    @UserDecorator() user,
    @Param('platform') platform: string,
    @Param('songId') songId: string,
  ) {
    return this.playlistService.checkHeart(platform, songId, user.id);
  }

  // 导入歌单
  @Post('/import-songs')
  async importSongs(@UserDecorator() user, @Body() importSongs: ImportSongs) {
    await this.playlistService.importSongs(importSongs, user);
    return SuccessCode.SUCCESS;
  }
}
