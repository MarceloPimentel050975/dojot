import { Logger } from '@dojot/microservice-sdk';
import { PrismaClient } from '@prisma/client';

export class AttrsRepository {
  constructor(private logger: Logger) {
    this.logger.info('Create Constructor AttrsRepository', {});
  }

  async findById(prisma: PrismaClient, id: number) {
    return await prisma.attrs.findUnique({
      where: { id: id },
    });
  }

  async remove_associate_attrs_template(
    prisma: PrismaClient,
    id_template: number,
  ) {
    return await prisma.$executeRaw`DELETE FROM attrs WHERE template_id = ${id_template}`;
  }
}
