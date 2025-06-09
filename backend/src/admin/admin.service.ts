import { Injectable, NotFoundException, ForbiddenException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { ProductResponseDto } from '../products/dto/product-response.dto';
import { Document } from 'mongoose';
import { RolesService } from '../roles/roles.service';
import { PermissionsService } from '../permissions/permissions.service';
import { UsersService } from '../users/users.service';
import { RoleDocument } from '../roles/entities/role.entity';

// 定義產品狀態類型
type ProductStatus = 'draft' | 'pending' | 'published' | 'reserved' | 'negotiating' | 'inspecting' | 'completed' | 'rejected' | 'sold' | 'deleted';

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
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel('ReviewHistory') private reviewHistoryModel: Model<ReviewHistoryDocument>,
    private readonly productsService: ProductsService,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    // 初始化角色和權限系統
    try {
      this.logger.log('初始化權限和角色系統...');
      await this.permissionsService.initializeDefaultPermissions();
      await this.rolesService.initializeDefaultRoles();
      this.logger.log('權限和角色系統初始化完成');
      
      // 確保創辦人帳戶有超級管理員角色
      await this.ensureFounderHasSuperAdminRole();
    } catch (error) {
      this.logger.error('初始化權限系統失敗', error.message);
    }
  }
  
  private async ensureFounderHasSuperAdminRole() {
    try {
      const founderEmail = 'paul@mumu.com';
      
      try {
        const founder = await this.usersService.findByEmail(founderEmail);
        
        if (founder) {
          // 獲取超級管理員角色
          const superAdminRoleName = '超級管理員';
          const roleResult = await this.rolesService.findByName(superAdminRoleName);
          
          // 直接使用Mongoose模型對象，而不是轉換的對象
          if (roleResult) {
            // 獲取Mongoose模型對象中的_id
            const roleDoc = roleResult as unknown as RoleDocument;
            const roleId = roleDoc._id ? roleDoc._id.toString() : null;
            
            if (roleId) {
              founder.roleId = roleId;
              await founder.save();
              
              this.logger.log(`已成功分配超級管理員角色給創辦人 (${founderEmail})`);
            }
          }
        }
      } catch (error) {
        this.logger.error(`查找創始人賬戶失敗: ${error.message}`);
      }
    } catch (error) {
      this.logger.error('設置創辦人角色失敗', error.message);
    }
  }

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

  /**
   * 標記商品
   */
  async markProduct(productId: string): Promise<ProductResponseDto> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`ID為 ${productId} 的商品不存在`);
    }

    // 設置標記
    product['isMarked'] = true;
    
    // 保存產品
    const updatedProduct = await product.save();

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
      isMarked: true,
    };

    return response;
  }

  /**
   * 取消標記商品
   */
  async unmarkProduct(productId: string): Promise<ProductResponseDto> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`ID為 ${productId} 的商品不存在`);
    }

    // 取消標記
    product['isMarked'] = false;
    
    // 保存產品
    const updatedProduct = await product.save();

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
      isMarked: false,
    };

    return response;
  }

  /**
   * 獲取待審核商品數量
   */
  async getPendingProductsCount(): Promise<number> {
    return this.productModel.countDocuments({ status: 'pending' });
  }

  // 待審核商品數量
  async countPendingProducts(): Promise<number> {
    return this.productModel.countDocuments({ 
      status: 'pending',
      'verification.status': 'pending'
    }).exec();
  }

  // 獲取待審核的商品
  async getPendingProducts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      this.productModel.find({ 
        status: 'pending',
        'verification.status': 'pending'
      })
        .sort({ 'metadata.createdAt': -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments({ 
        status: 'pending',
        'verification.status': 'pending'
      }).exec(),
    ]);
    
    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 獲取單個商品的審核信息
  async getProductForReview(id: string) {
    const product = await this.productModel.findById(id).exec();
    
    if (!product) {
      throw new Error('商品不存在');
    }
    
    const reviewHistory = await this.reviewHistoryModel.find({ 
      productId: id 
    }).sort({ createdAt: -1 }).exec();
    
    return {
      product,
      reviewHistory,
    };
  }

  // 審核商品
  async reviewProduct(id: string, action: 'approve' | 'reject' | 'needMoreInfo', reviewNote: string, reviewerId: string) {
    const product = await this.productModel.findById(id).exec();
    
    if (!product) {
      throw new Error('商品不存在');
    }
    
    let status: ProductStatus = product.status;
    let verificationStatus = product.verification.status;
    
    if (action === 'approve') {
      status = 'published';
      verificationStatus = 'verified';
    } else if (action === 'reject') {
      status = 'rejected';
      verificationStatus = 'rejected';
    } else if (action === 'needMoreInfo') {
      status = 'pending';
      verificationStatus = 'needs_info';
    }
    
    // 更新商品狀態
    await this.productModel.updateOne(
      { _id: id },
      { 
        $set: { 
          status: status,
          'verification.status': verificationStatus,
          'verification.reviewNote': reviewNote,
          'metadata.reviewedAt': new Date(),
          ...(status === 'published' ? { 'metadata.publishedAt': new Date() } : {})
        } 
      }
    ).exec();
    
    // 創建審核歷史記錄
    const reviewHistory = new this.reviewHistoryModel({
      productId: id,
      reviewerId,
      action,
      note: reviewNote,
      createdAt: new Date()
    });
    
    await reviewHistory.save();
    
    return {
      status,
      verificationStatus,
      reviewNote,
    };
  }
} 