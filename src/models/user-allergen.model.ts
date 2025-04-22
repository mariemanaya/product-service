// src/models/user-allergen.model.ts
import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    mongodb: {collection: 'user_allergens'}
  }
})
export class UserAllergen extends Entity {
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
  uid: string;

  @property({
    type: 'array',
    itemType: 'string',
    required: true
  })
  allergens: string[];

  constructor(data?: Partial<UserAllergen>) {
    super(data);
  }
}
