import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    return this.usersService.validateUser(email, password);
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.validateUser(email, password);
    
    const payload = { email: user.email, sub: user._id, role: user.role };
    
    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.profile.name,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }
} 