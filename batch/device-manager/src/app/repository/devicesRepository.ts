import { Logger } from '@dojot/microservice-sdk';
import { PrismaClient } from '@prisma/client';

export class DevicesRepository {
  constructor(private logger: Logger) {
    this.logger.info('Create Constructor DevicesRepository', {});
  }

  async remove(prisma: PrismaClient, id_devices: string) {
    return await prisma.devices.delete({
      where: { id: id_devices.toString() },
    });
  }

  async findByIdWithTemplatesAttrs(prisma: PrismaClient, id: string) {
    return await prisma.devices.findUnique({
      where: { id: id.toString() },
      include: {
        device_template: {
          include: {
            templates: {
              select: {
                id: true,
                label: true,
                attrs: {},
              },
            },
          },
        },
      },
    });
  }

  async remove_associate_templates(prisma: PrismaClient, id_device: string) {
    return await prisma.$executeRaw`DELETE FROM device_template WHERE device_id = ${id_device}`;
  }

  async remove_associate_overrides(prisma: PrismaClient, id_device: string) {
    return await prisma.$executeRaw`DELETE FROM overrides WHERE did = ${id_device}`;
  }

  async remove_associate_pre_shared_keys(
    prisma: PrismaClient,
    id_device: string,
  ) {
    return await prisma.$executeRaw`DELETE FROM pre_shared_keys WHERE device_id = ${id_device}`;
  }

  async create(prisma: PrismaClient, id: string, prefix_name: string) {
    return await prisma.devices.create({
      data: {
        id: id,
        label: prefix_name,
        created: new Date(),
      },
    });
  }

  async create_associated_devices_templates(
    prisma: PrismaClient,
    device_id: string,
    template_id: number,
  ) {
    return await prisma.device_template.create({
      data: {
        device_id: device_id,
        template_id: template_id,
      },
    });
  }

  async assert_devices_exists(prisma: PrismaClient, label: string) {
    return await prisma.devices.findUnique({
      where: {
        label: label,
      },
    });
  }
}
