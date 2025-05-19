import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document & {
  createdAt: Date;
  updatedAt: Date;
  _id: any;
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, enum: ['buyer', 'seller'] })
  role: 'buyer' | 'seller';

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: {
      name: { type: String, required: true },
      phone: { type: String, required: false },
      avatar: { type: String, required: false },
      identityVerified: { type: Boolean, default: false },
      realNameVerified: { type: Boolean, default: false },
      documents: {
        identity: { type: [String], default: [] },
        ownership: { type: [String], default: [] },
      },
    },
    required: true,
    _id: false,
  })
  profile: {
    name: string;
    phone?: string;
    avatar?: string;
    identityVerified: boolean;
    realNameVerified: boolean;
    documents: {
      identity: string[];
      ownership?: string[];
    };
  };

  @Prop({
    type: {
      religions: { type: [String], default: [] },
      priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
      },
      locations: { type: [String], default: [] },
    },
    default: () => ({
      religions: [],
      priceRange: { min: 0, max: 0 },
      locations: [],
    }),
    _id: false,
  })
  preferences: {
    religions: string[];
    priceRange: {
      min: number;
      max: number;
    };
    locations: string[];
  };

  @Prop({
    type: {
      loginAttempts: { type: Number, default: 0 },
      lockUntil: { type: Date, default: null },
      lastLogin: { type: Date, default: null },
      lastPasswordChange: { type: Date, default: null },
    },
    default: () => ({
      loginAttempts: 0,
      lockUntil: null,
      lastLogin: null,
      lastPasswordChange: null,
    }),
    _id: false,
  })
  security: {
    loginAttempts: number;
    lockUntil: Date | null;
    lastLogin: Date | null;
    lastPasswordChange: Date | null;
  };

  @Prop({
    type: {
      listings: { type: Number, default: 0 },
      matches: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
    },
    default: () => ({
      listings: 0,
      matches: 0,
      views: 0,
    }),
    _id: false,
  })
  statistics: {
    listings: number;
    matches: number;
    views: number;
  };

  @Prop({
    type: {
      status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    },
    default: () => ({
      status: 'active',
    }),
    _id: false,
  })
  metadata: {
    status: 'active' | 'suspended';
  };
}

export const UserSchema = SchemaFactory.createForClass(User); 