import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {Favorite} from '../models/favorite.model';
import {inject} from '@loopback/core';

export class FavoriteRepository extends DefaultCrudRepository<
  Favorite,
  typeof Favorite.prototype.id
> {
  constructor(
    @inject('datasources.mongo') dataSource: juggler.DataSource,
  ) {
    super(Favorite, dataSource);
  }
}
