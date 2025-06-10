export class ProductResponseDto {
  id: string;
  sellerId: string;
  sellerName?: string;
  basicInfo: {
    title: string;
    description: string;
    price: number;
    negotiable: boolean;
    images: string[];
    video?: string;
    virtualTour?: string;
  };
  location: {
    cemetery: string;
    address: string;
    city: string;
    district: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    surroundings: {
      parking: boolean;
      temple: boolean;
      restaurant: boolean;
      transportation: string[];
    };
  };
  features: {
    productType: string;
    size: string;
    facing: string;
    floor: number;
    religion: string;
    feng_shui: {
      orientation: string;
      environment: string[];
      features: string[];
    };
  };
  legalInfo: {
    registrationNumber: string;
    ownershipCertificate: string;
    propertyRights: string[];
    expiryDate?: Date;
    transferable: boolean;
    restrictions: string[];
  };
  verification: {
    status: string;
    documents: string[];
    verifiedAt?: Date;
    verifier?: string;
    notes?: string;
  };
  status: string;
  statistics: {
    views: number;
    favorites: number;
    compares: number;
    inquiries: number;
    lastViewed?: Date;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    approvedAt?: Date;
    soldAt?: Date;
  };
  isFavorited?: boolean;
  isMarked?: boolean;
} 