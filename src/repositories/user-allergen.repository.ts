// src/repositories/user-allergen.repository.ts
import {DefaultCrudRepository} from '@loopback/repository';
import {UserAllergen} from '../models/user-allergen.model';
import {MongoDataSource} from '../datasources/mongo.datasource';
import {inject} from '@loopback/core';

export class UserAllergenRepository extends DefaultCrudRepository<
  UserAllergen,
  typeof UserAllergen.prototype.id
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(UserAllergen, dataSource);
  }
}

