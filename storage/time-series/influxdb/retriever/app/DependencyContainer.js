const {
  LocalPersistence: {
    LocalPersistenceManager,
  },
  WebUtils: {
    DojotClientHttp,
  },
} = require('@dojot/microservice-sdk');
const { InfluxDB } = require('@influxdata/influxdb-client');

const DeviceDataRepository = require('./influx/DeviceDataRepository');
const DeviceDataService = require('./express/services/v1/DeviceDataService');
const GenericQueryService = require('./express/services/v1/GenericQueryService');

const RetrieverConsumer = require('./sync/RetrieverConsumer');
const TenantService = require('./sync/TenantService');
const DeviceManagerService = require('./sync/DeviceManagerService');
const SyncLoader = require('./sync/SyncLoader');

function dependencyContainerFactory(config, logger) {
  const dojotClientHttp = new DojotClientHttp({
    logger,
    defaultClientOptions: {},
    defaultRetryDelay: 15000,
    defaultMaxNumberAttempts: 3,
  });
  const influxDBConnection = new InfluxDB({
    url: config.influx.url,
    token: config.influx['default.token'],
    timeout: config.influx['max.timeout.ms'],
  });

  // API Dependencies
  const deviceDataRepository = new DeviceDataRepository(config.influx['default.bucket'], influxDBConnection);
  const deviceDataService = new DeviceDataService(deviceDataRepository);
  const genericQueryService = new GenericQueryService(deviceDataRepository);

  // Sync Dependencies
  const localPersistence = new LocalPersistenceManager(logger, true, config.sync['database.path']);
  const tenantService = new TenantService(
    localPersistence,
    config.sync.tenants,
    dojotClientHttp,
    config.keycloak,
    logger,
  );
  const deviceManagerService = new DeviceManagerService(
    config.sync.devices,
    dojotClientHttp,
    localPersistence,
    logger,
  );
  const retrieverConsumer = new RetrieverConsumer(localPersistence, tenantService, deviceManagerService,);

  const syncLoader = new SyncLoader(
    localPersistence,
    tenantService,
    deviceManagerService,
    retrieverConsumer,
  );

  return {
    influxDBConnection,
    deviceDataRepository,
    deviceDataService,
    genericQueryService,
    tenantService,
    deviceManagerService,
    syncLoader,
  };
}


module.exports = dependencyContainerFactory;
