import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {History} from '../models/history.model';
import {inject} from '@loopback/core';

export class HistoryRepository extends DefaultCrudRepository<
  History,
  typeof History.prototype._id
> {
  constructor(@inject('datasources.mongo') dataSource: juggler.DataSource) {
    super(History, dataSource);
  }
}
