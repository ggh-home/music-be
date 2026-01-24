//platform songId songTitle singerId singerName albumId isBookMarked
type SortType = 'ASC' | 'DESC';

type Sound = {
  platform: string;
  sort: number;
  songId: string;
  songTitle: string;
  songImg: string;
  songUrl: string;
  songLyric?: string;
  singerName: string;
  albumId: string;
  albumTitle: string;
  isBookmarked: boolean;
  songType: string;
  valid: boolean;
  cacheStatus?: CacheStatus;
};
