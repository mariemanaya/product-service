import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    mongodb: { collection: 'products' },
    indexes: {
      nameIndex: {
        keys: { name: 1 },
        options: { collation: { locale: 'fr', strength: 1 } }
      }
    }
  }
})
export class Product extends Entity {
  @property({type: 'string', id: true, required: true})
  code: string;

  @property({type: 'string', required: true})
  name: string;

  @property({type: 'string'})
  nutriscore?: string;

  @property({type: 'string'})
  ingredients?: string;

  @property({type: 'string'})
  categories?: string;

  @property({type: 'string'})
  allergens?: string;

  @property({type: 'string'})
  brand?: string;

  @property({type: 'boolean'})
  halalStatus?: boolean;

  @property({type: 'string'})
  imageUrl?: string;

  constructor(data?: Partial<Product>) {
    super(data);
  }
}
