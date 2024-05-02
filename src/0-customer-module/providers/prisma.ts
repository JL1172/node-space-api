import { Injectable } from '@nestjs/common';
import { Customer, JwtToken, PrismaClient } from '@prisma/client';
import { SingletonPrismaProvider } from '../../global/global-utils/providers/singleton-prisma';
import {
  NewCustomerBody,
  NewCustomerBodyToInsertIntoDb,
} from '../dtos/NewCustomerBody';

@Injectable()
export class CustomerPrismaProvider {
  private readonly prisma: PrismaClient;
  constructor() {
    this.prisma = SingletonPrismaProvider.prisma_instance;
  }
  public async getJwtByToken(token: string): Promise<JwtToken> {
    return await this.prisma.jwtToken.findUnique({
      where: { token: token },
    });
  }
  private async findCustomerByEmail(
    id: number,
    email: string,
  ): Promise<Customer> {
    return await this.prisma.customer.findFirst({
      where: { user_id: id, email },
    });
  }
  private async findCustomerByAddress(
    id: number,
    address: string,
  ): Promise<Customer> {
    return await this.prisma.customer.findFirst({
      where: { user_id: id, address },
    });
  }
  private async findCustomerByFullName(
    id: number,
    full_name: string,
  ): Promise<Customer> {
    return await this.prisma.customer.findFirst({
      where: { user_id: id, full_name },
    });
  }
  private async findCustomerByPhoneNumber(
    id: number,
    phoneNumber: string,
  ): Promise<Customer> {
    return await this.prisma.customer.findFirst({
      where: { user_id: id, phoneNumber },
    });
  }
  public async verifyCustomerIsUnique(
    id: number,
    customer: NewCustomerBody,
  ): Promise<boolean> {
    const isEmailUnique: Customer = await this.findCustomerByEmail(
      id,
      customer.email,
    );
    if (isEmailUnique !== null) return false;
    const isAddressUnique = await this.findCustomerByAddress(
      id,
      customer.address,
    );
    if (isAddressUnique !== null) return false;
    const isFullNameUnique = await this.findCustomerByFullName(
      id,
      customer.full_name,
    );
    if (isFullNameUnique !== null) return false;
    const isPhoneNumberUnique = await this.findCustomerByPhoneNumber(
      id,
      customer.phoneNumber,
    );
    if (isPhoneNumberUnique !== null) return false;
    return true;
  }
  public async createNewCustomer(
    newCustomer: NewCustomerBodyToInsertIntoDb,
  ): Promise<void> {
    await this.prisma.customer.create({ data: newCustomer });
  }
}
