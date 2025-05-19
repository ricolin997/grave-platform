import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
} 