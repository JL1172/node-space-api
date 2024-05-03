import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import * as request from 'supertest';
import { maxRateLimitForDraftMessageEndpoint } from '../middleware/draft-message';
import { deleteJwt } from '../../../prisma/deleteJwt';
/*
//@ts-expect-error cannot resolve type of test file
import test_docx from './test-files/valid-files/test.docx';
//@ts-expect-error cannot resolve type of test file
import test_jpg from './test-files/valid-files/test.jpg';
//@ts-expect-error cannot resolve type of test file
import test_odt from './test-files/valid-files/test.odt';
//@ts-expect-error cannot resolve type of test file
import test_pdf from './test-files/valid-files/test.pdf';
//@ts-expect-error cannot resolve type of test file
import test_png from './test-files/valid-files/.test.png';
*/

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
  test('[2] Successfully throws 401 unauthorized status code for blacklisted jwt.', async () => {
    await deleteJwt();
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
    await deleteJwt();
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
  test('[4] Successfully throws error for missing request body.', async () => {
    await deleteJwt();
    const loginUrl = '/api/auth/login';
    const loginRes = await request(app.getHttpServer())
      .post(loginUrl)
      .send({ username: 'jacoblang11', password: 'helloWorld?11' });
    const token = await loginRes.body.token;
    const res: request.Response = await request(app.getHttpServer())
      .post(url)
      .set({ authorization: token })
      .send();
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('message_subject');
    expect(res.body).toHaveProperty('message_text');
    expect(res.body).toHaveProperty('message_sender_id');
    expect(res.body).toHaveProperty('message_recipient_id');
    expect(res.body).toMatchObject({
      message_subject: {
        minLength: 'Subject Must Exceed 4 Characters.',
        matches: 'Subject Must Only Contain Letters And/Or Numbers.',
        isString: 'Must Be A String.',
        isNotEmpty: 'Subject Is Required.',
      },
      message_text: {
        minLength: 'Message Length Must Exceed 5 Characters.',
        isString: 'Must Be A String.',
        isNotEmpty: 'Text Is Required.',
      },
      message_sender_id: {
        isNumberString: 'Must Be A Number.',
        isNotEmpty: 'Sender Is Required.',
      },
      message_recipient_id: {
        isNumberString: 'Must Be A Number.',
        isNotEmpty: 'Recipient Is Required.',
      },
    });
  });
  test('[5] Successfully throws error for missing file(s).', async () => {
    await deleteJwt();
    const loginUrl = '/api/auth/login';
    const loginRes = await request(app.getHttpServer())
      .post(loginUrl)
      .send({ username: 'jacoblang11', password: 'helloWorld?11' });
    const token = loginRes.body.token;
    const correctRequestBody = {
      message_subject: 'introductory call',
      message_text:
        'Hello Jim, I was wanting to schedule an introductory call this friday at 5:00pm, please let me know if this works for you.',
      message_recipient_id: '1',
      message_sender_id: '1',
    };
    const res: request.Response = await request(app.getHttpServer())
      .post(url)
      .set({ authorization: token })
      .send(correctRequestBody);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('File is required');
  });
  test('[6] Successfully attaches files and content to the request and returns the content back.', async () => {
    await deleteJwt();
    const loginUrl = '/api/auth/login';
    const loginRes = await request(app.getHttpServer())
      .post(loginUrl)
      .send({ username: 'jacoblang11', password: 'helloWorld?11' });
    const token = loginRes.body.token;
    const correctRequestBody = {
      message_subject: 'introductory call',
      message_text:
        'Hello Jim, I was wanting to schedule an introductory call this friday at 5:00pm, please let me know if this works for you.',
      message_recipient_id: 1,
      message_sender_id: 1,
    };
    // const files = [test_docx, test_jpg, test_odt, test_pdf, test_png];
    const res: request.Response = await request(app.getHttpServer())
      .post(url)
      .field('message_sender_id', 1)
      .field('message_recipient_id', 1)
      .field('message_subject', correctRequestBody.message_subject)
      .field('message_text', correctRequestBody.message_text)
      .attach(
        'files',
        Buffer.from('./test-files/valid-files/test.jpg'),
        './test-files/valid-files/test.jpg',
      )
      .attach(
        'files',
        Buffer.from('./test-files/valid-files/test.pdf'),
        './test-files/valid-files/test.pdf',
      )
      .attach(
        'files',
        Buffer.from('./test-files/valid-files/test.png'),
        './test-files/valid-files/test.png',
      )
      .attach(
        'files',
        Buffer.from('./test-files/valid-files/test.pdf'),
        './test-files/valid-files/test.pdf',
      )
      .set({ authorization: token });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body).toHaveLength(5);
  });
});