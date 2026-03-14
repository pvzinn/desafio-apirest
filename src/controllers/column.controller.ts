import { Request, Response } from 'express';
import { ColumnService } from '../services/column.service';
import { CreateColumnDTO, UpdateColumnDTO, ReorderColumnDTO } from '../types/column.types';

export class ColumnController {
  private columnService: ColumnService;

  constructor(columnService: ColumnService) {
    this.columnService = columnService;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const columnData: CreateColumnDTO = req.body;

      const column = await this.columnService.createColumn(columnData);

      res.status(201).json({
        success: true,
        data: column,
        message: 'Coluna criada com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar coluna';
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const column = await this.columnService.getColumnById(id);

      res.status(200).json({
        success: true,
        data: column,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar coluna';
      res.status(404).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  getByIdWithCards = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const column = await this.columnService.getColumnWithCards(id);

      res.status(200).json({
        success: true,
        data: column,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar coluna';
      res.status(404).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const columns = await this.columnService.getAllColumns();

      res.status(200).json({
        success: true,
        data: columns,
        count: columns.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar colunas';
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  getByBoardId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { boardId } = req.params;

      const columns = await this.columnService.getColumnsByBoardId(boardId);

      res.status(200).json({
        success: true,
        data: columns,
        count: columns.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar colunas';
      const statusCode = errorMessage.includes('não encontrado') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const columnData: UpdateColumnDTO = req.body;

      const column = await this.columnService.updateColumn(id, columnData);

      res.status(200).json({
        success: true,
        data: column,
        message: 'Coluna atualizada com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar coluna';
      const statusCode = errorMessage.includes('não encontrada') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  reorder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const reorderData: ReorderColumnDTO = req.body;

      const column = await this.columnService.reorderColumn(id, reorderData);

      res.status(200).json({
        success: true,
        data: column,
        message: 'Coluna reordenada com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao reordenar coluna';
      const statusCode = errorMessage.includes('não encontrada') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.columnService.deleteColumn(id);

      res.status(200).json({
        success: true,
        message: 'Coluna deletada com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar coluna';
      const statusCode = errorMessage.includes('não encontrada') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  };
}
