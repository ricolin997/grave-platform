import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProductDocument = Product & Document & {
  createdAt: Date;
  updatedAt: Date;
  _id: MongooseSchema.Types.ObjectId;
};

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sellerId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: {
      title: { type: String, required: true },
      description: { type: String, required: false },
      price: { type: Number, required: true },
      negotiable: { type: Boolean, default: false },
      images: { type: [String], default: [] },
      video: { type: String },
      virtualTour: { type: String },
    },
    _id: false,
  })
  basicInfo: {
    title: string;
    description: string;
    price: number;
    negotiable: boolean;
    images: string[];
    video?: string;
    virtualTour?: string;
  };

  @Prop({
    type: {
      cemetery: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      surroundings: {
        parking: { type: Boolean, default: false },
        temple: { type: Boolean, default: false },
        restaurant: { type: Boolean, default: false },
        transportation: { type: [String], default: [] },
      },
    },
    _id: false,
  })
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

  @Prop({
    type: {
      productType: { type: String, required: true },
      size: { type: String, required: true },
      facing: { type: String, required: true },
      floor: { type: Number, required: false, default: 0 },
      religion: { type: String, required: true },
      feng_shui: {
        orientation: { type: String },
        environment: { type: [String], default: [] },
        features: { type: [String], default: [] },
      },
    },
    _id: false,
  })
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

  @Prop({
    type: {
      registrationNumber: { type: String, required: true },
      ownershipCertificate: { type: String, required: true },
      propertyRights: { type: [String], default: [] },
      expiryDate: { type: Date },
      transferable: { type: Boolean, default: true, required: false },
      restrictions: { type: [String], default: [] },
    },
    _id: false,
  })
  legalInfo: {
    registrationNumber: string;
    ownershipCertificate: string;
    propertyRights: string[];
    expiryDate?: Date;
    transferable: boolean;
    restrictions: string[];
  };

  @Prop({
    type: {
      status: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected', 'needs_info'], 
        default: 'pending',
      },
      documents: { type: [String], default: [] },
      verifiedAt: { type: Date },
      verifier: { 
        type: MongooseSchema.Types.ObjectId, 
        ref: 'Admin'
      },
      notes: { type: String },
    },
    _id: false,
  })
  verification: {
    status: 'pending' | 'verified' | 'rejected' | 'needs_info';
    documents: string[];
    verifiedAt?: Date;
    verifier?: MongooseSchema.Types.ObjectId;
    notes?: string;
  };

  @Prop({
    type: String,
    enum: ['draft', 'pending', 'approved-pending', 'published', 'reserved', 'negotiating', 'inspecting', 'completed', 'rejected', 'sold', 'deleted'],
    default: 'draft',
  })
  status: 'draft' | 'pending' | 'approved-pending' | 'published' | 'reserved' | 'negotiating' | 'inspecting' | 'completed' | 'rejected' | 'sold' | 'deleted';

  @Prop({
    type: {
      views: { type: Number, default: 0 },
      favorites: { type: Number, default: 0 },
      compares: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
      lastViewed: { type: Date },
    },
    default: () => ({
      views: 0,
      favorites: 0,
      compares: 0,
      inquiries: 0,
      lastViewed: null,
    }),
    _id: false,
  })
  statistics: {
    views: number;
    favorites: number;
    compares: number;
    inquiries: number;
    lastViewed?: Date;
  };

  @Prop({
    type: {
      publishedAt: { type: Date },
      approvedAt: { type: Date },
      soldAt: { type: Date },
    },
    _id: false,
  })
  metadata: {
    publishedAt?: Date;
    approvedAt?: Date;
    soldAt?: Date;
  };

  @Prop({ type: Boolean, default: false })
  isMarked: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product); 