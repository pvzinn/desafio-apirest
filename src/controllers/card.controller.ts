import { Request, Response } from 'express';
import { CardService } from '../services/card.service';
import { CreateCardDTO, UpdateCardDTO, MoveCardDTO } from '../types/card.types';

export class CardController {
  private cardService: CardService;

  constructor(cardService: CardService) {
    this.cardService = cardService;
  }

  /**
   * Cria um novo card
   * POST /api/cards
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const cardData: CreateCardDTO = req.body;

      const card = await this.cardService.createCard(cardData);

      res.status(201).json({
        success: true,
        data: card,
        message: 'Card criado com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar card';
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  /**
   * Busca um card por ID
   * GET /api/cards/:id
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const card = await this.cardService.getCardById(id);

      res.status(200).json({
        success: true,
        data: card,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar card';
      res.status(404).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  /**
   * Busca um card por ID com informações detalhadas
   * GET /api/cards/:id/details
   */
  getByIdWithDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const card = await this.cardService.getCardWithDetails(id);

      res.status(200).json({
        success: true,
        data: card,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar card';
      res.status(404).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  /**
   * Lista todos os cards
   * GET /api/cards
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const cards = await this.cardService.getAllCards();

      res.status(200).json({
        success: true,
        data: cards,
        count: cards.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar cards';
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  /**
   * Lista todos os cards de uma coluna
   * GET /api/cards/column/:columnId
   */
  getByColumnId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { columnId } = req.params;

      const cards = await this.cardService.getCardsByColumnId(columnId);

      res.status(200).json({
        success: true,
        data: cards,
        count: cards.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar cards';
      const statusCode = errorMessage.includes('não encontrada') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  /**
   * Atualiza um card (título e/ou descrição)
   * PUT /api/cards/:id
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const cardData: UpdateCardDTO = req.body;

      const card = await this.cardService.updateCard(id, cardData);

      res.status(200).json({
        success: true,
        data: card,
        message: 'Card atualizado com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar card';
      const statusCode = errorMessage.includes('não encontrado') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  /**
   * ENDPOINT CRÍTICO: Move um card entre colunas ou reordena dentro da mesma coluna
   * PATCH /api/cards/:id/move
   * 
   * Body esperado:
   * {
   *   "columnId": "uuid-da-coluna-destino",
   *   "order": 2
   * }
   * 
   * Este endpoint implementa a funcionalidade principal do Kanban:
   * - Arrastar e soltar cards entre colunas
   * - Reordenar cards dentro da mesma coluna
   * - Atualiza automaticamente a ordem de todos os cards afetados
   * - Usa transações SQL para garantir consistência
   */
  move = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const moveData: MoveCardDTO = req.body;

      // Executa a movimentação com todas as validações e transações
      const card = await this.cardService.moveCard(id, moveData);

      res.status(200).json({
        success: true,
        data: card,
        message: 'Card movido com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao mover card';
      
      // Determina o status code apropriado baseado no erro
      let statusCode = 400;
      if (errorMessage.includes('não encontrado') || errorMessage.includes('não encontrada')) {
        statusCode = 404;
      }
      
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  /**
   * Deleta um card
   * DELETE /api/cards/:id
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.cardService.deleteCard(id);

      res.status(200).json({
        success: true,
        message: 'Card deletado com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar card';
      const statusCode = errorMessage.includes('não encontrado') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  };
}
