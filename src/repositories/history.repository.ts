import {DefaultCrudRepository} from '@loopback/repository';
import {History} from '../models/history.model';
import {MongoDataSource} from '../datasources/mongo.datasource';
import {inject} from '@loopback/core';

export class HistoryRepository extends DefaultCrudRepository<
  History,
  typeof History.prototype.id
> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(History, dataSource);
  }
}
