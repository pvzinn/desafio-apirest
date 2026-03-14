import { ColumnRepository } from '../repositories/column.repository';
import { BoardRepository } from '../repositories/board.repository';
import { Column, CreateColumnDTO, UpdateColumnDTO, ReorderColumnDTO } from '../types/column.types';

export class ColumnService {
  private columnRepository: ColumnRepository;
  private boardRepository: BoardRepository;

  constructor(columnRepository: ColumnRepository, boardRepository: BoardRepository) {
    this.columnRepository = columnRepository;
    this.boardRepository = boardRepository;
  }

  async createColumn(data: CreateColumnDTO): Promise<Column> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nome da coluna é obrigatório');
    }

    if (!data.boardId) {
      throw new Error('ID do quadro é obrigatório');
    }

    const boardExists = await this.boardRepository.exists(data.boardId);
    
    if (!boardExists) {
      throw new Error('Quadro não encontrado');
    }

    if (data.order !== undefined && data.order < 0) {
      throw new Error('Ordem deve ser um número maior ou igual a zero');
    }

    return await this.columnRepository.create(data);
  }

  async getColumnById(id: string): Promise<Column> {
    const column = await this.columnRepository.findById(id);
    
    if (!column) {
      throw new Error('Coluna não encontrada');
    }

    return column;
  }

  async getColumnWithCards(id: string): Promise<any> {
    const column = await this.columnRepository.findWithCards(id);
    
    if (!column) {
      throw new Error('Coluna não encontrada');
    }

    return column;
  }

  async getAllColumns(): Promise<Column[]> {
    return await this.columnRepository.findAll();
  }

  async getColumnsByBoardId(boardId: string): Promise<Column[]> {
    const boardExists = await this.boardRepository.exists(boardId);
    
    if (!boardExists) {
      throw new Error('Quadro não encontrado');
    }

    return await this.columnRepository.findByBoardId(boardId);
  }

  async updateColumn(id: string, data: UpdateColumnDTO): Promise<Column> {
    const columnExists = await this.columnRepository.exists(id);
    
    if (!columnExists) {
      throw new Error('Coluna não encontrada');
    }

    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Nome da coluna não pode ser vazio');
    }

    if (data.order !== undefined && data.order < 0) {
      throw new Error('Ordem deve ser um número maior ou igual a zero');
    }

    const updatedColumn = await this.columnRepository.update(id, data);
    
    if (!updatedColumn) {
      throw new Error('Erro ao atualizar coluna');
    }

    return updatedColumn;
  }

  async reorderColumn(id: string, data: ReorderColumnDTO): Promise<Column> {
    const column = await this.columnRepository.findById(id);
    
    if (!column) {
      throw new Error('Coluna não encontrada');
    }

    if (data.order < 0) {
      throw new Error('Ordem deve ser um número maior ou igual a zero');
    }

    const maxOrder = await this.columnRepository.getMaxOrder(column.boardId);
    
    if (data.order > maxOrder) {
      throw new Error(`Ordem máxima permitida é ${maxOrder}`);
    }

    const currentOrder = column.order;
    const newOrder = data.order;

    if (currentOrder === newOrder) {
      return column;
    }

    await this.columnRepository.reorderColumns(column.boardId, currentOrder, newOrder);

    const updatedColumn = await this.columnRepository.updateOrder(id, newOrder);
    
    if (!updatedColumn) {
      throw new Error('Erro ao reordenar coluna');
    }

    return updatedColumn;
  }

  async deleteColumn(id: string): Promise<void> {
    const columnExists = await this.columnRepository.exists(id);
    
    if (!columnExists) {
      throw new Error('Coluna não encontrada');
    }

    const cardCount = await this.columnRepository.countCards(id);
    
    if (cardCount > 0) {
      throw new Error(`Não é possível deletar a coluna. Existem ${cardCount} card(s) vinculado(s)`);
    }

    const deleted = await this.columnRepository.delete(id);
    
    if (!deleted) {
      throw new Error('Erro ao deletar coluna');
    }
  }
}
