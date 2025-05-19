import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Query,
  Request
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductResponseDto } from './dto/product-response.dto';

// 定義請求類型接口
interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @Request() req: RequestWithUser,
  ): Promise<ProductResponseDto> {
    const userId = req.user.id;
    return this.productsService.create(userId, createProductDto);
  }

  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('religion') religion?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    return this.productsService.findAll(
      { city, district, religion, minPrice, maxPrice, type, status },
      pageNum,
      limitNum,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: RequestWithUser,
  ): Promise<ProductResponseDto> {
    const userId = req.user.id;
    return this.productsService.update(id, userId, updateProductDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    const userId = req.user.id;
    return this.productsService.remove(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('seller/listings')
  getSellerProducts(
    @Request() req: RequestWithUser,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const userId = req.user.id;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    return this.productsService.getSellerProducts(userId, status, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/mark-as-sold')
  markAsSold(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ProductResponseDto> {
    const userId = req.user.id;
    return this.productsService.markAsSold(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/restore')
  restoreProduct(
    @Param('id') id: string,
    @Body() updateData: { status: string },
    @Request() req: RequestWithUser,
  ): Promise<ProductResponseDto> {
    const userId = req.user.id;
    // 創建符合 UpdateProductDto 的資料格式
    const updateDto: UpdateProductDto = {
      status: updateData.status as 'published' | 'draft'
    };
    return this.productsService.update(id, userId, updateDto);
  }
} 