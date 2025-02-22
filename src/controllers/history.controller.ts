import {repository} from '@loopback/repository';
import {HistoryRepository} from '../repositories/history.repository';
import {get, post, requestBody, param} from '@loopback/rest';
import {History} from '../models/history.model';

export class HistoryController {
  constructor(
    @repository(HistoryRepository)
    public historyRepository: HistoryRepository,
  ) {}

  // ✅ Route pour récupérer l'historique de recherche
  @get('/history')
  async getHistory(): Promise<History[]> {
    return this.historyRepository.find({
      order: ['createdAt DESC'], // Trier par date décroissante
    });
  }

  // ✅ Route pour sauvegarder un produit recherché dans l'historique
  @post('/history')
  async saveHistory(@requestBody() history: History): Promise<History> {
    return this.historyRepository.create(history);
  }
}
