import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoriteResponseDto, FavoritesListResponseDto } from './dto/favorite-response.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: Types.ObjectId, createFavoriteDto: CreateFavoriteDto): Promise<FavoriteResponseDto> {
    try {
      // 檢查產品是否存在
      await this.productsService.findOne(createFavoriteDto.productId.toString());
      
      // 創建新收藏
      const favorite = new this.favoriteModel({
        userId,
        productId: createFavoriteDto.productId,
      });
      
      const savedFavorite = await favorite.save();
      return this.mapToDto(savedFavorite);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('您已收藏過此商品');
      }
      throw error;
    }
  }

  async findAll(userId: Types.ObjectId, page = 1, limit = 10): Promise<FavoritesListResponseDto> {
    const skip = (page - 1) * limit;
    
    // 查詢收藏總數
    const total = await this.favoriteModel.countDocuments({ userId });
    
    // 查詢收藏列表
    const favorites = await this.favoriteModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    
    // 計算總頁數
    const totalPages = Math.ceil(total / limit);
    
    // 獲取產品詳情
    const favoritesWithProducts = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          const product = await this.productsService.findOne(favorite.productId.toString());
          return {
            ...this.mapToDto(favorite),
            product: {
              title: product.basicInfo.title,
              price: product.basicInfo.price,
              image: product.basicInfo.images.length > 0 ? product.basicInfo.images[0] : '',
              status: product.status,
            },
          };
        } catch (error) {
          // 如果產品不存在，仍返回收藏數據
          return this.mapToDto(favorite);
        }
      }),
    );
    
    return {
      favorites: favoritesWithProducts,
      total,
      page,
      totalPages,
    };
  }

  async remove(userId: Types.ObjectId, productId: string): Promise<void> {
    const productObjectId = new Types.ObjectId(productId);
    
    const result = await this.favoriteModel.deleteOne({
      userId,
      productId: productObjectId,
    });
    
    if (result.deletedCount === 0) {
      throw new NotFoundException('未找到該收藏記錄');
    }
  }

  async checkIsFavorite(userId: Types.ObjectId, productId: string): Promise<boolean> {
    const productObjectId = new Types.ObjectId(productId);
    
    const favorite = await this.favoriteModel.findOne({
      userId,
      productId: productObjectId,
    });
    
    return !!favorite;
  }

  // 獲取產品詳情 - 用於返回給前端的完整產品資訊
  async getProductDetail(productId: string) {
    return this.productsService.findOne(productId);
  }

  private mapToDto(favorite: FavoriteDocument): FavoriteResponseDto {
    if (!favorite || !favorite._id) {
      throw new NotFoundException('收藏記錄不存在');
    }
    
    return {
      id: favorite._id.toString(),
      userId: favorite.userId.toString(),
      productId: favorite.productId.toString(),
      isNotified: favorite.isNotified,
      createdAt: favorite.createdAt instanceof Date ? favorite.createdAt : new Date(favorite.createdAt),
      updatedAt: favorite.updatedAt instanceof Date ? favorite.updatedAt : new Date(favorite.updatedAt),
    };
  }
}
