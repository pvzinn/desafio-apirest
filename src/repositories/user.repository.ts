import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { User, CreateUserDTO } from '../types/user.types';

export class UserRepository {

  // cria um novo usuário no banco de dados
  async create(data: CreateUserDTO): Promise<User> {
    const id = crypto.randomUUID(); // gera ID único pro usuário
    
    const result = await prisma.$queryRaw<User[]>(
      Prisma.sql`
        INSERT INTO User (id, name, email, phone)
        VALUES (${id}, ${data.name}, ${data.email}, ${data.phone || null})
        RETURNING *
      `
    ); // insere os valores do usuário (número de telefone pode ser nulo)

    if (!result || result.length === 0) {
      throw new Error('Falha ao criar usuário');
    }

    return result[0];
  }

  // busca um usuário pelo ID 
  async findById(id: string): Promise<User | null> {
    const result = await prisma.$queryRaw<User[]>(
      Prisma.sql`
        SELECT * FROM User
        WHERE id = ${id}
        LIMIT 1
      `
    );

    return result.length > 0 ? result[0] : null;
  }

  // busca um usuário pelo email 
  async findByEmail(email: string): Promise<User | null> {
    const result = await prisma.$queryRaw<User[]>(
      Prisma.sql`
        SELECT * FROM User
        WHERE email = ${email}
        LIMIT 1
      `
    );

    return result.length > 0 ? result[0] : null;
  }

  // retorna todos os usuários no sistema 
  async findAll(): Promise<User[]> {
    const result = await prisma.$queryRaw<User[]>(
      Prisma.sql`
        SELECT * FROM User
        ORDER BY name ASC
      `
    ); // ordem alfabética pelo nome

    return result;
  }

  // atualiza as informações de um usuário existente
  async update(id: string, data: Partial<CreateUserDTO>): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push(`name = ?`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push(`email = ?`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = ?`);
      values.push(data.phone);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `UPDATE User SET ${updates.join(', ')} WHERE id = ? RETURNING *`;

    const result = await prisma.$queryRawUnsafe<User[]>(query, ...values);

    return result.length > 0 ? result[0] : null;
  }

  // deleta um usuário pelo ID 
  async delete(id: string): Promise<boolean> {
    const result = await prisma.$executeRaw(
      Prisma.sql`
        DELETE FROM User
        WHERE id = ${id}
      `
    );

    return result > 0; //retorna TRUE se deletou ao menos 1 registro
  }

  // verifica se um usuário existe a partir do ID
  async exists(id: string): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*) as count FROM User
        WHERE id = ${id}
      `
    );

    return Number(result[0].count) > 0;
  }
}
