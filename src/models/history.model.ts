import {Entity, model, property} from '@loopback/repository';

@model({settings: {mongodb: {collection: 'history'}}})
export class History extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  _id?: string;

  @property({type: 'string', required: true})
  uid: string;

  @property({type: 'string', required: true})
  product_id: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {enum: ['scan', 'view']}
  })
  actionType: string;

  @property({type: 'string', required: true})
  timestamp: string;


  @property({type: 'string'})
  productName?: string;

  @property({type: 'string'})
  imageUrl?: string;

  constructor(data?: Partial<History>) {
    super(data);
  }
}
