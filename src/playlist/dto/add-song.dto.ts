import {
  IsBoolean,
  IsEnum,
  IsJSON,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ThirdPlatformType } from '../enums/platform-type.enum';

export class AddSongDto {
  @IsOptional()
  @IsNumber({}, { message: 'playlistId无效，期望是number类型' })
  playListId: number;

  @IsString({ message: 'platform无效，期望是string类型' })
  @IsEnum(ThirdPlatformType, { message: '不支持的platform' })
  platform: string;

  @IsString({ message: 'songId无效，期望是string类型' })
  songId: string;

  @IsString({ message: 'songTitle无效，期望是string类型' })
  songTitle: string;

  @IsString({ message: 'singerName无效，期望是string类型' })
  singerName: string;

  @IsOptional()
  @IsString({ message: 'songImg无效，期望是string类型' })
  songImg: string = '';

  @IsOptional()
  songType: SongType;

  @IsString({ message: 'albumId无效，期望是string类型' })
  albumId: string;

  @IsString({ message: 'albumTitle无效，期望是string类型' })
  albumTitle: string;

  @IsBoolean({ message: 'valid无效' })
  valid: boolean;

  @IsObject({ message: 'detail格式错误，期望是一个有效的对象' })
  rawDetail: any;

  @IsOptional()
  @IsBoolean({ message: 'addToFavorite无效，期望是boolean类型' })
  addToFavorite: boolean;
}
