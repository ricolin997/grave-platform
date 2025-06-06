import { Test, TestingModule } from '@nestjs/testing';
import { UserFavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

describe('FavoritesController', () => {
  let controller: UserFavoritesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserFavoritesController],
      providers: [FavoritesService],
    }).compile();

    controller = module.get<UserFavoritesController>(UserFavoritesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
