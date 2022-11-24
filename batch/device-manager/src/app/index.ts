import { Express } from 'express';
import { Logger, ServiceStateManager, WebUtils } from '@dojot/microservice-sdk';
import {
  DefaultErrorHandlerInterceptor,
  KafkaProducerClientInterceptor,
  PrismaClientInterceptor,
} from './interceptors';
import { AppConfig } from '../types';
import { KafkaConsumer, TenantManager, KafkaProducer } from '../kafka';
import { DeviceRoutes } from '../app/routes';
import { PrismaUtils } from 'src/utils/Prisma.utils';
import { TemplateRoutes } from './routes/Template.routes';
import { SERVICE_NAMES } from './constants/ServiceNames.constants';

export class App {
  constructor(
    private logger: Logger,
    private appconfig: AppConfig,
    private prismaUtils: PrismaUtils,
    private kafkaConsumer: KafkaConsumer,
    private tenantManager: TenantManager,
    private kafkaProducer: KafkaProducer,
    private serviceState: ServiceStateManager,
  ) {}

  private createExpress(): Express {
    const { createKeycloakAuthInterceptor, jsonBodyParsingInterceptor } =
      WebUtils.framework.interceptors;

    return WebUtils.framework.createExpress({
      server: undefined,
      logger: this.logger,
      supportWebsockets: false,
      supportTrustProxy: false,
      catchInvalidRequest: false,
      errorHandlers: [
        DefaultErrorHandlerInterceptor.use(this.prismaUtils),
        WebUtils.framework.defaultErrorHandler({
          logger: this.logger,
        }),
      ],
      interceptors: [
        jsonBodyParsingInterceptor({
          config: {
            limit: this.appconfig.express['parsing.limit'],
          },
        }),
        createKeycloakAuthInterceptor(
          this.tenantManager.tenants,
          this.logger,
          '/',
        ),
        KafkaProducerClientInterceptor.use(
          this.logger,
          this.appconfig,
          this.kafkaProducer,
        ),
        PrismaClientInterceptor.use(
          this.logger,
          this.appconfig,
          this.prismaUtils,
        ),
      ],
      routes: [
        DeviceRoutes.use(this.logger, this.kafkaProducer, this.prismaUtils),
        TemplateRoutes.use(this.logger, this.kafkaProducer, this.prismaUtils),
      ].flat(),
    });
  }

  async init() {
    this.serviceState.registerService(SERVICE_NAMES.DEVICE_MANAGER_BATCH);

    await this.kafkaConsumer.init();
    await this.tenantManager.update();

    await this.kafkaProducer.init();

    const express = this.createExpress();
    const server = express.listen(this.appconfig.api.port);

    server.on('listening', () => {
      this.logger.info('Server is ready to accept connections', {});
      this.logger.info(`Running at port: ${this.appconfig.api.port}`, {});
      this.serviceState.signalReady(SERVICE_NAMES.DEVICE_MANAGER_BATCH);
    });

    server.on('close', () => {
      this.serviceState.signalNotReady(SERVICE_NAMES.DEVICE_MANAGER_BATCH);
    });

    server.on('error', () => {
      this.logger.info('Received error event', {});
      this.serviceState.signalNotReady(SERVICE_NAMES.DEVICE_MANAGER_BATCH);
    });

    return server;
  }
}
