import { IsString, Length } from 'class-validator';

export class CreateUserRequestDto {
  @IsString({ message: '用户名不能为空' }) // 校验字段是字符串
  @Length(2, 10, {
    message: '用户名长度应在2-10之间',
  }) // 校验长度为5到10之间
  userName: string;

  @IsString({ message: '密码不能为空' })
  @Length(5, 20, {
    message: '密码长度应在5-20之间',
  })
  password: string;

  @IsString({ message: '重复密码不能为空' })
  confirmPassword: string;
  deviceModel: string;
  systemVersion: string;
  brand: string;
}
