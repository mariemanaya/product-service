import {DefaultCrudRepository} from '@loopback/repository';
import {Product} from '../models/product.model';
import {inject} from '@loopback/core';
import {MongoDataSource} from '../datasources/mongo.datasource';

export class ProductRepository extends DefaultCrudRepository<
  Product,
  typeof Product.prototype.code
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(Product, dataSource);
  }
}
