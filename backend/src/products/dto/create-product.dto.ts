import { 
  IsString, 
  IsNumber, 
  IsBoolean, 
  IsArray, 
  IsOptional, 
  IsNotEmpty, 
  ValidateNested, 
  IsDate,
  Min,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';

// 基本信息
class BasicInfoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsBoolean()
  negotiable: boolean;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsString()
  @IsOptional()
  video?: string;

  @IsString()
  @IsOptional()
  virtualTour?: string;
}

// 坐標
class CoordinatesDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

// 周邊設施
class SurroundingsDto {
  @IsBoolean()
  parking: boolean;

  @IsBoolean()
  temple: boolean;

  @IsBoolean()
  restaurant: boolean;

  @IsArray()
  @IsString({ each: true })
  transportation: string[];
}

// 位置信息
class LocationDto {
  @IsString()
  @IsNotEmpty()
  cemetery: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;

  @ValidateNested()
  @Type(() => SurroundingsDto)
  surroundings: SurroundingsDto;
}

// 風水信息
class FengShuiDto {
  @IsString()
  @IsOptional()
  orientation?: string;

  @IsArray()
  @IsString({ each: true })
  environment: string[];

  @IsArray()
  @IsString({ each: true })
  features: string[];
}

// 特點信息
class FeaturesDto {
  @IsString()
  @IsNotEmpty()
  productType: string;

  @IsString()
  @IsNotEmpty()
  size: string;

  @IsString()
  @IsNotEmpty()
  facing: string;

  @IsNumber()
  @IsOptional()
  floor?: number;

  @IsString()
  @IsNotEmpty()
  religion: string;

  @ValidateNested()
  @Type(() => FengShuiDto)
  feng_shui: FengShuiDto;
}

// 法律信息
class LegalInfoDto {
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @IsString()
  @IsNotEmpty()
  ownershipCertificate: string;

  @IsArray()
  @IsString({ each: true })
  propertyRights: string[];

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @IsBoolean()
  @IsOptional()
  transferable?: boolean;

  @IsArray()
  @IsString({ each: true })
  restrictions: string[];
}

// 驗證文件
class VerificationDto {
  @IsArray()
  @IsString({ each: true })
  documents: string[];
}

// 主要 DTO
export class CreateProductDto {
  @ValidateNested()
  @Type(() => BasicInfoDto)
  basicInfo: BasicInfoDto;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ValidateNested()
  @Type(() => FeaturesDto)
  features: FeaturesDto;

  @ValidateNested()
  @Type(() => LegalInfoDto)
  legalInfo: LegalInfoDto;

  @ValidateNested()
  @Type(() => VerificationDto)
  verification: VerificationDto;

  @IsEnum(['draft', 'published', 'reserved', 'sold'], { message: '狀態必須是draft、published、reserved或sold' })
  status: 'draft' | 'published' | 'reserved' | 'sold';
} 