import { PrismaClient } from '@prisma/client';

export async function deleteCustomer(): Promise<void> {
  const prisma = new PrismaClient();
  await prisma.customer.deleteMany();
  await prisma.$executeRaw`ALTER SEQUENCE "Customer_id_seq" RESTART WITH 1`;
  prisma.$disconnect();
}
