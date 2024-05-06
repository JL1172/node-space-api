import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function resetDb() {
  await prisma.messageMedia.deleteMany();
  await prisma.message.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.jwtToken.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$executeRaw`ALTER SEQUENCE "VerificationCode_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "JwtToken_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "Customer_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "MessageMedia_id_seq" RESTART WITH 1`;
  await prisma.$executeRaw`ALTER SEQUENCE "Message_id_seq" RESTART WITH 1`;
  prisma.$disconnect();
}
resetDb();
