import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { resetDb } from '../../prisma/delete';

describe('Register Endpoint /api/auth/registration', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
  const registration_url = '/api/auth/registration';
  test('[1] Successfully calls registration endpoint and throws correct status error.', async () => {
    const res: request.Response = await request(app.getHttpServer())
      .post(registration_url)
      .send({ username: 'jacoblang' });
    expect(res.status).toBe(422);
  });
  test('[2] Successfully throws error for the missing request body.', async () => {
    const res: request.Response = await request(app.getHttpServer())
      .post(registration_url)
      .send();
    const expectedProperties: string[] = [
      'age',
      'email',
      'username',
      'first_name',
      'last_name',
      'password',
    ];
    expectedProperties.forEach((n) => expect(res.body).toHaveProperty(n));
    expect(res.body).toMatchObject({
      age: {
        isNotEmpty: 'Age Required.',
        isNumberString: 'Age Must Be A Number.',
      },
      email: { isEmail: 'Valid Email Required.' },
      first_name: {
        isNotEmpty: 'First Name Is Required.',
        isString: 'First Name Must Be A String.',
        matches: 'Must Only Consist Of Letters.',
      },
      last_name: {
        isNotEmpty: 'Last Name Required.',
        isString: 'Last Name Must Be A String.',
        matches: 'Must Only Consist Of Letters.',
      },
      password: {
        isStrongPassword:
          'Must Be A Strong Password, Fullfilling Each Of The Following Requirements: Min length of 8, 1 special char, 1 lowercase case, 1 uppercase, 1 number.',
      },
      username: {
        isNotEmpty: 'Username Is Required.',
        isString: 'Username Must Be String.',
        matches: 'Username Must Consist Of Numbers And Letters.',
      },
    });
  });
  test('[3] Successfully throws error for incorrect types inputted as request body.', async () => {
    const incorrectJsonInput: Record<
      string,
      string | boolean | number | Record<string, string>
    > = {
      age: 'hello world',
      email: 1,
      first_name: 34,
      last_name: true,
      password: 0,
      username: {},
    };
    const res: request.Response = await request(app.getHttpServer())
      .post(registration_url)
      .send(incorrectJsonInput);
    expect(res.body).toMatchObject({
      age: { isNumberString: 'Age Must Be A Number.' },
      email: { isEmail: 'Valid Email Required.' },
      first_name: {
        isString: 'First Name Must Be A String.',
        matches: 'Must Only Consist Of Letters.',
      },
      last_name: {
        isString: 'Last Name Must Be A String.',
        matches: 'Must Only Consist Of Letters.',
      },
      password: {
        isStrongPassword:
          'Must Be A Strong Password, Fullfilling Each Of The Following Requirements: Min length of 8, 1 special char, 1 lowercase case, 1 uppercase, 1 number.',
      },
      username: {
        isString: 'Username Must Be String.',
        matches: 'Username Must Consist Of Numbers And Letters.',
      },
    });
  });
  test('[4] Successfully throws content error for password, last_name, first_name, email, and username.', async () => {
    const incorrectJsonInput: Record<
      string,
      string | boolean | number | Record<string, string>
    > = {
      age: '22',
      email: 'jacoblang',
      first_name: 'jacob1',
      last_name: 'lang1',
      password: 'helloWorld',
      username: 'jacoblang',
    };
    const res: request.Response = await request(app.getHttpServer())
      .post(registration_url)
      .send(incorrectJsonInput);
    expect(res.body).toMatchObject({
      email: { isEmail: 'Valid Email Required.' },
      first_name: {
        matches: 'Must Only Consist Of Letters.',
      },
      last_name: {
        matches: 'Must Only Consist Of Letters.',
      },
      password: {
        isStrongPassword:
          'Must Be A Strong Password, Fullfilling Each Of The Following Requirements: Min length of 8, 1 special char, 1 lowercase case, 1 uppercase, 1 number.',
      },
      username: {
        matches: 'Username Must Consist Of Numbers And Letters.',
      },
    });
  });
  test('[5] Successfully throws rate limit error.', async () => {
    const ratelimit = 24;
    for (let i = 0; i <= ratelimit; i++) {
      await request(app.getHttpServer()).post(registration_url).send();
    }
    const res = await request(app.getHttpServer())
      .post(registration_url)
      .send();
    expect(res.body).toMatchObject({
      message: 'Too Many Registration Attempts.',
    });
    expect(res.status).toBe(429);
  });
  test('[6] Succesfully throws error if a user with the same username or email tries to register more than once.', async () => {
    await resetDb();
    const jsonInput: Record<string, string> = {
      username: 'jacoblang11',
      password: 'helloWorld?11',
      age: '22',
      first_name: 'jacob',
      last_name: 'lang',
      email: 'jacoblang127@gmail.com',
    };
    const res = await request(app.getHttpServer())
      .post(registration_url)
      .send(jsonInput);
    expect(Object.keys(res.body)).toHaveLength(0);
    const response = await request(app.getHttpServer())
      .post(registration_url)
      .send(jsonInput);
    expect(response.body).toMatchObject({
      message:
        'Username and Email Already Associated With A Different Account.',
      statusCode: 400,
    });
    ['message', 'statusCode'].forEach((n) =>
      expect(response.body).toHaveProperty(n),
    );
  });
  test('[7] Successfully creates a user with no errors.', async () => {
    await resetDb();
    const jsonInput: Record<string, string> = {
      username: 'jacoblang11',
      password: 'helloWorld?11',
      age: '22',
      first_name: 'jacob',
      last_name: 'lang',
      email: 'jacoblang127@gmail.com',
    };
    const res = await request(app.getHttpServer())
      .post(registration_url)
      .send(jsonInput);
    expect(res.status).toBe(201);
    expect(Object.keys(res.body)).toHaveLength(0);
  });
});
