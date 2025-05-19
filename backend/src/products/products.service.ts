import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { User, UserDocument } from '../users/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(userId: string, createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    try {
      console.log('開始創建商品，用戶ID:', userId);
      console.log('商品資料:', JSON.stringify(createProductDto, null, 2));
      
      // 檢查用戶是否存在
      const user = await this.userModel.findById(userId);
      if (!user) {
        console.log('用戶不存在:', userId);
        throw new NotFoundException('用戶不存在');
      }

      // 檢查用戶是否為賣家
      if (user.role !== 'seller') {
        console.log('用戶不是賣家:', userId, user.role);
        throw new BadRequestException('只有賣家可以發佈商品');
      }

      // 確保 features 的屬性是字符串而不是對象
      if (typeof createProductDto.features.productType === 'object') {
        throw new BadRequestException('features.productType 必須是字符串而不是對象');
      }

      // 確保 feng_shui 屬性是對象而不是 null
      if (!createProductDto.features.feng_shui) {
        console.log('feng_shui 為空，設置默認值');
        createProductDto.features.feng_shui = {
          environment: [],
          features: [],
        };
      }

      // 確保 surroundings 屬性是對象而不是 null
      if (!createProductDto.location.surroundings) {
        console.log('surroundings 為空，設置默認值');
        createProductDto.location.surroundings = {
          parking: false,
          temple: false,
          restaurant: false,
          transportation: [],
        };
      }

      // 確保 coordinates 屬性是對象而不是 null
      if (!createProductDto.location.coordinates) {
        console.log('coordinates 為空，設置默認值');
        createProductDto.location.coordinates = {
          lat: 0,
          lng: 0,
        };
      }

      // 確保 propertyRights 和 restrictions 是數組而不是 null
      if (!createProductDto.legalInfo.propertyRights) {
        console.log('propertyRights 為空，設置默認值');
        createProductDto.legalInfo.propertyRights = [];
      }

      if (!createProductDto.legalInfo.restrictions) {
        console.log('restrictions 為空，設置默認值');
        createProductDto.legalInfo.restrictions = [];
      }

      // 確保 documents 是數組而不是 null
      if (!createProductDto.verification.documents) {
        console.log('documents 為空，設置默認值');
        createProductDto.verification.documents = [];
      }

      console.log('處理後的商品資料:', JSON.stringify(createProductDto, null, 2));

      // 創建商品
      console.log('開始創建商品模型');
      const product = new this.productModel({
        sellerId: new Types.ObjectId(userId),
        statistics: {
          views: 0,
          favorites: 0,
          compares: 0,
          inquiries: 0,
        },
        basicInfo: createProductDto.basicInfo,
        location: createProductDto.location,
        features: {
          productType: createProductDto.features.productType,
          size: createProductDto.features.size,
          facing: createProductDto.features.facing,
          floor: createProductDto.features.floor || 0,
          religion: createProductDto.features.religion,
          feng_shui: createProductDto.features.feng_shui || {
            environment: [],
            features: []
          }
        },
        legalInfo: createProductDto.legalInfo,
        verification: createProductDto.verification,
        status: createProductDto.status,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // 如果狀態是已發佈，設置發佈時間
      if (product.status === 'published') {
        console.log('設置發佈時間');
        product.metadata.publishedAt = new Date();
      }

      console.log('開始保存商品');
      // 保存商品
      const savedProduct = await product.save();
      console.log('商品保存成功:', savedProduct._id ? savedProduct._id.toString() : '未知ID');

      // 更新用戶的商品統計
      await this.userModel.findByIdAndUpdate(userId, {
        $inc: { 'statistics.listings': 1 },
      });
      console.log('更新用戶商品統計成功');

      return this.buildProductResponse(savedProduct);
    } catch (error: any) {
      console.error('創建商品失敗:', error);
      if (error.name) console.error('錯誤類型:', error.name);
      if (error.code) console.error('錯誤代碼:', error.code);
      if (error.message) console.error('錯誤消息:', error.message);
      if (error.stack) console.error('錯誤堆疊:', error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      // 檢查是否是 MongoDB 驗證錯誤
      if (error.name === 'ValidationError' && error.errors) {
        console.error('驗證錯誤:', error.errors);
        const validationErrors: Record<string, string> = {};
        for (const field in error.errors) {
          if (Object.prototype.hasOwnProperty.call(error.errors, field) && 
              error.errors[field] && error.errors[field].message) {
            console.error(`欄位 ${field} 錯誤:`, error.errors[field].message);
            validationErrors[field] = error.errors[field].message;
          }
        }
        throw new BadRequestException({
          message: '商品資料驗證失敗',
          errors: validationErrors
        });
      }
      
      // 檢查是否是 Mongoose 相關錯誤
      if (error.name === 'MongoServerError' || error.name === 'MongoError') {
        console.error('MongoDB 錯誤:', error);
        if (error.code === 11000) { // 唯一索引衝突
          throw new BadRequestException('已存在相同的商品');
        }
      }
      
      throw new BadRequestException({
        message: '創建商品失敗',
        error: error.message || '未知錯誤'
      });
    }
  }

  async findAll(
    query: {
      city?: string;
      district?: string;
      religion?: string;
      minPrice?: number;
      maxPrice?: number;
      type?: string;
      status?: string;
    },
    page = 1,
    limit = 10,
  ): Promise<{ products: ProductResponseDto[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      
      // 構建查詢條件
      const filter: any = { status: 'published' };  // 默認只查詢已發佈的

      if (query.city) {
        filter['location.city'] = query.city;
      }
      
      if (query.district) {
        filter['location.district'] = query.district;
      }
      
      if (query.religion) {
        filter['features.religion'] = query.religion;
      }
      
      if (query.type) {
        filter['features.productType'] = query.type;
      }
      
      if (query.minPrice || query.maxPrice) {
        filter['basicInfo.price'] = {};
        if (query.minPrice) {
          filter['basicInfo.price'].$gte = Number(query.minPrice);
        }
        if (query.maxPrice) {
          filter['basicInfo.price'].$lte = Number(query.maxPrice);
        }
      }
      
      // 管理員可以過濾狀態
      if (query.status) {
        filter.status = query.status;
      }

      // 計算總數
      const total = await this.productModel.countDocuments(filter);
      
      // 執行查詢
      const products = await this.productModel
        .find(filter)
        .sort({ 'metadata.publishedAt': -1 }) // 按發佈時間降序
        .skip(skip)
        .limit(limit)
        .exec();

      // 計算總頁數
      const totalPages = Math.ceil(total / limit);

      // 轉換為響應 DTO
      const productResponses = await Promise.all(
        products.map(async (product) => this.buildProductResponse(product, true))
      );

      return {
        products: productResponses,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      throw new BadRequestException('查詢商品失敗');
    }
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    try {
      const product = await this.productModel.findById(id);
      if (!product) {
        throw new NotFoundException('商品不存在');
      }

      // 增加瀏覽次數
      product.statistics.views += 1;
      product.statistics.lastViewed = new Date();
      await product.save();

      return this.buildProductResponse(product, true);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('查詢商品失敗');
    }
  }

  async update(id: string, userId: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    try {
      // 查找商品
      const product = await this.productModel.findById(id);
      if (!product) {
        throw new NotFoundException('商品不存在');
      }

      // 檢查是否為賣家
      if (product.sellerId.toString() !== userId) {
        throw new BadRequestException('只有賣家可以更新自己的商品');
      }

      // 如果狀態從草稿變為已發佈，設置發佈時間
      if (product.status === 'draft' && updateProductDto.status === 'published') {
        if (!product.metadata) {
          product.metadata = {};
        }
        product.metadata.publishedAt = new Date();
      }

      // 更新產品屬性
      Object.assign(product, updateProductDto);
      
      // 保存更新後的產品
      const updatedProduct = await product.save();

      return this.buildProductResponse(updatedProduct);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('更新商品失敗');
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    try {
      // 查找商品
      const product = await this.productModel.findById(id);
      if (!product) {
        throw new NotFoundException('商品不存在');
      }

      // 檢查是否為賣家
      if (product.sellerId.toString() !== userId) {
        throw new BadRequestException('只有賣家可以刪除自己的商品');
      }

      // 將狀態設為已刪除，而不是真正從數據庫中刪除
      await this.productModel.findByIdAndUpdate(id, { status: 'deleted' });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('刪除商品失敗');
    }
  }

  async getSellerProducts(
    sellerId: string,
    status?: string,
    page = 1,
    limit = 10,
  ): Promise<{ products: ProductResponseDto[]; total: number; page: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      
      // 構建查詢條件
      const filter: any = { sellerId: new Types.ObjectId(sellerId) };
      
      if (status) {
        filter.status = status;
      } else {
        // 排除已刪除的商品
        filter.status = { $ne: 'deleted' };
      }

      // 計算總數
      const total = await this.productModel.countDocuments(filter);
      
      // 執行查詢
      const products = await this.productModel
        .find(filter)
        .sort({ 'metadata.createdAt': -1 }) // 按創建時間降序
        .skip(skip)
        .limit(limit)
        .exec();

      // 計算總頁數
      const totalPages = Math.ceil(total / limit);

      // 轉換為響應 DTO
      const productResponses = await Promise.all(
        products.map(async (product) => this.buildProductResponse(product))
      );

      return {
        products: productResponses,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      throw new BadRequestException('查詢賣家商品失敗');
    }
  }

  async incrementInquiries(productId: string): Promise<void> {
    try {
      await this.productModel.findByIdAndUpdate(
        productId,
        { $inc: { 'statistics.inquiries': 1 } },
      );
    } catch (error) {
      throw new BadRequestException('增加產品詢問數失敗');
    }
  }

  async markAsSold(productId: string, userId: string): Promise<ProductResponseDto> {
    try {
      // 查找商品
      const product = await this.productModel.findById(productId);
      if (!product) {
        throw new NotFoundException('商品不存在');
      }

      // 檢查是否為賣家
      if (product.sellerId.toString() !== userId) {
        throw new BadRequestException('只有賣家可以標記自己的商品為已售出');
      }

      // 檢查商品狀態
      if (product.status === 'sold') {
        throw new BadRequestException('商品已經被標記為已售出');
      }

      if (product.status !== 'published') {
        throw new BadRequestException('只有已發佈的商品可以被標記為已售出');
      }

      // 直接更新產品並保存
      product.status = 'sold';
      if (!product.metadata) {
        product.metadata = {};
      }
      product.metadata.soldAt = new Date();
      
      const updatedProduct = await product.save();

      return this.buildProductResponse(updatedProduct);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('標記商品為已售出失敗');
    }
  }

  private async buildProductResponse(
    product: ProductDocument,
    includeSellerName = false,
  ): Promise<ProductResponseDto> {
    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    const response = {
      id: product._id.toString(),
      sellerId: product.sellerId.toString(),
      basicInfo: product.basicInfo,
      location: product.location,
      features: product.features,
      legalInfo: product.legalInfo,
      verification: {
        status: product.verification.status,
        documents: product.verification.documents,
        verifiedAt: product.verification.verifiedAt,
      },
      status: product.status,
      statistics: product.statistics,
      metadata: {
        createdAt: product.createdAt instanceof Date ? product.createdAt : new Date(product.createdAt),
        updatedAt: product.updatedAt instanceof Date ? product.updatedAt : new Date(product.updatedAt),
        publishedAt: product.metadata?.publishedAt,
        soldAt: product.metadata?.soldAt,
      },
    } as ProductResponseDto;

    // 如果需要，獲取賣家名稱
    if (includeSellerName) {
      try {
        const seller = await this.userModel.findById(product.sellerId);
        if (seller) {
          response.sellerName = seller.profile.name;
        }
      } catch (error) {
        // 忽略獲取賣家名稱的錯誤
      }
    }

    return response;
  }
} 