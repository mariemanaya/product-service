import {DefaultCrudRepository} from '@loopback/repository';
import {Product} from '../models/product.model';
import {inject} from '@loopback/core';
import {MongoDataSource} from '../datasources/mongo.datasource'; // Correction de l'importation

export class ProductRepository extends DefaultCrudRepository<
  Product,
  typeof Product.prototype.code // Correction : utiliser `code` comme clé primaire (si c'est l'ID)
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource, // Injection correcte de la source de données
  ) {
    super(Product, dataSource);
  }
}
