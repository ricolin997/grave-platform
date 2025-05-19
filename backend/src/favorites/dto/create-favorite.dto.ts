import { IsNotEmpty, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateFavoriteDto {
  @IsNotEmpty()
  @IsMongoId()
  @Transform(({ value }) => new Types.ObjectId(value))
  productId: Types.ObjectId;
} 