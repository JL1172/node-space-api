import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function resetDb() {
  await prisma.verificationCode.deleteMany();
  await prisma.jwtToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$executeRaw`ALTER SEQUENCE "VerificationCode_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "JwtToken_id_seq" RESTART WITH 1`;
  prisma.$disconnect();
}
resetDb();
