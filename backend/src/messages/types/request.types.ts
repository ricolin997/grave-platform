import { Request } from 'express';
import { Types } from 'mongoose';

export interface User {
  id: Types.ObjectId;
  email: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user: User;
} 