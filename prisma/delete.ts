import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function resetDb() {
  await prisma.user.deleteMany();
  await prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`;
  prisma.$disconnect;
}
resetDb();
