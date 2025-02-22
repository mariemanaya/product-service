import { Entity, model, property } from '@loopback/repository';

@model()
export class Product extends Entity {
  @property({ type: 'string', id: true, generated: false })
  code: string;

  @property({ type: 'string' })
  name?: string;

  @property({ type: 'string' })
  nutriscore?: string;

  @property({ type: 'string' })
  ingredients?: string;  // Ajout de la propriété ingredients

  constructor(data?: Partial<Product>) {
    super(data);
  }
}
