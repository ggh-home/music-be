//platform songId songTitle singerId singerName albumId isBookMarked
type VipType = 'Free' | 'Vip' | 'Purchse' | 'Svip';

type SoundAlbum = {
  platform: string;
  albumId: string;
  albumTitle: string;
  albumImg: string;
  releaseDate: string;
  countOfSounds: number;
  desc: string;
  vipType: VipType;
  isFinished: boolean;
  soundAlbumUpdateAt?: string;
};
