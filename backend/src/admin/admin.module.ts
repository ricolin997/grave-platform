import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Product, ProductSchema } from '../products/entities/product.entity';
import { ProductsModule } from '../products/products.module';
import { ReviewHistorySchema } from '../products/schemas/review-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: 'ReviewHistory', schema: ReviewHistorySchema },
    ]),
    ProductsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {} 