import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ThirdPlatformType } from '../enums/platform-type.enum';

export class RemoveSongDto {
  @IsString({ message: 'removeSongId无效，期望是string类型' })
  removeSongRefId: string;

  @IsString({ message: 'removePlatform无效，期望是string类型' })
  @IsEnum(ThirdPlatformType, { message: '不支持的removePlatform' })
  removePlatform: string;

  @IsOptional()
  @IsNumber({}, { message: 'removePlayListId无效，期望是number类型' })
  removePlayListId: number;

  @IsOptional()
  @IsBoolean({ message: 'removeFromFavorite无效，期望是boolean类型' })
  removeFromFavorite: boolean;
}
