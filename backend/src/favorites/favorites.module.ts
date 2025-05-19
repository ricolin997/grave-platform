import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FavoritesService } from './favorites.service';
import { ProductFavoritesController, UserFavoritesController } from './favorites.controller';
import { Favorite, FavoriteSchema } from './entities/favorite.entity';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Favorite.name, schema: FavoriteSchema }]),
    ProductsModule,
  ],
  controllers: [ProductFavoritesController, UserFavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
