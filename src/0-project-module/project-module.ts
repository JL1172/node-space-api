import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ProjectController } from './project-controller';
import { ProjectErrorHandler } from './providers/error';
import { ProjectPrismaProvider } from './providers/prisma';
import { Cloudmersive } from './providers/cloudmersive-client';
import {
  ProjectControllerRateLimiter,
  VerifyTokenIsNotBlacklisted,
  VerifyTokenIsValid,
} from './middleware/controller-middleware';
import { JwtProvider } from './providers/jwt';
import {
  SanitizeNewProjectBody,
  ValidateCustomerWithIdExists,
  ValidateDateIsValid,
  ValidateNewProjectBody,
  ValidateProjectIsUnique,
} from './middleware/create-project';
import {
  ValidateProjectIsUniqueForUpdatedProject,
  ValidateProjectWithIdInRelationToCustomerAndUserExists,
  ValidateUpdatedProjectBody,
} from './middleware/update-project';
import {
  SetDefaultQueryParams,
  ValidateCustomerWithIdExistsQueryParam,
  ValidateProjectExists,
  ValidateQueryParams,
} from './middleware/get-project';
import {
  ValidatDeleteProjectBody,
  ValidateCustomerWithIdExistsDeleteProject,
  ValidateProjectExistsDeleteProject,
} from './middleware/delete-project';
import {
  SanitizeExpense,
  ValidateExpenseBody,
  ValidateProjectIds,
} from './middleware/create-project-expense';
import {
  SetDefaultProjectExpenseParams,
  ValidateProjectExpenseParams,
  ValidateProjectIdsViewProject,
} from './middleware/view-project-expense';

@Module({
  imports: [],
  controllers: [ProjectController],
  providers: [
    ProjectErrorHandler,
    ProjectPrismaProvider,
    Cloudmersive,
    JwtProvider,
  ],
})
export class ProjectModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        ProjectControllerRateLimiter,
        VerifyTokenIsNotBlacklisted,
        VerifyTokenIsValid,
      )
      .forRoutes('/api/project/*');
    consumer
      .apply(
        ValidateNewProjectBody,
        SanitizeNewProjectBody,
        ValidateDateIsValid,
        ValidateCustomerWithIdExists,
        ValidateProjectIsUnique,
      )
      .forRoutes('/api/project/create-project');
    consumer
      .apply(
        ValidateUpdatedProjectBody,
        SanitizeNewProjectBody,
        ValidateDateIsValid,
        ValidateCustomerWithIdExists,
        ValidateProjectWithIdInRelationToCustomerAndUserExists,
        ValidateProjectIsUniqueForUpdatedProject,
      )
      .forRoutes('/api/project/update-project');
    consumer
      .apply(
        SetDefaultQueryParams,
        ValidateQueryParams,
        ValidateCustomerWithIdExistsQueryParam,
        ValidateProjectExists,
      )
      .forRoutes('/api/project/view-project');
    consumer
      .apply(
        ValidatDeleteProjectBody,
        ValidateCustomerWithIdExistsDeleteProject,
        ValidateProjectExistsDeleteProject,
      )
      .forRoutes('/api/project/remove-project');
    consumer
      .apply(ValidateExpenseBody, SanitizeExpense, ValidateProjectIds)
      .forRoutes('/api/project/create-project-expense');
    consumer
      .apply(
        SetDefaultProjectExpenseParams,
        ValidateProjectExpenseParams,
        ValidateProjectIdsViewProject,
      )
      .forRoutes('/api/project/project-expense');
  }
}
