import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AuthenticationPrismaProvider {
  private readonly prisma: PrismaClient;
  constructor() {}
}
