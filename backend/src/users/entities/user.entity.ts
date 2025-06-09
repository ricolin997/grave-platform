import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Role } from '../../roles/entities/role.entity';

export type UserDocument = User & Document & {
  createdAt: Date;
  updatedAt: Date;
  _id: any;
};

export type UserRole = 'buyer' | 'seller' | 'admin';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, enum: ['buyer', 'seller', 'admin'] })
  role: UserRole;

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
  
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Role' })
  roleId?: string;

  @Prop({
    type: {
      canReviewProducts: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canViewStatistics: { type: Boolean, default: false },
      canManageSettings: { type: Boolean, default: false },
    },
    default: () => ({
      canReviewProducts: false,
      canManageUsers: false,
      canViewStatistics: false,
      canManageSettings: false,
    }),
    _id: false,
  })
  permissions?: {
    canReviewProducts: boolean;
    canManageUsers: boolean;
    canViewStatistics: boolean;
    canManageSettings: boolean;
  };
  
  // Helper method to check if user has specific permission
  hasPermission(permissionCode: string): boolean {
    // Super admin has all permissions
    if (this.email === 'paul@mumu.com') {
      return true;
    }
    
    // Legacy permission check
    if (this.permissions) {
      switch(permissionCode) {
        case 'product:review':
          return !!this.permissions.canReviewProducts;
        case 'user:manage':
          return !!this.permissions.canManageUsers;
        case 'statistics:view':
          return !!this.permissions.canViewStatistics;
        case 'settings:manage':
          return !!this.permissions.canManageSettings;
        default:
          return false;
      }
    }
    
    return false; // If no permissions defined
  }
}

export const UserSchema = SchemaFactory.createForClass(User); 

// Add method to schema
UserSchema.methods.hasPermission = function(permissionCode: string) {
  // Super admin has all permissions
  if (this.email === 'paul@mumu.com') {
    return true;
  }
  
  // Legacy permission check
  if (this.permissions) {
    switch(permissionCode) {
      case 'product:review':
        return !!this.permissions.canReviewProducts;
      case 'user:manage':
        return !!this.permissions.canManageUsers;
      case 'statistics:view':
        return !!this.permissions.canViewStatistics;
      case 'settings:manage':
        return !!this.permissions.canManageSettings;
      default:
        return false;
    }
  }
  
  return false; // If no permissions defined
}; 