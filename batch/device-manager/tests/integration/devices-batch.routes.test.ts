import { Server } from 'http';

import request from 'supertest';

import { RemoveDevicesBatchDto } from '../../src/app/dto/remove-devices-batch.dto';
import { AuthSetup, AppSetup } from './setup';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $disconnect: jest.fn(),
    devices: {
      delete: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue({}),
    },
  })),
}));

describe('Devices-batch.routes', () => {
  const removeDevicesBatchDto: RemoveDevicesBatchDto = {
    devices: ['1', '2'],
  };
  let server: Server;

  beforeAll(async () => {
    server = await AppSetup.initApp();
  });

  afterAll(() => {
    server.close();
  });

  it('should return response status 200 and ids and label of devices removed', async () => {
    const response = await request(server)
      .put('/devices_batch')
      .set('Authorization', `Bearer ${AuthSetup.signJWT()}`)
      .send(removeDevicesBatchDto);

    expect(response.statusCode).toBe(200);
  });

  it('should return response status 400 with validation field', async () => {
    const response = await request(server)
      .put('/devices_batch')
      .set('Authorization', `Bearer ${AuthSetup.signJWT()}`)
      .send({});

    expect(response.status).toBe(400);
  });
});
