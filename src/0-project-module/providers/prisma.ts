import { Injectable } from '@nestjs/common';
import { Customer, JwtToken, PrismaClient, Project } from '@prisma/client';
import { SingletonPrismaProvider } from 'src/global/global-utils/providers/singleton-prisma';
import { NewProjectBody } from '../dtos/CreateProjectBody';
import { FinalUpdatedProjectBody } from '../dtos/UpdateProjectBody';
import {
  AllProjectsOfEveryCustomer,
  AllProjectsOfOneCustomer,
} from '../dtos/ViewProjectBody';
import { SortByTodoEnum } from 'src/0-customer-module/dtos/GetCustomerTodoBodies';

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
  public async getCustomerById(
    id: number,
    user_id_in_relation_to_customer: number,
  ): Promise<Customer> {
    return await this.prisma.customer.findUnique({
      where: {
        id: Number(id),
        user_id: Number(user_id_in_relation_to_customer),
      },
    });
  }
  public async validateProjectIsUnique(
    user_id: number,
    customer_id: number,
    project_title: string,
    estimated_end_date: Date,
  ) {
    return await this.prisma.project.findFirst({
      where: { user_id, customer_id, project_title, estimated_end_date },
    });
  }
  public async createProject(newProject: NewProjectBody): Promise<Project> {
    return await this.prisma.project.create({ data: newProject });
  }
  public async validateProjectIsUniqueBesidesSelf(
    user_id: number,
    customer_id: number,
    project_title: string,
    estimated_end_date: Date,
    proj_id: number,
  ) {
    return await this.prisma.project.findFirst({
      where: {
        id: { not: proj_id },
        user_id,
        customer_id,
        project_title,
        estimated_end_date,
      },
    });
  }
  public async validateProjectWithIdExists(
    proj_id: number,
    user_id: number,
    customer_id: number,
  ): Promise<Project> {
    return await this.prisma.project.findFirst({
      where: { id: proj_id, user_id, customer_id },
    });
  }
  public async updateProject(
    proj_id: number,
    user_id: number,
    customer_id: number,
    updatedProject: FinalUpdatedProjectBody,
  ): Promise<Project> {
    return await this.prisma.project.update({
      where: { id: proj_id, user_id, customer_id },
      data: updatedProject,
    });
  }
  public async getAllProjectsForAllCustomers(
    user_id: number,
    query: AllProjectsOfEveryCustomer,
  ): Promise<Project[]> {
    const { limit, page, sortBy, complete } = query;
    return await this.prisma.project.findMany({
      where: {
        user_id,
        completed: {
          not: complete === 'all' ? null : complete === 'true' ? false : true,
        },
      },
      orderBy: {
        estimated_end_date: sortBy === SortByTodoEnum.URGENT ? 'asc' : 'desc',
      },
      skip: Number(limit) * Number(page) - Number(limit),
      take: Number(limit),
    });
  }
  public async getOneProjectForOneCustomer(
    pid: number,
    cid: number,
    uid: number,
  ): Promise<Project> {
    return await this.prisma.project.findFirst({
      where: { id: pid, customer_id: cid, user_id: uid },
    });
  }
  public async getAllProjectsForOneCustomer(
    customer_id: number,
    user_id: number,
    query: AllProjectsOfOneCustomer,
  ): Promise<Project[]> {
    const { limit, page, sortBy, complete } = query;
    return this.prisma.project.findMany({
      where: {
        customer_id,
        user_id,
        completed: {
          not: complete === 'all' ? null : complete === 'true' ? false : true,
        },
      },
      orderBy: {
        estimated_end_date: sortBy === SortByTodoEnum.URGENT ? 'asc' : 'desc',
      },
      skip: Number(limit) * Number(page) - Number(limit),
      take: Number(limit),
    });
  }
}
