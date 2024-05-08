import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ProjectPrismaProvider } from './providers/prisma';
import { ProjectErrorHandler } from './providers/error';
import { JwtProvider } from './providers/jwt';
import { NewProjectBody } from './dtos/CreateProjectBody';
import { FinalUpdatedProjectBody } from './dtos/UpdateProjectBody';
import {
  AllProjectsOfEveryCustomer,
  AllProjectsOfOneCustomer,
  OneProjectForOneCustomer,
} from './dtos/ViewProjectBody';
import { Request } from 'express';
import { DeleteProjectBody } from './dtos/DeleteProjectBody';
import { CreateProjectExpenseBody } from './dtos/CreateProjectExpense';
import {
  ViewProjectExpenseBody,
  ViewProjectExpenseBodyAll,
} from './dtos/ViewProjectExpenseBody';

@Controller('/api/project')
export class ProjectController {
  constructor(
    private readonly prisma: ProjectPrismaProvider,
    private readonly errorHandler: ProjectErrorHandler,
    private readonly jwt: JwtProvider,
  ) {}
  /**
     * post('/create-project') ()
     * put('/update-project') [making put will make this more flexible]
     * get('/view-project') [this will take query parameters, limit, page, sortBy(when it is supposed to be finished the soonest), page=1 complete=completedEnum, id=all||number, cid=all||number]
     * delete('/remove-project') 
     
     * post('/create-project-expense')
     * put('/update-project-expense')
     * get('/project-expense) [limit, page, sortBy=price, orderBy=asc||desc, cid=1, id=all||number]
     * delete('/remove-project-expense') 
     
     * get('/project-expenses')
     * get('/budget-insights') (returns if we are in project or out of project)
     * get('/monthly-revenue')
     * get('/monthly-expense')
     * get('/monthly-profit')
     */
  @Post('/create-project')
  //validate body
  //sanitize body
  //validate date is valid
  //validate customer with id exists
  //validate project is unique
  public async createProjectForCustomer(@Body() body: NewProjectBody) {
    try {
      const dateToInsertIntoDb = new Date(body.estimated_end_date);
      body.estimated_end_date = dateToInsertIntoDb;
      const result = await this.prisma.createProject(body);
      return result;
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Put('/update-project')
  //validate body
  //sanitize
  //validate date is valid
  //validate customer with id exists
  //validate project is unique besides record of itself
  public async updateProjectForCustomer(@Body() body: FinalUpdatedProjectBody) {
    const newDate = new Date(body.estimated_end_date);
    body.estimated_end_date = newDate;
    try {
      return await this.prisma.updateProject(
        body.id,
        body.user_id,
        body.customer_id,
        body,
      );
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('/view-project')
  //set default query
  //validate query
  //validate cid exists in relation to uid
  //validate pid exists in relation to cid and uid
  //return different queries based off cid and pic values
  public async getProject(
    @Req() req: Request,
    @Query()
    query:
      | AllProjectsOfEveryCustomer
      | AllProjectsOfOneCustomer
      | OneProjectForOneCustomer,
  ) {
    try {
      this.jwt.validateJwtToken(req.headers.authorization);
      const id = this.jwt.getDecodedJwtToken().id;
      const { pid: project_id, cid: customer_id } = query;
      //where pid and cid are both all
      if (project_id === 'all' && customer_id === 'all') {
        return this.prisma.getAllProjectsForAllCustomers(id, query);
      } else if (project_id !== 'all' && customer_id !== 'all') {
        return this.prisma.getOneProjectForOneCustomer(
          Number(project_id),
          Number(customer_id),
          id,
        );
      } else if (project_id === 'all' && customer_id !== 'all') {
        return this.prisma.getAllProjectsForOneCustomer(
          Number(customer_id),
          id,
          query,
        );
      } else {
        this.errorHandler.reportError(
          'An Unexpected Problem Occurred.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Delete('/remove-project')
  public async removeProject(@Query() query: DeleteProjectBody) {
    //verify customer exists
    //verify id of project exist in relation to customer and to user
    //delete
    try {
      await this.prisma.removeProject(
        Number(query.pid),
        Number(query.uid),
        Number(query.cid),
      );
      return 'Project Successfully Deleted.';
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post('/create-project-expense')
  //validate req.body
  //sanitize req.body
  //validate project with id exists
  //customer exists
  //validate project that this expense is associated with has a valida customer id and user id associated w it
  public async createProjectExpense(@Body() body: CreateProjectExpenseBody) {
    try {
      return await this.prisma.createExpense(body);
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('/project-expense')
  public async viewProjectExpenses(
    @Query() query: ViewProjectExpenseBody | ViewProjectExpenseBodyAll,
  ) {
    //set default query params
    //validate default query params
    //limit = 10, page = 1, sortBy=created_at, orderBy=asc, pid=number, eid=all|numberr
    try {
      if (query.eid === 'all') {
        return await this.prisma.findExpenses(Number(query.pid), query);
      } else {
        return await this.prisma.findExpenseWithId(Number(query.eid));
      }
    } catch (err) {
      this.errorHandler.reportError(
        'An Unexpected Problem Occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
