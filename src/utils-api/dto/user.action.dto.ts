import { IsString } from 'class-validator';

export class UserActionDto {
  @IsString({ message: 'action不能为空' })
  action: string;
}
