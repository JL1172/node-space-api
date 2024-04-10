import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class EventLogger implements NestMiddleware {
  private readonly logger = new Logger(EventLogger.name);
  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const timestamp = new Date().toISOString();
    const path = req.baseUrl;
    const protocol = req.protocol;
    this.logger.log(JSON.stringify({ method, path, protocol, timestamp }));
    next();
  }
}
