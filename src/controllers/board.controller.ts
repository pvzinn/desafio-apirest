import { Request, Response } from 'express';
import { BoardService } from '../services/board.service';
import { CreateBoardDTO, UpdateBoardDTO } from '../types/board.types';

export class BoardController {
  private boardService: BoardService;

  constructor(boardService: BoardService) {
    this.boardService = boardService;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const boardData: CreateBoardDTO = req.body;

      const board = await this.boardService.createBoard(boardData);

      res.status(201).json({
        success: true,
        data: board,
        message: 'Quadro criado com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar quadro';
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const board = await this.boardService.getBoardById(id);

      res.status(200).json({
        success: true,
        data: board,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar quadro';
      res.status(404).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  getByIdWithColumns = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const board = await this.boardService.getBoardWithColumns(id);

      res.status(200).json({
        success: true,
        data: board,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar quadro';
      res.status(404).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const boards = await this.boardService.getAllBoards();

      res.status(200).json({
        success: true,
        data: boards,
        count: boards.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar quadros';
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const boardData: UpdateBoardDTO = req.body;

      const board = await this.boardService.updateBoard(id, boardData);

      res.status(200).json({
        success: true,
        data: board,
        message: 'Quadro atualizado com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar quadro';
      const statusCode = errorMessage.includes('não encontrado') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.boardService.deleteBoard(id);

      res.status(200).json({
        success: true,
        message: 'Quadro deletado com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar quadro';
      const statusCode = errorMessage.includes('não encontrado') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  };
}
