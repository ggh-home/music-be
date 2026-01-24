import { IsString } from 'class-validator';

export class ImportSounds {
  @IsString({ message: 'url无效，期望是string类型' })
  url: string;
}
