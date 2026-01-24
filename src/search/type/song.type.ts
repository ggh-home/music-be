//platform songId songTitle singerId singerName albumId isBookMarked
type SongType = 'music' | 'sound';

type Song = {
  platform: string;
  songId: string;
  songTitle: string;
  songImg: string;
  songUrl: string;
  songLyric?: string;
  singerName: string;
  albumId: string;
  albumTitle: string;
  isBookmarked: boolean;
  songType?: SongType;
  valid: boolean;
};
