import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEnum(['buyer', 'seller'], { message: 'Role must be either buyer or seller' })
  role: 'buyer' | 'seller';

  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;
} 