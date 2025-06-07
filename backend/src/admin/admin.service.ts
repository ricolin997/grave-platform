import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { ProductResponseDto } from '../products/dto/product-response.dto';
import { Document, Schema as MongooseSchema } from 'mongoose';

// 定義 ReviewHistory 接口
interface ReviewHistory {
  productId: string;
  adminId: string;
  action: 'approve' | 'reject' | 'needs_info';
  note: string;
  createdAt: Date;
}

type ReviewHistoryDocument = ReviewHistory & Document;

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel('ReviewHistory') private reviewHistoryModel: Model<ReviewHistoryDocument>,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * 批准商品
   */
  async approveProduct(productId: string, adminId: string, note?: string): Promise<ProductResponseDto> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`ID為 ${productId} 的商品不存在`);
    }

    // 只有待審核狀態的商品可以被批准
    if (product.status !== 'pending') {
      throw new ForbiddenException(`只有待審核狀態的商品可以被批准，當前狀態: ${product.status}`);
    }

    // 更新商品狀態和驗證狀態
    product.status = 'published';
    product.verification = {
      status: 'verified',
      verifiedAt: new Date(),
      documents: product.verification?.documents || [],
    };
    
    // 設置發布時間
    product.metadata.publishedAt = new Date();

    // 保存產品
    const updatedProduct = await product.save();

    // 創建審核歷史記錄
    await this.createReviewHistory(productId, adminId, 'approve', note || '已通過審核');

    // 返回產品響應對象
    const response: ProductResponseDto = {
      id: updatedProduct._id.toString(),
      sellerId: updatedProduct.sellerId.toString(),
      basicInfo: updatedProduct.basicInfo,
      location: updatedProduct.location,
      features: updatedProduct.features,
      legalInfo: updatedProduct.legalInfo,
      verification: {
        status: updatedProduct.verification.status,
        documents: updatedProduct.verification.documents,
        verifiedAt: updatedProduct.verification.verifiedAt,
      },
      status: updatedProduct.status,
      statistics: updatedProduct.statistics,
      metadata: {
        createdAt: updatedProduct.createdAt,
        updatedAt: updatedProduct.updatedAt,
        publishedAt: updatedProduct.metadata?.publishedAt,
        soldAt: updatedProduct.metadata?.soldAt,
      },
    };

    return response;
  }

  /**
   * 拒絕商品
   */
  async rejectProduct(productId: string, adminId: string, reason: string): Promise<ProductResponseDto> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`ID為 ${productId} 的商品不存在`);
    }

    // 只有待審核狀態的商品可以被拒絕
    if (product.status !== 'pending') {
      throw new ForbiddenException(`只有待審核狀態的商品可以被拒絕，當前狀態: ${product.status}`);
    }

    // 更新商品狀態和驗證狀態
    product.status = 'rejected';
    product.verification = {
      status: 'rejected',
      verifiedAt: new Date(),
      documents: product.verification?.documents || [],
    };

    // 保存產品
    const updatedProduct = await product.save();

    // 創建審核歷史記錄
    await this.createReviewHistory(productId, adminId, 'reject', reason);

    // 返回產品響應對象
    const response: ProductResponseDto = {
      id: updatedProduct._id.toString(),
      sellerId: updatedProduct.sellerId.toString(),
      basicInfo: updatedProduct.basicInfo,
      location: updatedProduct.location,
      features: updatedProduct.features,
      legalInfo: updatedProduct.legalInfo,
      verification: {
        status: updatedProduct.verification.status,
        documents: updatedProduct.verification.documents,
        verifiedAt: updatedProduct.verification.verifiedAt,
      },
      status: updatedProduct.status,
      statistics: updatedProduct.statistics,
      metadata: {
        createdAt: updatedProduct.createdAt,
        updatedAt: updatedProduct.updatedAt,
        publishedAt: updatedProduct.metadata?.publishedAt,
        soldAt: updatedProduct.metadata?.soldAt,
      },
    };

    return response;
  }

  /**
   * 請求更多資訊
   */
  async requestMoreInfo(productId: string, adminId: string, message: string): Promise<ProductResponseDto> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`ID為 ${productId} 的商品不存在`);
    }

    // 更新商品驗證狀態
    product.verification = {
      status: 'needs_info',
      verifiedAt: new Date(),
      documents: product.verification?.documents || [],
    };

    // 保存產品
    const updatedProduct = await product.save();

    // 創建審核歷史記錄
    await this.createReviewHistory(productId, adminId, 'needs_info', message);

    // 返回產品響應對象
    const response: ProductResponseDto = {
      id: updatedProduct._id.toString(),
      sellerId: updatedProduct.sellerId.toString(),
      basicInfo: updatedProduct.basicInfo,
      location: updatedProduct.location,
      features: updatedProduct.features,
      legalInfo: updatedProduct.legalInfo,
      verification: {
        status: updatedProduct.verification.status,
        documents: updatedProduct.verification.documents,
        verifiedAt: updatedProduct.verification.verifiedAt,
      },
      status: updatedProduct.status,
      statistics: updatedProduct.statistics,
      metadata: {
        createdAt: updatedProduct.createdAt,
        updatedAt: updatedProduct.updatedAt,
        publishedAt: updatedProduct.metadata?.publishedAt,
        soldAt: updatedProduct.metadata?.soldAt,
      },
    };

    return response;
  }

  /**
   * 創建審核歷史記錄
   */
  private async createReviewHistory(
    productId: string,
    adminId: string,
    action: 'approve' | 'reject' | 'needs_info',
    note: string,
  ): Promise<any> {
    const reviewHistory = new this.reviewHistoryModel({
      productId,
      adminId,
      action,
      note,
      createdAt: new Date(),
    });

    return reviewHistory.save();
  }

  /**
   * 獲取產品審核歷史
   */
  async getProductReviewHistory(productId: string) {
    const history = await this.reviewHistoryModel
      .find({ productId })
      .sort({ createdAt: -1 })
      .populate('adminId', 'email name')
      .exec();

    return history;
  }

  /**
   * 獲取所有審核歷史
   */
  async getAllReviewHistory(page: number = 1, limit: number = 10): Promise<{
    history: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      this.reviewHistoryModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'email name')
        .populate('productId', 'basicInfo.title')
        .exec(),
      this.reviewHistoryModel.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      history,
      total,
      page,
      totalPages,
    };
  }
} 