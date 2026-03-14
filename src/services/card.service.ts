import { CardRepository } from '../repositories/card.repository';
import { ColumnRepository } from '../repositories/column.repository';
import { UserRepository } from '../repositories/user.repository';
import { Card, CreateCardDTO, UpdateCardDTO, MoveCardDTO } from '../types/card.types';

export class CardService {
  private cardRepository: CardRepository;
  private columnRepository: ColumnRepository;
  private userRepository: UserRepository;

  constructor(
    cardRepository: CardRepository,
    columnRepository: ColumnRepository,
    userRepository: UserRepository
  ) {
    this.cardRepository = cardRepository;
    this.columnRepository = columnRepository;
    this.userRepository = userRepository;
  }


  // cria um novo card com validações de negócio
  async createCard(data: CreateCardDTO): Promise<Card> {
    // validação: título é obrigatório
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Título do card é obrigatório');
    }

    // validação: coluna deve existir
    if (!data.columnId) {
      throw new Error('ID da coluna é obrigatório');
    }

    const columnExists = await this.columnRepository.exists(data.columnId);
    if (!columnExists) {
      throw new Error('Coluna não encontrada');
    }

    // validação: autor deve existir
    if (!data.authorId) {
      throw new Error('ID do autor é obrigatório');
    }

    const userExists = await this.userRepository.exists(data.authorId);
    if (!userExists) {
      throw new Error('Usuário não encontrado');
    }

    // validação: ordem deve ser não-negativa se fornecida
    if (data.order !== undefined && data.order < 0) {
      throw new Error('Ordem deve ser um número maior ou igual a zero');
    }

    return await this.cardRepository.create(data);
  }


  // busca um card por ID
  async getCardById(id: string): Promise<Card> {
    const card = await this.cardRepository.findById(id);
    
    if (!card) {
      throw new Error('Card não encontrado');
    }

    return card;
  }


  // busca um card com informações detalhadas (coluna e autor)
  async getCardWithDetails(id: string): Promise<any> {
    const card = await this.cardRepository.findByIdWithDetails(id);
    
    if (!card) {
      throw new Error('Card não encontrado');
    }

    return card;
  }


  // lista todos os cards do sistema
  async getAllCards(): Promise<Card[]> {
    return await this.cardRepository.findAll();
  }


  // lista todos os cards de uma coluna específica
  async getCardsByColumnId(columnId: string): Promise<Card[]> {
    // valida se a coluna existe
    const columnExists = await this.columnRepository.exists(columnId);
    if (!columnExists) {
      throw new Error('Coluna não encontrada');
    }

    return await this.cardRepository.findByColumnId(columnId);
  }


// atualiza título e/ou descrição de um card
  async updateCard(id: string, data: UpdateCardDTO): Promise<Card> {
    // verifica se o card existe
    const cardExists = await this.cardRepository.exists(id);
    if (!cardExists) {
      throw new Error('Card não encontrado');
    }

    // valida título se fornecido
    if (data.title !== undefined && data.title.trim().length === 0) {
      throw new Error('Título do card não pode ser vazio');
    }

    const updatedCard = await this.cardRepository.update(id, data);
    
    if (!updatedCard) {
      throw new Error('Erro ao atualizar card');
    }

    return updatedCard;
  }


  // move um card entre colunas ou reordena dentro da mesma coluna
  async moveCard(id: string, data: MoveCardDTO): Promise<Card> {
    // validação: card deve existir
    const card = await this.cardRepository.findById(id);
    if (!card) {
      throw new Error('Card não encontrado');
    }

    // validação: coluna de destino deve existir
    const columnExists = await this.columnRepository.exists(data.columnId);
    if (!columnExists) {
      throw new Error('Coluna de destino não encontrada');
    }

    // validação: ordem deve ser não-negativa
    if (data.order < 0) {
      throw new Error('Ordem deve ser um número maior ou igual a zero');
    }

    // validação: ordem não pode ser maior que o número de cards na coluna de destino
    const maxOrder = await this.cardRepository.getMaxOrder(data.columnId);
    
    // se está movendo para a mesma coluna
    if (card.columnId === data.columnId) {
      // a ordem máxima permitida é a ordem atual máxima (não muda o número de cards)
      if (data.order > maxOrder) {
        throw new Error(`Ordem máxima permitida é ${maxOrder}`);
      }
    } else {
      // se está movendo para outra coluna
      // a ordem máxima permitida é maxOrder + 1 (o card será adicionado)
      if (data.order > maxOrder + 1) {
        throw new Error(`Ordem máxima permitida na coluna de destino é ${maxOrder + 1}`);
      }
    }

    // executa a movimentação com transação SQL
    try {
      const movedCard = await this.cardRepository.moveCard(id, data.columnId, data.order);
      return movedCard;
    } catch (error) {
      // se a transação falhar, devolve ERRO
      if (error instanceof Error) {
        throw new Error(`Erro ao mover card: ${error.message}`);
      }
      throw new Error('Erro ao mover card');
    }
  }


  // deleta um card pelo ID e reordena os restantes
  async deleteCard(id: string): Promise<void> {
    // verifica se o card existe e busca suas informações
    const card = await this.cardRepository.findById(id);
    if (!card) {
      throw new Error('Card não encontrado');
    }

    // deleta o card
    const deleted = await this.cardRepository.delete(id);
    if (!deleted) {
      throw new Error('Erro ao deletar card');
    }

    // reordena os cards que ficaram na coluna
    // recrementa a ordem de todos os cards que vinham depois do deletado
    await this.cardRepository.reorderInColumn(
      card.columnId,
      card.order,
      await this.cardRepository.getMaxOrder(card.columnId) + 1
    );
  }
}
