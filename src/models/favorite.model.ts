import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    mongodb: {collection: 'favorites'},
    indexes: {
      uniqueFavorite: {
        keys: {uid: 1, productId: 1},
        options: {unique: true}
      }
    }
  }
})
export class Favorite extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
    mongodb: {dataType: 'ObjectId'},
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  uid: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {pattern: '^\\d+$'} // Validation code barre
  })
  productId: string;

  @property({
    type: 'date',
    default: () => new Date(),
    mongodb: {
      dataType: 'Timestamp',
    },
  })
  createdAt?: Date;

  constructor(data?: Partial<Favorite>) {
    super(data);
  }
}
