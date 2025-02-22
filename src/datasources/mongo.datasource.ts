import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'mongo',
  connector: 'mongodb',
  url: 'mongodb+srv://chaoualihiba25:PieKnSqvBh0eOD2k@openfoodfact-back.zvz9a.mongodb.net/test', // Correction du nom de la BDD

  useNewUrlParser: true,
  useUnifiedTopology: true,
};

@lifeCycleObserver('datasource')
export class MongoDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'mongo';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.mongo', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
