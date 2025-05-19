export class FavoriteResponseDto {
  id: string;
  userId: string;
  productId: string;
  isNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
  product?: {
    title: string;
    price: number;
    image: string;
    status: string;
  };
}

export class FavoritesListResponseDto {
  favorites: FavoriteResponseDto[];
  total: number;
  page: number;
  totalPages: number;
} 