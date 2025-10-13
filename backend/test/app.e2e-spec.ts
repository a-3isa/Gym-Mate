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
    return request(app.getHttpServer())
      .get(`/${API_PREFIX}/health`)
      .expect(200)
      .expect((res: any) => {
        expect(res.body.status).toBe('ok');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
