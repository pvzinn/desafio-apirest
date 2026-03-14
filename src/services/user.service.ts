import { UserRepository } from '../repositories/user.repository';
import { User, CreateUserDTO, UpdateUserDTO } from '../types/user.types';

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    
    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nome é obrigatório');
    }

    if (!this.isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }

    return await this.userRepository.create(data);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    const userExists = await this.userRepository.exists(id);
    
    if (!userExists) {
      throw new Error('Usuário não encontrado');
    }

    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email já está em uso por outro usuário');
      }

      if (!this.isValidEmail(data.email)) {
        throw new Error('Email inválido');
      }
    }

    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Nome não pode ser vazio');
    }

    const updatedUser = await this.userRepository.update(id, data);
    
    if (!updatedUser) {
      throw new Error('Erro ao atualizar usuário');
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const userExists = await this.userRepository.exists(id);
    
    if (!userExists) {
      throw new Error('Usuário não encontrado');
    }

    const deleted = await this.userRepository.delete(id);
    
    if (!deleted) {
      throw new Error('Erro ao deletar usuário');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
