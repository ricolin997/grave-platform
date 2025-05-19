export class UserResponseDto {
  id: string;
  role: string;
  email: string;
  profile: {
    name: string;
    phone?: string;
    avatar?: string;
    identityVerified: boolean;
    realNameVerified: boolean;
  };
  preferences: {
    religions: string[];
    priceRange: {
      min: number;
      max: number;
    };
    locations: string[];
  };
  statistics: {
    listings: number;
    matches: number;
    views: number;
  };
  metadata: {
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
} 