import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { Column, CreateColumnDTO, ColumnWithBoard } from '../types/column.types';

export class ColumnRepository {
  async create(data: CreateColumnDTO): Promise<Column> {
    const id = crypto.randomUUID();
    
    let order = data.order;
    
    if (order === undefined) {
      const maxOrderResult = await prisma.$queryRaw<[{ maxOrder: bigint | null }]>(
        Prisma.sql`
          SELECT MAX("order") as maxOrder FROM Column
          WHERE boardId = ${data.boardId}
        `
      );
      
      const maxOrder = maxOrderResult[0].maxOrder;
      order = (maxOrder !== null ? Number(maxOrder) : -1) + 1;
    }

    const result = await prisma.$queryRaw<Column[]>(
      Prisma.sql`
        INSERT INTO Column (id, name, "order", boardId)
        VALUES (${id}, ${data.name}, ${order}, ${data.boardId})
        RETURNING *
      `
    );

    if (!result || result.length === 0) {
      throw new Error('Falha ao criar coluna');
    }

    return result[0];
  }

  async findById(id: string): Promise<Column | null> {
    const result = await prisma.$queryRaw<Column[]>(
      Prisma.sql`
        SELECT * FROM Column
        WHERE id = ${id}
        LIMIT 1
      `
    );

    return result.length > 0 ? result[0] : null;
  }

  async findByIdWithBoard(id: string): Promise<ColumnWithBoard | null> {
    const result = await prisma.$queryRaw<ColumnWithBoard[]>(
      Prisma.sql`
        SELECT 
          c.id,
          c.name,
          c."order",
          c.boardId,
          b.name as boardName
        FROM Column c
        INNER JOIN Board b ON c.boardId = b.id
        WHERE c.id = ${id}
        LIMIT 1
      `
    );

    return result.length > 0 ? result[0] : null;
  }

  async findAll(): Promise<Column[]> {
    const result = await prisma.$queryRaw<Column[]>(
      Prisma.sql`
        SELECT * FROM Column
        ORDER BY boardId, "order" ASC
      `
    );

    return result;
  }

  async findByBoardId(boardId: string): Promise<Column[]> {
    const result = await prisma.$queryRaw<Column[]>(
      Prisma.sql`
        SELECT * FROM Column
        WHERE boardId = ${boardId}
        ORDER BY "order" ASC
      `
    );

    return result;
  }

  async findWithCards(id: string): Promise<any | null> {
    const column = await this.findById(id);
    
    if (!column) {
      return null;
    }

    const cards = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT * FROM Card
        WHERE columnId = ${id}
        ORDER BY "order" ASC
      `
    );

    return {
      ...column,
      cards: cards || []
    };
  }

  async update(id: string, data: Partial<CreateColumnDTO>): Promise<Column | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push(`name = ?`);
      values.push(data.name);
    }
    if (data.order !== undefined) {
      updates.push(`"order" = ?`);
      values.push(data.order);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `UPDATE Column SET ${updates.join(', ')} WHERE id = ? RETURNING *`;

    const result = await prisma.$queryRawUnsafe<Column[]>(query, ...values);

    return result.length > 0 ? result[0] : null;
  }

  async updateOrder(id: string, newOrder: number): Promise<Column | null> {
    const result = await prisma.$queryRaw<Column[]>(
      Prisma.sql`
        UPDATE Column
        SET "order" = ${newOrder}
        WHERE id = ${id}
        RETURNING *
      `
    );

    return result.length > 0 ? result[0] : null;
  }

  async reorderColumns(boardId: string, fromOrder: number, toOrder: number): Promise<void> {
    if (fromOrder < toOrder) {
      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE Column
          SET "order" = "order" - 1
          WHERE boardId = ${boardId}
            AND "order" > ${fromOrder}
            AND "order" <= ${toOrder}
        `
      );
    } else if (fromOrder > toOrder) {
      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE Column
          SET "order" = "order" + 1
          WHERE boardId = ${boardId}
            AND "order" >= ${toOrder}
            AND "order" < ${fromOrder}
        `
      );
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await prisma.$executeRaw(
      Prisma.sql`
        DELETE FROM Column
        WHERE id = ${id}
      `
    );

    return result > 0;
  }

  async exists(id: string): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*) as count FROM Column
        WHERE id = ${id}
      `
    );

    return Number(result[0].count) > 0;
  }

  async existsInBoard(id: string, boardId: string): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*) as count FROM Column
        WHERE id = ${id} AND boardId = ${boardId}
      `
    );

    return Number(result[0].count) > 0;
  }

  async countCards(columnId: string): Promise<number> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*) as count FROM Card
        WHERE columnId = ${columnId}
      `
    );

    return Number(result[0].count);
  }

  async getMaxOrder(boardId: string): Promise<number> {
    const result = await prisma.$queryRaw<[{ maxOrder: bigint | null }]>(
      Prisma.sql`
        SELECT MAX("order") as maxOrder FROM Column
        WHERE boardId = ${boardId}
      `
    );

    return result[0].maxOrder !== null ? Number(result[0].maxOrder) : -1;
  }
}
