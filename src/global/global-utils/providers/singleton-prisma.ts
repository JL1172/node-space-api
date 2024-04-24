import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class SingletonPrismaProvider {
  public static prisma_instance: PrismaClient = new PrismaClient();
}
