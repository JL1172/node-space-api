import { Injectable } from '@nestjs/common';
import { JwtToken, PrismaClient } from '@prisma/client';
import { SingletonPrismaProvider } from 'src/global/global-utils/providers/singleton-prisma';

@Injectable()
export class ProjectPrismaProvider {
  private readonly prisma: PrismaClient;
  constructor() {
    this.prisma = SingletonPrismaProvider.prisma_instance;
  }
  public async getJwtByToken(token: string): Promise<JwtToken> {
    return await this.prisma.jwtToken.findUnique({
      where: { token: token },
    });
  }
}
