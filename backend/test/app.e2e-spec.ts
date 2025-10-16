import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { API_PREFIX } from '../src/app.constants';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.HEALTH_HEAP_LIMIT_MB = '512';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(API_PREFIX);
    await app.init();
  });

  it(`/${API_PREFIX}/health (GET)`, () => {
    const httpServer = app.getHttpServer() as unknown as Parameters<typeof request>[0];

    return request(httpServer)
      .get(`/${API_PREFIX}/health`)
      .expect(200)
      .expect((res) => {
        expect((res.body as { status: string }).status).toBe('ok');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
