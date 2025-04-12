import {repository} from '@loopback/repository';
import {get, post, del, param, HttpErrors, requestBody} from '@loopback/rest';
import axios from 'axios';
import {Product} from '../models/product.model';
import {ProductRepository} from '../repositories/product.repository';
import {HistoryRepository} from '../repositories/history.repository';
import {History} from '../models/history.model';
import {FavoriteRepository} from '../repositories/favorite.repository';
import {Favorite} from '../models/favorite.model';

export class ProductController {
  constructor(
    @repository(ProductRepository)
    public productRepository: ProductRepository,
    @repository(HistoryRepository)
    public historyRepository: HistoryRepository,
    @repository(FavoriteRepository)
    public favoriteRepository: FavoriteRepository,
  ) {}

  private USER_AGENT = 'openfoodfacts/1.0 (mariemanaya20@gmail.com)';

  // ************************** FAVORIS ************************** //
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
      where: {
        uid: body.uid,
        productId: body.product_id,
      },
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
    uid: string;
    product_id: string;
    product_name: string;
    image_url: string;
    timestamp: string;
  }>> {
    if (!uid) throw new HttpErrors.BadRequest('UID required');

    const favorites = await this.favoriteRepository.find({
      where: {uid},
      order: ['createdAt DESC'],
    });

    const productIds = favorites.map(f => f.productId);
    const products = await this.productRepository.find({
      where: {code: {inq: productIds}},
    });

    const productMap = products.reduce((map, product) => {
      map[product.code] = product;
      return map;
    }, {} as Record<string, Product>);

    return favorites.map(fav => ({
      id: fav.id!,
      uid: fav.uid,
      product_id: fav.productId,
      product_name: productMap[fav.productId]?.name || 'Unknown Product',
      image_url: productMap[fav.productId]?.imageUrl || '',
      timestamp: fav.createdAt?.toISOString() || new Date().toISOString(),
    }));
  }

  // ************************** HISTORIQUE ************************** //
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

    const historyEntries = await this.historyRepository.find({
      where: {uid},
      order: ['timestamp DESC'],
      limit: 50,
      fields: {_id: false}
    });

    if (historyEntries.length === 0) return [];

    const productIds = [...new Set(historyEntries.map(h => h.product_id))];
    const products = await this.productRepository.find({
      where: {code: {inq: productIds}},
    });

    const productMap = products.reduce((map, product) => {
      map[product.code] = product;
      return map;
    }, {} as Record<string, Product>);

    return historyEntries.map(entry => ({
      ...entry,
      productName: productMap[entry.product_id]?.name || 'Unknown Product',
      imageUrl: productMap[entry.product_id]?.imageUrl || ''
    }));
  }

  // ************************** PRODUITS ************************** //
  @get('/products/{code}', {
    responses: {
      '200': {
        description: 'Product model with isFavorite',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: {type: 'string'},
                name: {type: 'string'},
                nutriscore: {type: 'string'},
                ingredients: {type: 'string'},
                categories: {type: 'string'},
                allergens: {type: 'string'},
                brand: {type: 'string'},
                halalStatus: {type: 'boolean'},
                imageUrl: {type: 'string'},
                isFavorite: {type: 'boolean'}
              }
            }
          }
        }
      }
    }
  })
  async getProduct(
    @param.path.string('code') code: string,
    @param.query.string('uid') uid?: string,
  ): Promise<Product & {isFavorite: boolean}> {
    const product = await this._getProductDetails(code);

    let isFavorite = false;
    if (uid) {
      const count = await this.favoriteRepository.count({
        uid: uid,
        productId: code
      });
      isFavorite = count.count > 0;
    }


    return {
      code: product.code,
      name: product.name,
      nutriscore: product.nutriscore,
      ingredients: product.ingredients,
      categories: product.categories,
      allergens: product.allergens,
      brand: product.brand,
      halalStatus: product.halalStatus,
      imageUrl: product.imageUrl,
      isFavorite
    } as Product & { isFavorite: boolean };
  }
  @get('/products/search/{name}', {
    responses: {
      '200': {
        description: 'Array of Product with isFavorite',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: {type: 'string'},
                  name: {type: 'string'},
                  nutriscore: {type: 'string'},
                  ingredients: {type: 'string'},
                  categories: {type: 'string'},
                  allergens: {type: 'string'},
                  brand: {type: 'string'},
                  halalStatus: {type: 'boolean'},
                  imageUrl: {type: 'string'},
                  isFavorite: {type: 'boolean'}
                }
              }
            }
          }
        }
      }
    }
  })
  async searchProducts(
    @param.path.string('name') name: string,
    @param.query.string('uid') uid?: string,
  ): Promise<(Product & {isFavorite: boolean})[]> {
    const dbResults = await this.productRepository.find({
      where: {name: {regexp: `/${name}/i`}},
      limit: 20
    });

    if (dbResults.length >= 10) {
      return await this._addFavoritesStatus(dbResults, uid);
    }

    const apiResults = await this.fetchFromOpenFoodFacts(name);
    const allResults = [...dbResults, ...apiResults].slice(0, 20);
    return await this._addFavoritesStatus(allResults, uid);
  }

  // ************************** MÉTHODES PRIVÉES ************************** //
  private async _addFavoritesStatus(
    products: Product[],
    uid?: string
  ): Promise<(Product & {isFavorite: boolean})[]> {
    if (!uid) return products.map(p => ({
      ...p,
      isFavorite: false
    }) as Product & { isFavorite: boolean });

    const productIds = products.map(p => p.code);
    const favorites = await this.favoriteRepository.find({
      where: {uid, productId: {inq: productIds}}
    });

    const favProductIds = new Set(favorites.map(f => f.productId));
    return products.map(p => ({
      ...p,
      isFavorite: favProductIds.has(p.code)
    }) as Product & { isFavorite: boolean });
  }

  private async _getProductDetails(code: string): Promise<Product> {
    const existingProduct = await this.productRepository.findOne({where: {code}});
    if (existingProduct) return existingProduct;

    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${code}.json`;

    const response = await axios.get(apiUrl, {
      headers: {'User-Agent': this.USER_AGENT}
    });

    if (response.data.status === 0 || !response.data.product) {
      throw new HttpErrors.NotFound(`Product ${code} not found`);
    }

    const productData = response.data.product;
    const newProduct = new Product({
      code: productData.code,
      name: productData.product_name || "Unknown product",
      nutriscore: productData.nutriscore_grade?.toUpperCase() || "N/A",
      ingredients: this.formatText(productData.ingredients_text),
      brand: this.formatText(productData.brands),
      categories: this.formatText(productData.categories),
      halalStatus: productData.labels?.includes("Halal") || false,
      allergens: this.formatText(productData.allergens),
      imageUrl: productData.image_url || ""
    });

    return this.productRepository.create(newProduct);
  }

  private async fetchFromOpenFoodFacts(name: string): Promise<Product[]> {
    const products: Product[] = [];
    let page = 1;
    const maxPages = 3;
    const pageSize = 10;

    while (page <= maxPages && products.length < 20) {
      try {
        const apiUrl = `https://world.openfoodfacts.net/cgi/search.pl?${new URLSearchParams({
          search_terms: name,
          search_simple: '1',
          action: 'process',
          json: '1',
          page_size: pageSize.toString(),
          page: page.toString()
        })}`;

        const response = await axios.get(apiUrl, {
          headers: {'User-Agent': this.USER_AGENT},
          timeout: 5000
        });

        if (!response.data.products?.length) break;

        for (const apiProduct of response.data.products) {
          if (!apiProduct.product_name) continue;

          const existing = await this.productRepository.findOne({
            where: {code: apiProduct.code}
          });

          if (existing) {
            products.push(existing);
          } else {
            const newProduct = new Product({
              code: apiProduct.code,
              name: apiProduct.product_name,
              nutriscore: apiProduct.nutriscore_grade?.toUpperCase() || "N/A",
              ingredients: this.formatText(apiProduct.ingredients_text),
              brand: this.formatText(apiProduct.brands),
              categories: this.formatText(apiProduct.categories),
              halalStatus: apiProduct.labels?.includes("Halal") || false,
              allergens: this.formatText(apiProduct.allergens),
              imageUrl: apiProduct.image_url || ""
            });

            try {
              await this.productRepository.create(newProduct);
              products.push(newProduct);
            } catch (error) {
              if (error.code !== 11000) console.error('Insert error:', error);
            }
          }

          if (products.length >= 20) break;
        }
        page++;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        break;
      }
    }
    return products;
  }

  private async handleHistoryAction(
    body: {uid: string; product_id: string},
    actionType: 'scan' | 'view'
  ): Promise<History> {
    await this.productRepository.findById(body.product_id);

    const historyEntry = await this.historyRepository.create({
      uid: body.uid,
      product_id: body.product_id,
      actionType,
      timestamp: new Date().toISOString()
    });

    delete (historyEntry as any)._id;
    return historyEntry;
  }

  private formatText(field: any): string {
    if (!field) return "Not available";
    if (typeof field === 'string') return field.trim();
    if (Array.isArray(field)) return field.join(', ').trim();
    if (typeof field === 'object') return Object.values(field).join(', ').trim();
    return "Not available";
  }

  @del('/products/history/uid')
  async deleteHistoryByUid(
    @param.query.string('uid') uid: string,
  ): Promise<{message: string}> {
    if (!uid) throw new HttpErrors.BadRequest('UID required');

    const deleted = await this.historyRepository.deleteAll({uid});
    if (deleted.count === 0) {
      throw new HttpErrors.NotFound('No history found for this UID');
    }

    return {message: 'History deleted successfully'};
  }
}
