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
  test('[2] Successfully throws 401 unauthorized status code for blacklisted.', async () => {
    const loginUrl = '/api/auth/login';
    const res: request.Response = await request(app.getHttpServer())
      .post(loginUrl)
      .send({ username: 'jacoblang11', password: 'helloWorld?11' });
    expect(res.body?.token).toBeTruthy();
    expect(res.body).toHaveProperty('token');
    const token: string = res.body.token;
    const logoutUrl = '/api/auth/logout';
    const logoutRes: request.Response = await request(app.getHttpServer())
      .get(logoutUrl)
      .set({ authorization: token })
      .send({ token });
    expect(logoutRes.text).toBe('Successfully Logged Out.');
    const draftMessageRes: request.Response = await request(app.getHttpServer())
      .post(url)
      .set({ authorization: token });
    expect(draftMessageRes.status).toBe(401);
    expect(draftMessageRes.body.message).toBe('Invalid Token [403].');
  });
  test('[3] Successfully throws 401 unauthorized status code for incorrect jwt or missing jwt.', async () => {
    let res: request.Response = await request(app.getHttpServer())
      .post(url)
      .set({ authorization: 'hello world' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('jwt malformed');
    const loginUrl = '/api/auth/login';
    res = await request(app.getHttpServer())
      .post(loginUrl)
      .send({ username: 'jacoblang11', password: 'helloWorld?11' });
    expect(res.body?.token).toBeTruthy();
    expect(res.body).toHaveProperty('token');
    const token: string[] = res.body.token.split('');
    token.pop();
    res = await request(app.getHttpServer())
      .post(url)
      .set({ authorization: token.join('') });
    expect(res.body.message).toBe('invalid signature');
    expect(res.status).toBe(401);
  });
});
