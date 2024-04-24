import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class GlobalLogger implements NestMiddleware {
  private readonly logger = new Logger(GlobalLogger.name);
  use(req: Request, res: Response, next: NextFunction) {
    const path = req.baseUrl;
    const method = req.method;
    const protocol = req.protocol;
    const timestamp = new Date().toISOString();
    this.logger.log(JSON.stringify({ path, method, protocol, timestamp }));
    next();
  }
}
