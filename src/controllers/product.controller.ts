import {repository} from '@loopback/repository';
import {get, post, del, param, HttpErrors, requestBody} from '@loopback/rest';
import axios from 'axios';
import {Product} from '../models/product.model';
import {ProductRepository} from '../repositories/product.repository';
import {HistoryRepository} from '../repositories/history.repository';
import {History} from '../models/history.model';
import {UserAllergen} from '../models/user-allergen.model';
import {FavoriteRepository} from '../repositories/favorite.repository';
import {UserAllergenRepository} from '../repositories/user-allergen.repository';

export class ProductController {
  private readonly API_URL = 'https://world.openfoodfacts.org/api/v2/product';
  private readonly USER_AGENT = 'openfoodfacts/1.0 (mariemanaya20@gmail.com)';

  constructor(
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(HistoryRepository)
    public historyRepository: HistoryRepository,
    @repository(FavoriteRepository)
    public favoriteRepository: FavoriteRepository,
    @repository(UserAllergenRepository)
    public userAllergenRepository: UserAllergenRepository,
  ) {}

  @post('/users/allergens')
  async setUserAllergens(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              uid: {type: 'string'},
              allergens: {
                type: 'array',
                items: {type: 'string'}
              }
            },
            required: ['uid', 'allergens']
          }
        }
      }
    })
    body: {uid: string; allergens: string[]}
  ): Promise<UserAllergen> {
    // Suppression des entrées existantes
    await this.userAllergenRepository.deleteAll({uid: body.uid});

    // Création d'une nouvelle entrée avec les allergènes en minuscules
    return this.userAllergenRepository.create({
      uid: body.uid,
      allergens: body.allergens.map(a => a.toLowerCase())
    });
  }

  @get('/users/{uid}/allergens')
  async getUserAllergens(
    @param.path.string('uid') uid: string
  ): Promise<string[]> {
    const allergens = await this.userAllergenRepository.findOne({where: {uid}});
    return allergens?.allergens ?? [];
  }

  @del('/users/{uid}/allergens')
  async clearUserAllergens(
    @param.path.string('uid') uid: string
  ): Promise<void> {
    await this.userAllergenRepository.deleteAll({uid});
  }



  //  FAVORIS //
  @post('/favorites/toggle')
  async toggleFavorite(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              uid: {type: 'string'},
              product_id: {type: 'string'},
            },
            required: ['uid', 'product_id'],
          },
        },
      },
    })
    body: {uid: string; product_id: string},
  ): Promise<{action: 'added' | 'removed'}> {
    await this.productRepository.findById(body.product_id);
    const existing = await this.favoriteRepository.findOne({
      where: {uid: body.uid, productId: body.product_id}
    });

    if (existing) {
      await this.favoriteRepository.deleteById(existing.id);
      return {action: 'removed'};
    } else {
      await this.favoriteRepository.create({
        uid: body.uid,
        productId: body.product_id,
        createdAt: new Date(),
      });
      return {action: 'added'};
    }
  }
  @get('/favorites')
  async getFavorites(
    @param.query.string('uid') uid: string,
  ): Promise<Array<{
    id: string;
    product_id: string;
    product_name: string;
    image_url: string;
    isFavorite: boolean;
  }>> {
    if (!uid) throw new HttpErrors.BadRequest('UID required');
    const favorites = await this.favoriteRepository.find({
      where: {uid},
      order: ['createdAt DESC'],
    });
    const products = await this.productRepository.find({
      where: {code: {inq: favorites.map(f => f.productId)}}
    });
    return favorites.map(fav => ({
      id: fav.id!,
      product_id: fav.productId,
      product_name: products.find(p => p.code === fav.productId)?.name || 'Unknown',
      image_url: products.find(p => p.code === fav.productId)?.imageUrl || '',
      isFavorite: true,
    }));
  }

  //  HISTORIQUE  //
  @post('/products/scan')
  async recordScan(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              uid: {type: 'string'},
              product_id: {type: 'string'},
            },
            required: ['uid', 'product_id'],
          },
        },
      },
    })
    body: {uid: string; product_id: string},
  ): Promise<History> {
    return this.handleHistoryAction(body, 'scan');
  }

  @post('/products/view')
  async recordView(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              uid: {type: 'string'},
              product_id: {type: 'string'},
            },
            required: ['uid', 'product_id'],
          },
        },
      },
    })
    body: {uid: string; product_id: string},
  ): Promise<History> {
    return this.handleHistoryAction(body, 'view');
  }

  @get('/products/history')
  async getHistory(
    @param.query.string('uid') uid: string,
  ): Promise<any[]> {
    if (!uid) throw new HttpErrors.BadRequest('UID required');

    const history = await this.historyRepository.find({
      where: {uid},
      order: ['timestamp DESC'],
      limit: 50
    });

    const products = await this.productRepository.find({
      where: {code: {inq: [...new Set(history.map(h => h.product_id))]}}
    });

    return history.map(entry => ({
      ...entry,
      productName: products.find(p => p.code === entry.product_id)?.name || 'Unknown',
      imageUrl: products.find(p => p.code === entry.product_id)?.imageUrl || ''
    }));
  }

  @del('/products/history/{id}')
  async deleteHistoryEntry(
    @param.path.string('id') id: string,
  ): Promise<{message: string}> {
    await this.historyRepository.deleteById(id);
    return {message: 'History entry deleted successfully'};
  }

  //  PRODUITS  //
  private async addFavoriteStatus(product: Product, uid?: string): Promise<Product> {
    // Vérification des favoris
    const isFavorite = uid ?
      (await this.favoriteRepository.count({uid, productId: product.code})).count > 0 :
      false;

    // Vérification des allergènes
    let hasAllergenAlert = false;
    let alertMessage = '';

    if (uid) {
      const userAllergens = await this.userAllergenRepository.findOne({where: {uid}});
      if (userAllergens?.allergens?.length) {
        const productAllergens = product.ingredients?.allergens?.map(a => a.toLowerCase()) ?? [];
        const matchingAllergens = userAllergens.allergens.filter(a =>
          productAllergens.includes(a.toLowerCase())
        );

        if (matchingAllergens.length) {
          hasAllergenAlert = true;
          alertMessage = `Ce produit contient vos allergènes : ${matchingAllergens.join(', ')}`;
        }
      }
    }

    return Object.assign(new Product(), {
      ...product.toObject(),
      isFavorite,
      hasAllergenAlert,
      alertMessage
    });
  }

  @get('/products/{code}')
  async getProduct(
    @param.path.string('code') code: string,
    @param.query.string('uid') uid?: string,
  ): Promise<Product> { // Retourne juste Product maintenant
    const product = await this.fetchOrCreateProduct(code);
    return this.addFavoriteStatus(product, uid);
  }

  @get('/products/search/{name}')
  async searchProducts(
    @param.path.string('name') name: string,
    @param.query.string('uid') uid?: string,
  ): Promise<Product[]> {
    const results = await this.searchInDatabaseAndAPI(name);
    return Promise.all(results.map(p => this.addFavoriteStatus(p, uid)));
  }


  // METHODES PRIVEES //
  private async fetchOrCreateProduct(code: string): Promise<Product> {
    const existing = await this.productRepository.findOne({where: {code}});
    if (existing) return existing;

    const response = await axios.get(`${this.API_URL}/${code}.json`, {
      headers: {'User-Agent': this.USER_AGENT}
    });

    if (response.data.status !== 1) {
      throw new HttpErrors.NotFound(`Product ${code} not found`);
    }

    const newProduct = this.mapApiProduct(response.data.product);
    return this.productRepository.create(newProduct);
  }

  private mapApiProduct(apiProduct: any): Product {
    return new Product({
      code: apiProduct.code,
      name: apiProduct.product_name || 'Unknown',
      brand: this.formatField(apiProduct.brands),
      categories: this.formatField(apiProduct.categories),
      imageUrl: apiProduct.image_url || '',
      halalStatus: apiProduct.labels?.includes('Halal'),
      nutriscore: apiProduct.nutriscore_grade?.toUpperCase() || 'N/A',
      nutrition: {
        nutrientLevels: apiProduct.nutrient_levels,
        facts: {
          energyKcal: apiProduct.nutriments?.['energy-kcal_100g'],
          fat: apiProduct.nutriments?.fat_100g,
          carbohydrates: apiProduct.nutriments?.carbohydrates_100g,
          proteins: apiProduct.nutriments?.proteins_100g,
          salt: apiProduct.nutriments?.salt_100g
        }
      },
      ingredients: {
        text: this.formatField(apiProduct.ingredients_text),
        analysis: {
          vegan: apiProduct.ingredients_analysis_tags?.includes('en:vegan'),
          vegetarian: apiProduct.ingredients_analysis_tags?.includes('en:vegetarian'),
          palmOil: apiProduct.ingredients_from_palm_oil_tags?.length > 0
        },
        allergens: this.cleanTags(apiProduct.allergens_hierarchy)
      },
      processing: {
        novaGroup: apiProduct.nova_group,
        additives: this.cleanTags(apiProduct.additives_tags)
      },
      environment: {
        ecoscore: apiProduct.ecoscore_grade,
        carbonFootprint: apiProduct.carbon_footprint_percent_of_known_ingredients,
        packaging: this.cleanTags(apiProduct.packaging_tags)
      }
    });
  }

  private async handleHistoryAction(
    body: {uid: string; product_id: string},
    actionType: 'scan' | 'view'
  ): Promise<History> {
    await this.productRepository.findById(body.product_id);
    return this.historyRepository.create({
      uid: body.uid,
      product_id: body.product_id,
      actionType,
      timestamp: new Date().toISOString()
    });
  }

  private formatField(field: any): string {
    if (!field) return 'N/A';
    if (Array.isArray(field)) return field.join(', ');
    return String(field);
  }

  private cleanTags(tags?: string[]): string[] {
    return tags?.map(t => t.replace(/^en:/, '')) || [];
  }

  private async searchInDatabaseAndAPI(name: string): Promise<Product[]> {
    const dbResults = await this.productRepository.find({
      where: {name: {regexp: `/${name}/i`}},
      limit: 20
    });

    if (dbResults.length >= 10) return dbResults;

    try {
      const response = await axios.get(`https://world.openfoodfacts.net/cgi/search.pl`, {
        params: {search_terms: name, json: 1, page_size: 20},
        headers: {'User-Agent': this.USER_AGENT}
      });

      return Promise.all(
        response.data.products
          .filter((p: any) => p.product_name)
          .map(async (p: any) => {
            const existing = await this.productRepository.findOne({where: {code: p.code}});
            return existing || this.productRepository.create(this.mapApiProduct(p));
          })
      );
    } catch (error) {
      console.error('Search API error:', error);
      return dbResults;
    }
  }
}
