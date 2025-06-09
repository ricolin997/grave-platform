import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document & {
  createdAt: Date;
  updatedAt: Date;
  _id: any;
};

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  resource: string;
  
  @Prop({ default: false })
  isBuiltIn: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission); 