import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { Card, CreateCardDTO, CardWithDetails } from '../types/card.types';

export class CardRepository {

  // cria novo card na coluna especificada
  // se ordem não foi especificada, insere o card ao final da coluna
  async create(data: CreateCardDTO): Promise<Card> {
    const id = crypto.randomUUID();
    
    let order = data.order;
    
    // busca a posição do último valor da coluna
    if (order === undefined) {
      const maxOrderResult = await prisma.$queryRaw<[{ maxOrder: bigint | null }]>(
        Prisma.sql`
          SELECT MAX("order") as maxOrder FROM Card
          WHERE columnId = ${data.columnId}
        `
      );
      
      // extrai o valor
      const maxOrder = maxOrderResult[0].maxOrder;
      // define a ordem a ser inserido o card (1 posição após o último termo) ou posição 0 se maxOrder = null 
      order = (maxOrder !== null ? Number(maxOrder) : -1) + 1;
    }

    const result = await prisma.$queryRaw<Card[]>(
      Prisma.sql`
        INSERT INTO Card (id, title, description, "order", columnId, authorId)
        VALUES (${id}, ${data.title}, ${data.description || null}, ${order}, ${data.columnId}, ${data.authorId})
        RETURNING *
      `
    ); // inserção do card com todos os valores (chaves). "description" pode ser null

    if (!result || result.length === 0) { // valida se a inserção foi bem-sucedida
      throw new Error('Falha ao criar card');
    }

    return result[0];
  }

  // busca um card por ID 
  async findById(id: string): Promise<Card | null> {
    const result = await prisma.$queryRaw<Card[]>(
      Prisma.sql`
        SELECT * FROM Card
        WHERE id = ${id}
        LIMIT 1
      `
    );

    return result.length > 0 ? result[0] : null;
  }

  // busca um card por ID, mas retorna informações também de sua coluna e user 
  async findByIdWithDetails(id: string): Promise<CardWithDetails | null> {
    const result = await prisma.$queryRaw<CardWithDetails[]>(
      Prisma.sql`
        SELECT 
          c.id,
          c.title,
          c.description,
          c."order",
          c.columnId,
          c.authorId,
          col.name as columnName,
          u.name as authorName
        FROM Card c
        INNER JOIN Column col ON c.columnId = col.id
        INNER JOIN User u ON c.authorId = u.id
        WHERE c.id = ${id}
        LIMIT 1
      `
    ); // retorna dados do card + nome da coluna + nome do autor

    return result.length > 0 ? result[0] : null;
  }

  // lista todos os cards do sistema 
  async findAll(): Promise<Card[]> {
    const result = await prisma.$queryRaw<Card[]>(
      Prisma.sql`
        SELECT * FROM Card
        ORDER BY columnId, "order" ASC
      `
    ); // ordenados por coluna e depois por ordem

    return result;
  }


  // lista todos os cards de uma coluna específica, ordenados por posição
  async findByColumnId(columnId: string): Promise<Card[]> {
    const result = await prisma.$queryRaw<Card[]>(
      Prisma.sql`
        SELECT * FROM Card
        WHERE columnId = ${columnId}
        ORDER BY "order" ASC
      `
    );

    return result;
  }

// atualiza título e/ou descrição do card 
  async update(id: string, data: Partial<CreateCardDTO>): Promise<Card | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push(`title = ?`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = ?`);
      values.push(data.description);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    // constrói a query a partir do array 'updates' com as informações fornecidas
    const query = `UPDATE Card SET ${updates.join(', ')} WHERE id = ? RETURNING *`;

    const result = await prisma.$queryRawUnsafe<Card[]>(query, ...values);

    return result.length > 0 ? result[0] : null;
  }

  // deleta um card 
  async delete(id: string): Promise<boolean> {
    const result = await prisma.$executeRaw(
      Prisma.sql`
        DELETE FROM Card
        WHERE id = ${id}
      `
    );

    return result > 0;
  }

  // verifica a existência de um card 
  async exists(id: string): Promise<boolean> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*) as count FROM Card
        WHERE id = ${id}
      `
    );

    return Number(result[0].count) > 0;
  }



  // conta quantos cards existem em uma coluna
  async countByColumnId(columnId: string): Promise<number> {
    const result = await prisma.$queryRaw<[{ count: bigint }]>(
      Prisma.sql`
        SELECT COUNT(*) as count FROM Card
        WHERE columnId = ${columnId}
      `
    );

    return Number(result[0].count);
  }


// busca a última posição em uma coluna (usado para adicionar cards ao final)
  async getMaxOrder(columnId: string): Promise<number> {
    const result = await prisma.$queryRaw<[{ maxOrder: bigint | null }]>(
      Prisma.sql`
        SELECT MAX("order") as maxOrder FROM Card
        WHERE columnId = ${columnId}
      `
    );

    return result[0].maxOrder !== null ? Number(result[0].maxOrder) : -1;
  }


  // move um card entre colunas ou dentro da mesma coluna 
  // parâmetros inseridos:

  // - ID do card a ser movido
  // - ID da nova coluna de destino
  // - nova posição do card (sendo 0 a primeira posição)

  // retorna: card atualizado com nova posição
  async moveCard(cardId: string, newColumnId: string, newOrder: number): Promise<Card> {
    // Inicia uma transação interativa
    return await prisma.$transaction(async (tx) => {
      // 1. Busca o card atual para saber sua posição e coluna de origem
      const currentCardResult = await tx.$queryRaw<Card[]>(
        Prisma.sql`
          SELECT * FROM Card WHERE id = ${cardId}
        `
      );

      if (!currentCardResult || currentCardResult.length === 0) {
        throw new Error('Card não encontrado');
      }

      const currentCard = currentCardResult[0];
      const oldColumnId = currentCard.columnId;
      const oldOrder = currentCard.order;

      // 2. Se está movendo para a mesma coluna
      if (oldColumnId === newColumnId) {
        // 2a. Se a posição não mudou, não faz nada
        if (oldOrder === newOrder) {
          return currentCard;
        }

        // 2b. Movendo para cima (menor ordem)
        if (newOrder < oldOrder) {
          // Incrementa a ordem dos cards entre a nova e a antiga posição
          await tx.$executeRaw(
            Prisma.sql`
              UPDATE Card
              SET "order" = "order" + 1
              WHERE columnId = ${oldColumnId}
                AND "order" >= ${newOrder}
                AND "order" < ${oldOrder}
            `
          );
        }
        // 2c. Movendo para baixo (maior ordem)
        else {
          // Decrementa a ordem dos cards entre a antiga e a nova posição
          await tx.$executeRaw(
            Prisma.sql`
              UPDATE Card
              SET "order" = "order" - 1
              WHERE columnId = ${oldColumnId}
                AND "order" > ${oldOrder}
                AND "order" <= ${newOrder}
            `
          );
        }
      }
      // 3. Se está movendo para outra coluna
      else {
        // 3a. Ajusta os cards que ficaram na coluna de origem
        // Decrementa a ordem dos cards que estavam depois do card movido
        await tx.$executeRaw(
          Prisma.sql`
            UPDATE Card
            SET "order" = "order" - 1
            WHERE columnId = ${oldColumnId}
              AND "order" > ${oldOrder}
          `
        );

        // 3b. Ajusta os cards na coluna de destino
        // Incrementa a ordem dos cards a partir da posição onde o card será inserido
        await tx.$executeRaw(
          Prisma.sql`
            UPDATE Card
            SET "order" = "order" + 1
            WHERE columnId = ${newColumnId}
              AND "order" >= ${newOrder}
          `
        );
      }

      // 4. Atualiza o card com a nova coluna e ordem
      const updatedCardResult = await tx.$queryRaw<Card[]>(
        Prisma.sql`
          UPDATE Card
          SET columnId = ${newColumnId}, "order" = ${newOrder}
          WHERE id = ${cardId}
          RETURNING *
        `
      );

      if (!updatedCardResult || updatedCardResult.length === 0) {
        throw new Error('Falha ao atualizar card');
      }

      return updatedCardResult[0];
    });
    // Se qualquer operação falhar, a transação faz rollback automático
  }


  // reordena cards em uma mesma coluna 
  async reorderInColumn(columnId: string, fromOrder: number, toOrder: number): Promise<void> {
    if (fromOrder < toOrder) {
      // movendo para baixo: decrementa os cards intermediários
      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE Card
          SET "order" = "order" - 1
          WHERE columnId = ${columnId}
            AND "order" > ${fromOrder}
            AND "order" <= ${toOrder}
        `
      );
    } else if (fromOrder > toOrder) {
      // movendo para cima: incrementa os cards intermediários
      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE Card
          SET "order" = "order" + 1
          WHERE columnId = ${columnId}
            AND "order" >= ${toOrder}
            AND "order" < ${fromOrder}
        `
      );
    }
  }
}
