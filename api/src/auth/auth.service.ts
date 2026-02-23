import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RoleName } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email already in use');

    const userCount = await this.prisma.user.count();
    const defaultRole: RoleName = userCount === 0 ? RoleName.OWNER : RoleName.SALES;

    const role = await this.prisma.role.findUnique({ where: { name: defaultRole } });
    if (!role) throw new BadRequestException('Roles not seeded; run prisma seed');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        roleId: role.id,
      },
      include: { role: true },
    });

    return this.issueToken(user.id, user.email, user.role.name);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueToken(user.id, user.email, user.role.name);
  }

  private async issueToken(userId: string, email: string, role: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId, email, role });
    return { accessToken };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        role: { select: { name: true, description: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
