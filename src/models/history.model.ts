import {Entity, model, property} from '@loopback/repository';

@model()
export class History extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  barcode: string;

  @property({
    type: 'string',
  })
  productName?: string;

  @property({
    type: 'string',
  })
  nutriScore?: string;

  @property({
    type: 'string',
  })
  ingredients?: string;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  createdAt?: string;

  constructor(data?: Partial<History>) {
    super(data);
  }
}
