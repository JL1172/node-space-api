import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { Test, TestingModule } from '@nestjs/testing';
import { maxRateLimitForDraftMessageEndpoint } from '../middleware/draft-message';
import { deleteJwt } from '../../../prisma/prisma-scripts/deleteJwt';

describe('View Messages Endpoint Authorization Tests', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
  const urlWithId: string = '/api/customer/view-messages/1';
  //   const urlWOId: string = '/api/customer/view-messages/:id';
  test('[1] Successfully throws error for rate limit.', async () => {
    for (let i = 0; i < maxRateLimitForDraftMessageEndpoint; i++) {
      const res: request.Response = await request(app.getHttpServer())
        .get(urlWithId)
        .send();
      expect(res.status).toBe(401);
      expect(res.body.message).not.toBe('Too Many Requests.');
    }
  });
  test('[2] Successfully throws error for blacklisted jwt.', async () => {
    const loginUrl: string = '/api/auth/login';
    const creds = { username: 'jacoblang11', password: 'helloWorld?11' };
    const res = await request(app.getHttpServer()).post(loginUrl).send(creds);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    const token = res.body.token;
    const logoutUrl: string = '/api/auth/logout';
    const logoutRes = await request(app.getHttpServer())
      .get(logoutUrl)
      .set({ authorization: token });
    expect(logoutRes.status).toBe(200);
    const viewMessageRes = await request(app.getHttpServer())
      .get(urlWithId)
      .set({ authorization: token });
    expect(viewMessageRes.status).toBe(401);
    expect(viewMessageRes.body).toHaveProperty(
      'message',
      'Invalid Token [403].',
    );
  });
  test('[3] Successfully throws error for absence of jwt and incorrect jwt.', async () => {
    const loginUrl = '/api/auth/login';
    const cred = { username: 'jacoblang11', password: 'helloWorld?11' };
    const loginRes = await request(app.getHttpServer())
      .post(loginUrl)
      .send(cred);

    const { token } = loginRes.body;
    const incorrectToken = token.split('').reverse().join('');
    const improperSignature = incorrectToken.split('');
    improperSignature.pop();
    let res = await request(app.getHttpServer()).get(urlWithId);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Token Required.');
    res = await request(app.getHttpServer())
      .get(urlWithId)
      .set({ authorization: incorrectToken });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'invalid token');
    res = await request(app.getHttpServer())
      .get(urlWithId)
      .set({ authorization: improperSignature.join('') });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'invalid token');
  });
});
describe('View Messages Endpoint Validate And Sanitation Tests', () => {
  const lgurl = '/api/auth/login';
  let token: string;
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    const res = await request(app.getHttpServer())
      .post(lgurl)
      .send({ username: 'jacoblang11', password: 'helloWorld?11' });
    token = res.body.token;
  });
  const urlWOId: string = '/api/customer/view-messages/:';
  test('[1] Successfully throws error if req.params is missing or is not a number string.', async () => {
    await deleteJwt();
    const res = await request(app.getHttpServer())
      .get(urlWOId)
      .set({ authorization: token });
    expect(res.body).toMatchObject({
      id: { isNumberString: 'Must Be A Valid Number String.' },
    });
  });
  test('[2] Successfully transforms req.query to only include accepted parameters and does away with extraneous req.query parameters.', async () => {
    await deleteJwt();
    const url = '/api/customer/view-messages/1?helloworld';
    const res = await request(app.getHttpServer())
      .get(url)
      .set({ authorization: token });
    expect(res.status).toBe(200);
  });
  test('[3] Successfully throws error if customer in relation to the user does not exist in the db.', async () => {
    await deleteJwt();
    const res = await request(app.getHttpServer())
      .get('/api/customer/view-messages/100')
      .set({ authorization: token });
    expect(res.body).toHaveProperty('message', 'Customer Does Not Exist.');
  });
  test.skip('[THIS TEST IS TOO EXPENSIVE ON RESOURCES 4] Successfully returns messages associated with customer and simulates every possible query parameter combination.', async () => {
    /**
     * wipe and reset db
     * create 3 new customers
     * send 40 messages per customer
     * query messages by limit, page, sortdir, sortby
     */
    // await resetScript();
    const res = await request(app.getHttpServer())
      .post(lgurl)
      .send({ username: 'jacoblang11', password: 'helloWorld?11' });
    token = res.body.token;
    //limit
    const res1 = await request(app.getHttpServer())
      .get('/api/customer/view-messages/1?limit=10')
      .set({ authorization: token });
    console.log(res1.body);
    expect(res1.status).toBe(200);
    //page

    //sortDir (orderby)
  });
});
