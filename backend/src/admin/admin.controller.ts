import { 
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { ProductsService } from '../products/products.service';
import { ProductResponseDto } from '../products/dto/product-response.dto';

// 定義審核歷史相關接口
interface ReviewHistoryBase {
  _id?: string;
  action: 'approve' | 'reject' | 'needs_info';
  note: string;
  createdAt: Date;
}

interface AdminResponse {
  _id?: string;
  email?: string;
  name?: string;
}

interface ProductInfo {
  _id?: string;
  basicInfo?: {
    title: string;
  };
}

interface ReviewHistoryDetailResponse extends ReviewHistoryBase {
  productId: string | ProductInfo;
  adminId: string | AdminResponse;
}

interface ReviewHistoryPaginatedResponse {
  history: ReviewHistoryDetailResponse[];
  total: number;
  page: number;
  totalPages: number;
}

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    permissions?: {
      canReviewProducts: boolean;
      canManageUsers: boolean;
      canViewStatistics: boolean;
      canManageSettings: boolean;
    };
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly productsService: ProductsService,
  ) {}

  // 產品審核相關路由
  @Post('products/:id/approve')
  async approveProduct(
    @Param('id') id: string,
    @Body() data: { reviewNote?: string },
    @Request() req: RequestWithUser,
  ): Promise<ProductResponseDto> {
    const logger = new Logger('AdminController');
    
    try {
      logger.log(`開始處理商品批准請求，商品ID: ${id}, 管理員ID: ${req.user.id}`);
      
      // 檢查權限
      if (!req.user.permissions?.canReviewProducts) {
        logger.warn(`管理員 ${req.user.id} 缺少審核權限，拒絕操作`);
        throw new HttpException('沒有權限審核產品', HttpStatus.FORBIDDEN);
      }
      
      // 審核通過
      logger.log(`權限驗證通過，執行商品批准操作`);
      const result = await this.adminService.approveProduct(id, req.user.id, data.reviewNote);
      
      logger.log(`商品批准成功，商品ID: ${id}`);
      return result;
    } catch (error) {
      logger.error(`商品批准處理失敗: ${error.message || '未知錯誤'}`, error.stack || '');
      
      // 根據錯誤類型返回適當的 HTTP 狀態碼
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      } else if (error instanceof ForbiddenException) {
        throw new HttpException(error.message, HttpStatus.FORBIDDEN);
      } else {
        throw new HttpException('處理商品批准請求時發生錯誤', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  @Post('products/:id/reject')
  async rejectProduct(
    @Param('id') id: string,
    @Body() data: { rejectionReason: string },
    @Request() req: RequestWithUser,
  ): Promise<ProductResponseDto> {
    // 檢查權限
    if (!req.user.permissions?.canReviewProducts) {
      throw new Error('沒有權限審核產品');
    }
    
    // 拒絕產品
    return this.adminService.rejectProduct(id, req.user.id, data.rejectionReason);
  }

  @Post('products/:id/request-info')
  async requestMoreInfo(
    @Param('id') id: string,
    @Body() data: { message: string },
    @Request() req: RequestWithUser,
  ): Promise<ProductResponseDto> {
    // 檢查權限
    if (!req.user.permissions?.canReviewProducts) {
      throw new Error('沒有權限審核產品');
    }
    
    // 請求更多資訊
    return this.adminService.requestMoreInfo(id, req.user.id, data.message);
  }

  @Get('products/:id/review-history')
  async getReviewHistory(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<any[]> {
    // 檢查權限
    if (!req.user.permissions?.canReviewProducts) {
      throw new Error('沒有權限查看審核歷史');
    }
    
    // 獲取審核歷史
    return this.adminService.getProductReviewHistory(id);
  }

  @Get('products/review-history')
  async getAllReviewHistory(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req: RequestWithUser,
  ): Promise<ReviewHistoryPaginatedResponse> {
    // 檢查權限
    if (!req.user.permissions?.canReviewProducts) {
      throw new Error('沒有權限查看審核歷史');
    }
    
    // 獲取所有審核歷史
    return await this.adminService.getAllReviewHistory(Number(page), Number(limit));
  }

  @Post('products/:id/mark')
  async markProduct(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ProductResponseDto> {
    // 檢查權限
    if (!req.user.permissions?.canReviewProducts) {
      throw new Error('沒有權限標記產品');
    }
    
    // 標記產品
    return this.adminService.markProduct(id);
  }

  @Post('products/:id/unmark')
  async unmarkProduct(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ProductResponseDto> {
    // 檢查權限
    if (!req.user.permissions?.canReviewProducts) {
      throw new Error('沒有權限取消標記產品');
    }
    
    // 取消標記產品
    return this.adminService.unmarkProduct(id);
  }

  @Get('products/pending-count')
  async getPendingProductsCount(
    @Request() req: RequestWithUser,
  ): Promise<{ count: number }> {
    const logger = new Logger('AdminController');
    
    try {
      // 檢查權限
      if (!req.user.permissions?.canReviewProducts) {
        throw new HttpException('沒有權限查看待審核產品數量', HttpStatus.FORBIDDEN);
      }
      
      // 獲取待審核產品數量
      const count = await this.adminService.getPendingProductsCount();
      logger.log(`成功獲取待審核商品數量: ${count}`);
      return { count };
    } catch (error) {
      logger.error(`獲取待審核產品數量失敗: ${error.message || error}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('獲取待審核產品數量失敗', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 