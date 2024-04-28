import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import * as request from 'supertest';
import { deleteCustomer } from '../../../prisma/deleteCustomer';

describe('Create new customer endpoint: [/api/customer/create-new-customer]', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
  const newCustomerUrl = '/api/customer/create-new-customer';
  test('[1] Rate limit error is thrown when over 100 requests are made in 1 minute.', async () => {
    for (let i = 0; i < 100; i++) {
      const res: request.Response = await request(app.getHttpServer())
        .post(newCustomerUrl)
        .send();
      expect(res.status).not.toBe(429);
    }
    const res: request.Response = await request(app.getHttpServer())
      .post(newCustomerUrl)
      .send();
    expect(res.status).toBe(429);
  });
  test('[2] Throws error if no Jwt is present in authorization headers.', async () => {
    const res: request.Response = await request(app.getHttpServer())
      .post(newCustomerUrl)
      .send();
    const expectedProperties: string[] = ['message', 'statusCode'];
    for (const property of expectedProperties) {
      expect(res.body).toHaveProperty(property);
    }
    expect(res.body).toMatchObject({
      message: 'Token Required.',
      statusCode: 401,
    });
  });
  test('[3] Throws Error if Jwt is present, but invalid.', async () => {
    const credentials: Record<string, string> = {
      username: 'jacoblang11',
      password: 'helloWorld?11',
    };
    const loginUrl: string = '/api/auth/login';
    const res: request.Response = await request(app.getHttpServer())
      .post(loginUrl)
      .send(credentials);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toBeTruthy();
    const token: string = res.body.token;
    const incorrectToken = token.concat('h');
    const res2: request.Response = await request(app.getHttpServer())
      .post(newCustomerUrl)
      .set({ authorization: incorrectToken })
      .send();
    expect(res2.status).toBe(401);
    expect(res2.body).toHaveProperty('message');
    expect(res2.body.message).toBe('invalid signature');
    const incorrectToken2 = token.split('');
    incorrectToken2.splice(token.length - 1, 1, 'u');
    const res3: request.Response = await request(app.getHttpServer())
      .post(newCustomerUrl)
      .set({ authorization: incorrectToken2.join('') })
      .send();
    expect(res3.body.message).not.toBe(null);
    expect(res3.body.message).toBe('invalid signature');
  });
  test('[4] Throws error if invalid request body is received.', async () => {
    const credentials: Record<string, string> = {
      username: 'jacoblang11',
      password: 'helloWorld?11',
    };
    const loginUrl: string = '/api/auth/login';
    const loginRes: request.Response = await request(app.getHttpServer())
      .post(loginUrl)
      .send(credentials);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body.token).toBeTruthy();
    const token: string = loginRes.body.token;
    const res: request.Response = await request(app.getHttpServer())
      .post(newCustomerUrl)
      .set({ authorization: token })
      .send();
    expect(res.body).toMatchObject({
      phoneNumber: {
        isNotEmpty: /phone number is required./i,
        isString: /phone number must be a string./i,
        matches: /phone number must only contain numbers./i,
        minLength: /invalid phone number./i,
      },
      address: {
        isNotEmpty: /address is required./i,
        isString: /address must be a string./i,
        minLength: /address must be longer than 5 characters./i,
        // ^[.,a-zA-Z0-9\s]+$
        matches: /invalid address./i,
      },
      full_name: {
        isNotEmpty: /full name is required./i,
        isString: /full name must be a string./i,
        matches: /full name must only contain letters./i,
      },
      email: {
        isNotEmpty: /email is required./i,
        isEmail: /invalid email./i,
      },
    });
  });
  test('[5] Validates the correct errors are thrown for the edge cases for the request body.', async () => {
    //incorrect phone number suite
    const credentials: Record<string, string> = {
      username: 'jacoblang11',
      password: 'helloWorld?11',
    };
    const loginUrl: string = '/api/auth/login';
    const loginRes: request.Response = await request(app.getHttpServer())
      .post(loginUrl)
      .send(credentials);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body.token).toBeTruthy();
    const token: string = loginRes.body.token;
    const incorrectPhonePayloadV1 = {
      phoneNumber: 111,
      address: '868 S Arizona Ave, Chandler, Arizona, 85225',
      full_name: 'John Smith',
      email: 'johnsmith@hotmail.com',
    };
    const incorrectPhonePayloadV2 = {
      phoneNumber: '203309409A',
      address: '868 S Arizona Ave, Chandler, Arizona, 85225',
      full_name: 'John Smith',
      email: 'johnsmith@hotmail.com',
    };
    const incorrectPhonePayloadErrorMessageV1 = {
      phoneNumber: {
        isString: /phone number must be a string./i,
        matches: /phone number must only contain numbers./i,
        minLength: /invalid phone number./i,
      },
    };
    const incorrectPhonePayloadErrorMessageV2 = {
      phoneNumber: {
        matches: /phone number must only contain numbers./i,
      },
    };
    //incorrect phone number suite
    //incorrect address
    const incorrectAddressPayloadV1 = {
      phoneNumber: '4439452195',
      address: true,
      full_name: 'John Smith',
      email: 'johnsmith@hotmail.com',
    };
    const incorrectAddressPayloadV2 = {
      phoneNumber: '4439452195',
      address: 'hel?',
      full_name: 'John Smith',
      email: 'johnsmith@hotmail.com',
    };
    const incorrectAddressPayloadV3 = {
      phoneNumber: '4439452195',
      address: 'heloi?',
      full_name: 'John Smith',
      email: 'johnsmith@hotmail.com',
    };
    const incorrectAddressPayloadErrorMessageV1 = {
      address: {
        isString: /address must be a string./i,
        minLength: /address must be longer than 5 characters./i,
        matches: /invalid address./i,
      },
    };
    const incorrectAddressPayloadErrorMessageV2 = {
      address: {
        matches: /invalid address./i,
        minLength: /address must be longer than 5 characters./i,
      },
    };
    const incorrectAddressPayloadErrorMessageV3 = {
      address: {
        matches: /invalid address./i,
      },
    };
    //incorrect address
    //incorrect full names
    const incorrectFullNamePayloadV1 = {
      phoneNumber: '4439452195',
      address: '868 S Arizona Ave. Apt#1002 Chandler, Arizona 85225-104',
      full_name: 'john-smith',
      email: 'johnsmith@hotmail.com',
    };
    const incorrectFullNamePayloadErrorMessageV1 = {
      full_name: {
        matches: /full name must only contain letters./i,
      },
    };
    const incorrectFullNamePayloadV2 = {
      phoneNumber: '4439452195',
      address: '868 S Arizona Ave. Apt#1002 Chandler, Arizona 85225-104',
      full_name: true,
      email: 'johnsmith@hotmail.com',
    };
    const incorrectFullNamePayloadErrorMessageV2 = {
      full_name: {
        isString: /full name must be a string./i,
        matches: /full name must only contain letters./i,
      },
    };
    //incorrect full names
    //incorrect email
    const incorrectEmailPayloadV1 = {
      phoneNumber: '4439452195',
      address: '868 S Arizona Ave. Apt#1002 Chandler, Arizona 85225-104',
      full_name: 'john-smith',
      email: 'johnsmithhotmail.com',
    };
    const incorrectEmailPayloadErrorMessageV1 = {
      email: {
        isEmail: /invalid email./i,
      },
    };
    //array of incorrect payloads with respective error messages, order matters here
    const incorrectPayload = [
      incorrectPhonePayloadV1,
      incorrectPhonePayloadV2,
      incorrectAddressPayloadV1,
      incorrectAddressPayloadV2,
      incorrectAddressPayloadV3,
      incorrectFullNamePayloadV1,
      incorrectFullNamePayloadV2,
      incorrectEmailPayloadV1,
    ];
    const expectedErrorMessages = [
      incorrectPhonePayloadErrorMessageV1,
      incorrectPhonePayloadErrorMessageV2,
      incorrectAddressPayloadErrorMessageV1,
      incorrectAddressPayloadErrorMessageV2,
      incorrectAddressPayloadErrorMessageV3,
      incorrectFullNamePayloadErrorMessageV1,
      incorrectFullNamePayloadErrorMessageV2,
      incorrectEmailPayloadErrorMessageV1,
    ];
    for (let i = 0; i < incorrectPayload.length; i++) {
      const res = await request(app.getHttpServer())
        .post(newCustomerUrl)
        .set({ authorization: token })
        .send(incorrectPayload[i]);
      expect(res.body).toMatchObject(expectedErrorMessages[i]);
    }
  });
  test('[6] Throws error if customer, related to a user, already exists in the database.', async () => {
    await deleteCustomer();
    const credentials: Record<string, string> = {
      username: 'jacoblang11',
      password: 'helloWorld?11',
    };
    const loginUrl: string = '/api/auth/login';
    const loginRes: request.Response = await request(app.getHttpServer())
      .post(loginUrl)
      .send(credentials);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body.token).toBeTruthy();
    const token: string = loginRes.body.token;
    const customerInput: Record<string, string> = {
      phoneNumber: '4439452195',
      address: '868 S Arizona Ave. Apt#1002 Chandler, Arizona 85225-104',
      full_name: 'john smith',
      email: 'johnsmith@hotmail.com',
    };
    const res: request.Response = await request(app.getHttpServer())
      .post(newCustomerUrl)
      .set({ authorization: token })
      .send(customerInput);
    expect(res.text).toBe('Successfully Created Customer.');
    const res2: request.Response = await request(app.getHttpServer())
      .post(newCustomerUrl)
      .set({ authorization: token })
      .send(customerInput);
    expect(res2.status).toBe(422);
    expect(res2.body).toHaveProperty('message');
    expect(res2.body).toHaveProperty('statusCode');
    const expectedMessage: Record<string, string | number> = {
      statusCode: 422,
      message:
        'Error Creating New Customer, Customer With One Of The Following Already Exists: email, phone number, address, full name.',
    };
    expect(res2.body).toMatchObject(expectedMessage);
  });
  test('[7] Successfully creates a new customer.', async () => {
    await deleteCustomer();
    const credentials: Record<string, string> = {
      username: 'jacoblang11',
      password: 'helloWorld?11',
    };
    const loginUrl: string = '/api/auth/login';
    const loginRes: request.Response = await request(app.getHttpServer())
      .post(loginUrl)
      .send(credentials);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body.token).toBeTruthy();
    const token: string = loginRes.body.token;
    const customerInput: Record<string, string> = {
      phoneNumber: '4439452195',
      address: '868 S Arizona Ave. Apt#1002 Chandler, Arizona 85225-104',
      full_name: 'john smith',
      email: 'johnsmith@hotmail.com',
    };
    const res: request.Response = await request(app.getHttpServer())
      .post(newCustomerUrl)
      .set({ authorization: token })
      .send(customerInput);
    expect(res.text).toBe('Successfully Created Customer.');
  });
});
