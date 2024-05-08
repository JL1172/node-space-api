import { Injectable } from '@nestjs/common';
import { Customer, JwtToken, PrismaClient, Project } from '@prisma/client';
import { SingletonPrismaProvider } from 'src/global/global-utils/providers/singleton-prisma';
import { NewProjectBody } from '../dtos/CreateProjectBody';
import { FinalUpdatedProjectBody } from '../dtos/UpdateProjectBody';

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
}
