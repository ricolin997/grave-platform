import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, role, name } = createUserDto;
    
    // 檢查郵箱是否已存在
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('此信箱已被註冊');
    }
    
    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 創建新用戶
    const newUser = new this.userModel({
      email,
      password: hashedPassword,
      role,
      profile: {
        name,
        phone: '',
        avatar: '',
        identityVerified: false,
        realNameVerified: false,
        documents: {
          identity: [],
          ownership: [],
        },
      },
    });
    
    const savedUser = await newUser.save();
    return this.buildUserResponse(savedUser);
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('用戶不存在');
    }
    return user;
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('用戶不存在');
    }
    return this.buildUserResponse(user);
  }

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('信箱或密碼錯誤');
    }
    
    // 檢查用戶狀態
    if (user.metadata.status === 'suspended') {
      throw new UnauthorizedException('此帳戶已被停用');
    }
    
    // 檢查密碼
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // 增加登入嘗試次數
      user.security.loginAttempts += 1;
      
      // 如果嘗試超過 5 次，鎖定帳號 30 分鐘
      if (user.security.loginAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 30);
        user.security.lockUntil = lockUntil;
      }
      
      await user.save();
      throw new UnauthorizedException('信箱或密碼錯誤');
    }
    
    // 重置登入嘗試次數並更新最後登入時間
    user.security.loginAttempts = 0;
    user.security.lastLogin = new Date();
    user.security.lockUntil = null;
    await user.save();
    
    return user;
  }

  private buildUserResponse(user: UserDocument): UserResponseDto {
    const { _id, role, email, profile, preferences, statistics, metadata } = user;
    
    // 獲取時間戳字段，確保類型安全
    const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date();
    const updatedAt = user.updatedAt instanceof Date ? user.updatedAt : new Date();
    
    return {
      id: _id.toString(),
      role,
      email,
      profile: {
        name: profile.name,
        phone: profile.phone,
        avatar: profile.avatar,
        identityVerified: profile.identityVerified,
        realNameVerified: profile.realNameVerified,
      },
      preferences,
      statistics,
      metadata: {
        status: metadata.status,
        createdAt,
        updatedAt,
      },
    };
  }
} 