import { IsEnum, IsString } from 'class-validator';
import { ThirdPlatformType } from '../enums/platform-type.enum';

export class ImportSongs {
  platform: string;

  @IsString({ message: 'url无效，期望是string类型' })
  url: string;
}
