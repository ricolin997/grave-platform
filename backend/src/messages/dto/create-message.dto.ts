import { IsMongoId, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateMessageDto {
  @IsNotEmpty({ message: 'productId 不能為空' })
  @IsString({ message: 'productId 必須是字符串' })
  @IsMongoId({ message: 'productId must be a mongodb id' })
  @Transform(({ value }) => {
    // 簡單檢查並轉換為字符串
    if (value instanceof Types.ObjectId) {
      return value.toString();
    }
    return value;
  })
  productId: string;

  @IsNotEmpty({ message: 'receiverId 不能為空' })
  @IsString({ message: 'receiverId 必須是字符串' })
  @IsMongoId({ message: 'receiverId must be a mongodb id' })
  @Transform(({ value }) => {
    // 簡單檢查並轉換為字符串
    if (value instanceof Types.ObjectId) {
      return value.toString();
    }
    return value;
  })
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
  
  @IsOptional()
  @IsString()
  threadId?: string;
} 