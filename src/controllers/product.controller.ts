import {repository} from '@loopback/repository';
import {get, param} from '@loopback/rest';
import axios from 'axios';
import {Product} from '../models/product.model';
import {ProductRepository} from '../repositories/product.repository';
import {HistoryRepository} from '../repositories/history.repository';
import {History} from '../models/history.model';

export class ProductController {
  constructor(
    @repository(ProductRepository)
    public productRepository: ProductRepository,

    @repository(HistoryRepository)
    public historyRepository: HistoryRepository, // Ajout du repository pour l'historique
  ) {}

  @get('/products/{code}')
  async getProduct(@param.path.string('code') code: string): Promise<Product> {
    // Vérifier si le produit est déjà dans la base MongoDB
    const existingProduct = await this.productRepository.findOne({where: {code}});
    if (existingProduct) {
      console.log("Produit déjà en base :", existingProduct);

      // ✅ Enregistrer dans l'historique
      await this.saveHistory(existingProduct);

      return existingProduct;
    }

    // Si le produit n'est pas en base, le récupérer depuis Open Food Facts
    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${code}.json`;
    try {
      const response = await axios.get(apiUrl);
      const productData = response.data.product;

      if (!productData) {
        console.error("Produit non trouvé sur Open Food Facts");
        throw new Error('Produit non trouvé');
      }

      // Création d'une instance de Product
      const newProduct = new Product({
        code: productData.code,
        name: productData.product_name || "Nom inconnu",
        nutriscore: productData.nutriscore_grade || "n/a",
        ingredients: productData.ingredients_text || "Non disponible",
      });

      console.log("Produit à insérer dans MongoDB :", newProduct);

      // Sauvegarde dans MongoDB
      const savedProduct = await this.productRepository.create(newProduct);
      console.log("Produit sauvegardé :", savedProduct);

      // ✅ Enregistrer dans l'historique
      await this.saveHistory(savedProduct);

      return savedProduct;
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération : ${error.message}`);
      throw new Error(`Erreur lors de la récupération : ${error.message}`);
    }
  }

  // ✅ Fonction pour sauvegarder un produit dans l'historique
  private async saveHistory(product: Product) {
    try {
      const historyEntry = new History({
        barcode: product.code,
        productName: product.name,
        nutriScore: product.nutriscore,
        ingredients: product.ingredients,
      });

      await this.historyRepository.create(historyEntry);
      console.log("✅ Produit ajouté à l'historique :", historyEntry);
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement de l'historique :", error);
    }
  }
}
