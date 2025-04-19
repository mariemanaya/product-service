// src/repositories/user-preferences.repository.ts
import { inject } from '@loopback/core';
import { DefaultCrudRepository } from '@loopback/repository';
import { MongoDataSource } from '../datasources/mongo.datasource';
import { UserPreferences } from '../models/user-preferences.model';

export class UserPreferencesRepository extends DefaultCrudRepository<
  UserPreferences,
  typeof UserPreferences.prototype.uid
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(UserPreferences, dataSource);
  }
}
