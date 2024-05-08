import { Controller, HttpStatus, Post } from '@nestjs/common';
import { ProjectPrismaProvider } from './providers/prisma';
import { ProjectErrorHandler } from './providers/error';
import { JwtProvider } from './providers/jwt';

@Controller('/api/project')
export class ProjectController {
  constructor(
    private readonly prisma: ProjectPrismaProvider,
    private readonly errorHandler: ProjectErrorHandler,
    private readonly jwt: JwtProvider,
  ) {}
  /**
     * post('/create-project')
     * put('/update-project') [making put will make this more flexible]
     * get('/view-project') [this will take query parameters, limit, page, sortBy(when it is supposed to be finished the soonest), page=1 complete=completedEnum, id=all||number, cid=all||number]
     * delete('/remove-project') 
     
     * post('/create-project-expense')
     * put('/update-project-expense')
     * get('/project-expense) [limit, page, sortBy=price, orderBy=asc||desc, cid=1, id=all||number]
     * delete('/remove-project-expense') 
      
     * post('/create-project-todo')
     * put('/update-project-todo')
     * get('/project-todo') [all associated with proj or one]
     * delete('/remove-project-todo')
     
     * get('/project-expenses')
     * get('/budget-insights') (returns if we are in project or out of project)
     * get('/monthly-revenue')
     * get('/monthly-expense')
     * get('/monthly-profit')
     */
  @Post('/create-project')
  public async createProject() {
    try {
      return 'created proj';
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
