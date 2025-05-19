import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';
import { ProductResponseDto } from '../products/dto/product-response.dto';

// 定義響應類型，與前端期望的格式一致
interface ProductsResponse {
  products: ProductResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}

// 定義請求類型接口
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// 產品相關收藏控制器
@Controller('products/:productId/favorites')
export class ProductFavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // 添加收藏
  @UseGuards(JwtAuthGuard)
  @Post()
  async addToFavorites(
    @Request() req: RequestWithUser,
    @Param('productId') productId: string,
  ): Promise<{ success: boolean }> {
    const userId = new Types.ObjectId(req.user.id);
    const createFavoriteDto = new CreateFavoriteDto();
    createFavoriteDto.productId = new Types.ObjectId(productId);
    await this.favoritesService.create(userId, createFavoriteDto);
    return { success: true };
  }

  // 移除收藏
  @UseGuards(JwtAuthGuard)
  @Delete()
  async removeFromFavorites(
    @Request() req: RequestWithUser,
    @Param('productId') productId: string,
  ): Promise<{ success: boolean }> {
    const userId = new Types.ObjectId(req.user.id);
    await this.favoritesService.remove(userId, productId);
    return { success: true };
  }

  // 檢查是否已收藏
  @UseGuards(JwtAuthGuard)
  @Get()
  async isFavorite(
    @Request() req: RequestWithUser,
    @Param('productId') productId: string,
  ): Promise<{ isFavorite: boolean }> {
    const userId = new Types.ObjectId(req.user.id);
    const isFavorite = await this.favoritesService.checkIsFavorite(
      userId,
      productId,
    );
    return { isFavorite };
  }
}

// 用戶收藏控制器
@Controller('user/favorites')
export class UserFavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // 獲取用戶的所有收藏
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserFavorites(
    @Request() req: RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<ProductsResponse> { 
    const userId = new Types.ObjectId(req.user.id);
    
    const favoritesResponse = await this.favoritesService.findAll(
      userId,
      +page,
      +limit,
    );
    
    // 將 favorites 格式轉換為前端預期的 products 格式
    const products: ProductResponseDto[] = [];
    
    // 處理每個收藏的產品詳情
    for (const favorite of favoritesResponse.favorites) {
      try {
        // 獲取完整產品資訊
        const product = await this.favoritesService.getProductDetail(
          favorite.productId,
        );
        
        // 標記為已收藏
        if (product) {
          product.isFavorited = true;
          products.push(product);
        }
      } catch {
        // 如果無法獲取產品詳情，則忽略此收藏
        console.error(`無法獲取產品 ${favorite.productId} 的詳情`);
      }
    }
    
    return {
      products,
      total: favoritesResponse.total,
      page: favoritesResponse.page,
      totalPages: favoritesResponse.totalPages,
    };
  }
}
