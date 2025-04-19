// src/models/user-preferences.model.ts
import { Entity, model, property } from '@loopback/repository';

@model()
export class UserPreferences extends Entity {
  @property({
    type: 'string',
    id: true, // Clé primaire
    generated: false,
  })
  uid: string; // ❗ Remplacé userId par uid

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
  })
  allergens: string[];

  constructor(data?: Partial<UserPreferences>) {
    super(data);
  }
}
