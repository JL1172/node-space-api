import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

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
});
