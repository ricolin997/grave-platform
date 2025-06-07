import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async seed() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    try {
      // 檢查是否已存在管理員用戶
      const adminCount = await this.userModel.countDocuments({ role: 'admin' });
      
      if (adminCount === 0) {
        this.logger.log('創建默認管理員帳號...');
        
        // 加密密碼
        const hashedPassword = await bcrypt.hash('mumu123456', 10);
        
        // 創建管理員用戶
        const adminUser = new this.userModel({
          email: 'paul@mumu.com',
          password: hashedPassword,
          role: 'admin',
          profile: {
            name: '系統管理員',
            phone: '',
            avatar: '',
            identityVerified: true,
            realNameVerified: true,
          },
          preferences: {
            religions: [],
            priceRange: { min: 0, max: 0 },
            locations: [],
          },
          statistics: {
            listings: 0,
            matches: 0,
            views: 0,
          },
          metadata: {
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          permissions: {
            canReviewProducts: true,
            canManageUsers: true,
            canViewStatistics: true,
            canManageSettings: true,
          },
        });
        
        await adminUser.save();
        this.logger.log('默認管理員帳號創建成功');
      } else {
        this.logger.log('已存在管理員帳號，跳過創建');
      }
    } catch (error) {
      this.logger.error('創建默認管理員帳號失敗', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
} 