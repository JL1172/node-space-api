import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function deleteJwt() {
  await prisma.jwtToken.deleteMany();
  await prisma.$executeRaw`ALTER SEQUENCE "JwtToken_id_seq" RESTART WITH 1`;
  await prisma.$disconnect();
}
