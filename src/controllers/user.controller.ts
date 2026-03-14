import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { CreateUserDTO, UpdateUserDTO } from '../types/user.types';

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: CreateUserDTO = req.body;

      const user = await this.userService.createUser(userData);

      res.status(201).json({
        success: true,
        data: user,
        message: 'Usuário criado com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar usuário';
      res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await this.userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar usuário';
      res.status(404).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();

      res.status(200).json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar usuários';
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userData: UpdateUserDTO = req.body;

      const user = await this.userService.updateUser(id, userData);

      res.status(200).json({
        success: true,
        data: user,
        message: 'Usuário atualizado com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar usuário';
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

      await this.userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'Usuário deletado com sucesso',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar usuário';
      const statusCode = errorMessage.includes('não encontrado') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  };
}
