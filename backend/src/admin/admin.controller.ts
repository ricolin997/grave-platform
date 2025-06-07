import { 
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Request
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
    // 檢查權限
    if (!req.user.permissions?.canReviewProducts) {
      throw new Error('沒有權限審核產品');
    }
    
    // 審核通過
    return this.adminService.approveProduct(id, req.user.id, data.reviewNote);
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
} 