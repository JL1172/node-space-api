import { Injectable } from '@nestjs/common';
import {
  Customer,
  JwtToken,
  Message,
  PrismaClient,
  User,
} from '@prisma/client';
import { SingletonPrismaProvider } from '../../global/global-utils/providers/singleton-prisma';
import {
  NewCustomerBody,
  NewCustomerBodyToInsertIntoDb,
} from '../dtos/NewCustomerBody';
import { ParamBody, QueryBody } from '../dtos/ViewMessagesBodies';

@Injectable()
export class CustomerPrismaProvider {
  private readonly prisma: PrismaClient;
  constructor() {
    this.prisma = SingletonPrismaProvider.prisma_instance;
  }
  public async createMessage(
    messageDataToInsert: {
      message_subject: string;
      message_text: string;
      message_sender_id: number;
      message_recipient_id: number;
    },
    files: {
      mime_type: string;
      filename: string;
      size: number;
      data: Buffer;
    }[],
  ): Promise<void> {
    //first insert message with:
    /**
     * message_subject
     * message_text
     * message_sender_id (from jwt token)
     * message_recipient_id
     */
    //then create blog media with the message id that comes from creating message
    /**
     * mime_type
     * filename
     * size
     * data
     * message_id
     */
    const newlyCreatedMessage: Message = await this.prisma.message.create({
      data: messageDataToInsert,
    });
    const message_id: number = newlyCreatedMessage.id;
    const fileToInsertIntoDb: {
      mime_type: string;
      filename: string;
      size: number;
      data: Buffer;
      message_id: number;
    }[] = files.map((n) => ({ ...n, message_id }));
    await this.prisma.messageMedia.createMany({
      data: fileToInsertIntoDb,
    });
  }

  public async getMessagesWithQueryParams(
    sender_id: number,
    query: QueryBody,
    params: ParamBody,
  ) {
    const result = await this.prisma.message.findMany({
      where: {
        message_sender_id: sender_id,
        message_recipient_id: Number(params.id),
      },
      select: {
        id: true,
        message_recipient_id: true,
        message_recipient: { select: { email: true } },
        message_sender_id: true,
        message_sender: { select: { email: true } },
        message_subject: true,
        message_text: true,
        created_at: true,
        message_media: {
          select: {
            filename: true,
            data: true,
            mime_type: true,
          },
        },
      },
      orderBy: { created_at: query.sortDir },
      skip:
        Number(query.page) > 1
          ? Number(query.limit) * Number(query.page) - Number(query.limit)
          : 0,
      take: Number(query.limit),
    });
    return result;
  }
  public async getUserById(id: number): Promise<User> {
    return await this.prisma.user.findUnique({ where: { id: Number(id) } });
  }
  public async getCustomerById(
    id: number,
    user_id_in_relation_to_customer: number,
  ): Promise<Customer> {
    return await this.prisma.customer.findUnique({
      where: { id: Number(id), user_id: user_id_in_relation_to_customer },
    });
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
