import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Authentication Controller', () => {
  describe('Register Endpoint /api/auth/registration', () => {
    let app: INestApplication;

    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });
    test('[1] Successfully Calls registration endpoint and throws error.', async () => {
      const res: request.Response = await request(app.getHttpServer())
        .post('/api/auth/registration')
        .send({ username: 'jacoblang' });
      console.log(res);
      expect(res.status).toBe(422);
    });
  });
});
