import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { Board, CreateBoardDTO } from '../types/board.types';

// criação de um novo board 
export class BoardRepository {
  async create(data: CreateBoardDTO): Promise<Board> {
    const id = crypto.randomUUID(); // gera um novo UUID único aleatório para o board
    
    const result = await prisma.$queryRaw<Board[]>(
      Prisma.sql`
        INSERT INTO Board (id, name)
        VALUES (${id}, ${data.name})
        RETURNING * 
      ` //retorna id e nome do board
    );

    if (!result || result.length === 0) {
      throw new Error('Falha ao criar quadro');
    } // valida se a inserção foi concluída com sucesso

    return result[0];
  }

  // busca um board pelo seu ID 
  async findById(id: string): Promise<Board | null> {
    const result = await prisma.$queryRaw<Board[]>(
      Prisma.sql`
        SELECT * FROM Board
        WHERE id = ${id}
        LIMIT 1
      `
    );

    return result.length > 0 ? result[0] : null;
  }

  // busca um board pelo nome 
  async findByName(name: string): Promise<Board | null> {
    const result = await prisma.$queryRaw<Board[]>(
      Prisma.sql`
        SELECT * FROM Board
        WHERE name = ${name}
        LIMIT 1
      `
    );

    return result.length > 0 ? result[0] : null;
  }

  // lista todos os boards em ordem alfabética
  async findAll(): Promise<Board[]> {
    const result = await prisma.$queryRaw<Board[]>(
      Prisma.sql`
        SELECT * FROM Board
        ORDER BY name ASC
      `
    );

    return result;
  }

  // busca um board pelo ID, mas retorna as informações do (board + suas colunas) em um único objeto
  async findWithColumns(id: string): Promise<any | null> {
    const board = await this.findById(id);
    
    if (!board) {
      return null;
    }

    const columns = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT * FROM Column
        WHERE boardId = ${id}
        ORDER BY "order" ASC
      `
    ); // garante a ordenação correta das colunas

    return {
      ...board,
      columns: columns || []
    };
  }

  // atualiza informações de um board (parcialmente)
  async update(id: string, data: Partial<CreateBoardDTO>): Promise<Board | null> {
    const updates: string[] = []; // arrays para armazenar as mudanças e valores originais
    const values: any[] = [];

    if (data.name !== undefined) { // verifica se foi fornecido um novo NAME
      updates.push(`name = ?`);
      values.push(data.name);
    }

    if (updates.length === 0) { // garante que foi fornecido algum campo para atualizar
      return this.findById(id); // caso contrário, retorna o board sem alterações
    }

    values.push(id);

    // pega os itens do array 'updates' e gera a query (valores separados por vírgula)
    const query = `UPDATE Board SET ${updates.join(', ')} WHERE id = ? RETURNING *`;

    // insere os valores da query no array 'values', com a ordem indicada pelos símbolos sql "?"
    const result = await prisma.$queryRawUnsafe<Board[]>(query, ...values);

    // verifica se alguma mudança foi efetivada (array results>0)
    // se sim, retorna o board, caso contrário retorna nulo
    return result.length > 0 ? result[0] : null;
  }

  // deleta um board usando seu ID
  async delete(id: string): Promise<boolean> {
    const result = await prisma.$executeRaw(
      Prisma.sql`
        DELETE FROM Board
        WHERE id = ${id}
      `
    );

    // se ao menos 1 linha foi deletada, retorna TRUE
    return result > 0;
  }

  // verifica se um board exite pelo seu ID
  // mais eficiente do que buscar o registro completo
  async exists(id: string): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*) as count FROM Board
        WHERE id = ${id}
      `
    );
    // retorna valor booleano (existe ou não existe)
    return Number(result[0].count) > 0;
  }

  // retorna o número de colunas de um board, usado para validar se o board pode ser deletado
  async countColumns(boardId: string): Promise<number> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*) as count FROM Column
        WHERE boardId = ${boardId}
      `
    );
    
    return Number(result[0].count);
  }
}
