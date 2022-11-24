import { Server } from 'http';

import request from 'supertest';

import { AuthSetup, AppSetup } from './setup';
import { RemoveTemplatesBatchDto } from 'src/types';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $disconnect: jest.fn(),
    templates: {
      delete: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue({}),
    },
  })),
}));

describe('Templates-batch.routes', () => {
  let server: Server;

  beforeAll(async () => {
    server = await AppSetup.initApp();
  });

  afterAll(() => {
    server.close();
  });

  const removeTemplatesBatchDto: RemoveTemplatesBatchDto = {
    templates: [1, 2, 8],
  };

  it('should return response status 200 and ids and label of templates removed ', async () => {
    const response = await request(server)
      .put('/templates_batch')
      .set('Authorization', `Bearer ${AuthSetup.signJWT()}`)
      .send(removeTemplatesBatchDto);

    server.close();
    expect(response.status).toBe(200);
  });

  it('should return response status 400 with validation field', async () => {
    const removeTemplatesBatchDto: RemoveTemplatesBatchDto = {
      templates: [],
    };

    const response = await request(server)
      .put('/templates_batch')
      .set('Authorization', `Bearer ${AuthSetup.signJWT()}`)
      .send(removeTemplatesBatchDto);

    expect(response.status).toBe(400);
  });
});
