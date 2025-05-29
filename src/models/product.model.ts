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

  // Nutrition
  @property({type: 'object'})
  nutrition?: {
    nutrientLevels?: {
      fat?: string;
      salt?: string;
      saturatedFat?: string;
      sugars?: string;
    };
    facts?: {
      energyKcal?: number;
      fat?: number;
      carbohydrates?: number;
      proteins?: number;
      salt?: number;
    };
  };

  // Ingredients
  @property({type: 'object'})
  ingredients?: {
    text?: string;
    analysis?: {
      vegan?: boolean;
      vegetarian?: boolean;
      palmOil?: boolean;
    };
    allergens?: string[];
  };

  // Processing
  @property({type: 'object'})
  processing?: {
    novaGroup?: number;
    additives?: string[];
  };

  // Environment
  @property({type: 'object'})
  environment?: {
    ecoscore?: string;
    carbonFootprint?: number;
    packaging?: string[];
  };

  @property({type: 'string'})
  categories?: string;

  @property({type: 'string'})
  brand?: string;

  @property({type: 'boolean'})
  halalStatus?: boolean;

  @property({type: 'string'})
  imageUrl?: string;
  @property({
    type: 'boolean',
    required: false,
    transient: true, 
    jsonSchema: {
      readOnly: true
    }
  })
  isFavorite?: boolean;

  @property({
    type: 'boolean',
    transient: true
  })
  hasAllergenAlert?: boolean;


  @property({
    type: 'string',
    transient: true
  })
  alertMessage?: string;

  constructor(data?: Partial<Product>) {
    super(data);
  }
}
