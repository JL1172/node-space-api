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
  }
}
