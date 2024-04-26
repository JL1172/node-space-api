import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { resetDb } from '../../../prisma/delete';
import { VerificationCode } from '@prisma/client';
import { AuthenticationPrismaProvider } from '../providers/prisma';

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
describe('Login Endpoint /api/auth/login', () => {
  const login_url = '/api/auth/login';
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
  test('[8] Successfully returns 422 status code for empty login attempt.', async () => {
    const res = await request(app.getHttpServer()).post(login_url).send();
    expect(res.status).toBe(422);
  });
  test('[9] Successfully throws "too many requests" error for exceeded rate limit.', async () => {
    const ratelimit = 10;
    for (let i = 0; i < ratelimit; i++) {
      const res = await request(app.getHttpServer()).post(login_url).send();
      expect(res.body).not.toMatchObject({
        message: 'Too Many Login Requests.',
      });
    }
    const res = await request(app.getHttpServer()).post(login_url).send();
    expect(res.body).toMatchObject({ message: 'Too Many Login Requests.' });
  });
  test('[10] Successfully throws error for empty login attempt', async () => {
    const res = await request(app.getHttpServer()).post(login_url).send();
    expect(res.body).toMatchObject({
      password: {
        isNotEmpty: 'Password Is Required.',
        isStrongPassword: 'Improper Password.',
      },
      username: {
        isString: 'Username Must Be String.',
        matches: 'Invalid Username',
      },
    });
  });
  test('[11] Successfully throws error for incorrect credentials. [username]', async () => {
    const res = await request(app.getHttpServer())
      .post(login_url)
      .send({ username: 'jacoblang1', password: 'helloWorld?11' });
    expect(res.body).toMatchObject({
      message: 'Username Or Password Is Incorrect.',
    });
  });
  test('[12] Incorrect login attempts consistently fall within a threshold of 100ms with one another regardless of what is incorrect (username or password).', async () => {
    const threshold: number = 100;
    const startTimeForIncorrectUsername = performance.now();
    await request(app.getHttpServer())
      .post(login_url)
      .send({ username: 'jacoblang1', password: 'helloWorld?11' });
    const endTimeForIncorrectUsername = performance.now();
    const elapsedTimeForIncorrectUsername: number =
      endTimeForIncorrectUsername - startTimeForIncorrectUsername;
    const startTimeForIncorrectPassword = performance.now();
    await request(app.getHttpServer())
      .post(login_url)
      .send({ username: 'jacoblang11', password: 'helloWorld?1' });
    const endTimeForIncorrectPassword = performance.now();
    const elapsedTimeForIncorrectPassword: number =
      endTimeForIncorrectPassword - startTimeForIncorrectPassword;
    const difference: number = Math.abs(
      elapsedTimeForIncorrectPassword - elapsedTimeForIncorrectUsername,
    );
    console.log(
      'elapsed time for incorrect password. ',
      elapsedTimeForIncorrectPassword,
    );
    console.log(
      'elapsed time for incorrect username. ',
      elapsedTimeForIncorrectUsername,
    );
    console.log('difference: ', difference);
    expect(difference).toBeLessThanOrEqual(threshold);
  });
  test('[13] Successfully logs in given correct credentials and returns JWT token.', async () => {
    const correctCredentials = {
      username: 'jacoblang11',
      password: 'helloWorld?11',
    };
    const res: request.Response = await request(app.getHttpServer())
      .post(login_url)
      .send(correctCredentials);
    expect(res.body).toHaveProperty('token');
  });
});
describe('Full Password Reset Tests: [3 Endpoints Make Up This Process.]', () => {
  describe('[1 of 3] Change Password Endpoint /api/auth/change-password', () => {
    let app: INestApplication;
    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });
    const change_password_url = '/api/auth/change-password';
    test('[14] Successfully returns status code 422 for empty post request.', async () => {
      const res = await request(app.getHttpServer())
        .post(change_password_url)
        .send();
      expect(res.status).toBe(422);
    });
    test('[15] Successfully throws error for incorrect request body.', async () => {
      const exectedErrors = [
        {
          email: {
            isEmail: 'Must Be A Valid Email.',
            isNotEmpty: 'Email Is Required.',
          },
        },
        {
          email: {
            isEmail: 'Must Be A Valid Email.',
          },
        },
      ];
      const payloads = ['', { email: 'jacoblang' }];
      for (let i = 0; i < payloads.length; i++) {
        const res = await request(app.getHttpServer())
          .post(change_password_url)
          .send(payloads[i]);
        expect(res.body).toMatchObject(exectedErrors[i]);
      }
    });
    test('[16] Successfully throws 429 code and error message for rate limit.', async () => {
      let ratelimit = 5;
      while (ratelimit > 0) {
        const res = await request(app.getHttpServer())
          .post(change_password_url)
          .send();
        expect(res.body).toMatchObject({
          email: {
            isEmail: 'Must Be A Valid Email.',
            isNotEmpty: 'Email Is Required.',
          },
        });
        ratelimit--;
      }
      const res = await request(app.getHttpServer())
        .post(change_password_url)
        .send();
      expect(res.status).toBe(429);
      expect(res.body).toMatchObject({ message: 'Too Many Requests.' });
    });
    test('[17] Successfully throws error if user does not exist.', async () => {
      const creds = { email: 'jacoblang72@comcast.net' };
      const res = await request(app.getHttpServer())
        .post(change_password_url)
        .send(creds);
      expect(res.status).toBe(400);
      expect(res.body.message).toBeTruthy();
      expect(res.body.message).toBe('Account Not Found.');
    });
    test('[18] Successfully sends email with verification code.', async () => {
      await resetDb();
      const register_url = '/api/auth/registration';
      const creds = {
        username: 'jacoblang11',
        password: 'helloWorld?11',
        age: '22',
        first_name: 'jacob',
        last_name: 'lang',
        email: 'jacoblang127@gmail.com',
      };
      await request(app.getHttpServer()).post(register_url).send(creds);
      const res = await request(app.getHttpServer())
        .post(change_password_url)
        .send({ email: creds.email });
      expect(res.text).toStrictEqual(
        'Check Your Inbox For Your Verification Code.',
      );
    });
    test('[19] Successfully validates the email verification code exists in the Database.', async () => {
      const email: string = 'jacoblang127@gmail.com';
      const prisma: AuthenticationPrismaProvider =
        new AuthenticationPrismaProvider();
      const res = await request(app.getHttpServer()) //eslint-disable-line
        .post(change_password_url)
        .send({ email: email });
      const lastCode: VerificationCode =
        await prisma.getLastVerificationCode(email);
      expect(lastCode).not.toBeNull();
      expect(lastCode.expiration_date.getTime()).toBeGreaterThan(Date.now());
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      expect(lastCode.expiration_date.getTime()).toBeLessThan(
        fiveMinutesFromNow.getTime(),
      );
    });
    test('[20] Successfully converts last generated and stored input`is_valid` field in `VerficationCode` table to false and then only allows one valid verification code.', async () => {
      //stores verification codes
      const verificationCodes: Record<
        string,
        string | number | Date | boolean
      >[] = [null, null, null, null];
      //email
      const email: string = 'jacoblang127@gmail.com';
      const prisma = new AuthenticationPrismaProvider();
      //loops and sends out 4 emails.
      for (let i = 0; i < verificationCodes.length; i++) {
        await request(app.getHttpServer())
          .post(change_password_url)
          .send({ email });
        //this stores the email
        verificationCodes[i] = await prisma.getLastVerificationCode(email);
      }
      for (let i = 0; i < verificationCodes.length - 1; i++) {
        const currentCodeId = verificationCodes[i];
        const isInvalidated: VerificationCode =
          await prisma.findVerificationCodeById(Number(currentCodeId.id));
        expect(isInvalidated.is_valid).toBeFalsy();
      }
      const isValid = await prisma.findVerificationCodeById(
        Number(verificationCodes.at(-1).id),
      );
      expect(isValid).toBeTruthy();
    });
  });
  describe('[2 of 3] Verify Code Endpoint /api/auth/verify-code', () => {
    test.todo('Throws Ratelimit error');
    test.todo('Throws error for empty request body.');
    test.todo('Throws error for incorrect or invalid email.');
    test.todo(
      'Throws error for non existing code or code that has been previously invalidated (the first error in the middleware).',
    );
    test.todo(
      'Throws error for if the code is expired. but is not marked as expired. successfully updates the field in the table and invalidates code.',
    );
    test.todo('throws error for invalid code.');
    test.todo('successfully returns jwt token.');
  });
});
