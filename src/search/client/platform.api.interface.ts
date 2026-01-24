import { ImportSongs } from 'src/playlist/dto/import-songs.dto';

export interface PlatformApi {
  name: string;
  searchMusic?(keyWord: string, pageNum: number): Promise<Array<Song>>;
  searchSinger?(keyWord: string, pageNum: number): Promise<Array<Singer>>;
  searchSingerSongs?(singerId: string, pageNum: number): Promise<Array<Song>>;
  searchSingerAlbums?(singerId: string, pageNum: number): Promise<Array<Album>>;
  searchAlbumDetail?(albumId: string): Promise<Array<Song>>;
  searchPlaylist?(keyWord: string, pageNum: number): Promise<Array<any>>;
  searchPlaylistSongs?(
    playListId: string,
    pageNum: number,
    pageSize: number,
  ): Promise<Array<Song>>;
  convertSong?(item): Song;
  getMusicDetail?(songId: string, cookie: string, level?: string);
  importSongs?(importSongs: ImportSongs): Promise<ImportSongsResult>;
  searchSoundAlbum?(
    keyWord: string,
    pageNum: number,
  ): Promise<Array<SoundAlbum>>;
  searchSoundList?(
    albumId: string,
    pageNum: number,
    pageSize: number,
    sort: SortType,
    cookie: string,
    bid: string,
    ctn: string,
  ): Promise<Array<Sound>>;
  getSoundDetail?(
    soundId: string,
    cookie: string,
    bid: string,
    ctn: string,
  ): Promise<any>;
}
