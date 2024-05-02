import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import * as request from 'supertest';
import { maxRateLimitForDraftMessageEndpoint } from '../middleware/draft-message';

describe('Draft Message To Customer Endpoint: [/api/auth/draft-message-to-customer]', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
  const url: string = '/api/customer/draft-message-to-customer';
  test('[1] Successfully throws "Too Many Requests 429" error when rate limit is exceeded and verifies time till requests can be made again is one-minute.', async () => {
    for (let i = 0; i < maxRateLimitForDraftMessageEndpoint; i++) {
      const res: request.Response = await request(app.getHttpServer())
        .post(url)
        .send();
      expect(res.status).toBe(401);
      expect(res.body.message).not.toBe('Too Many Requests.');
    }
    const res: request.Response = await request(app.getHttpServer())
      .post(url)
      .send();
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('message', 'Too Many Requests.');
    const timeRateLimitResetsInMs: number =
      Number(res.headers['x-ratelimit-reset']) * 1000;
    const currentTime: number = new Date().getTime();
    const threshold = 1;
    expect(60 - (timeRateLimitResetsInMs - currentTime) / 1000).toBeLessThan(
      threshold,
    );
  });
  test('[2] Successfully throws 401 unauthorized status code for missing, blacklisted, incorrect, or expired jwt.', async () => {});
});
