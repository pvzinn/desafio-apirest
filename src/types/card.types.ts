export interface Card {
  id: string;
  title: string;
  description: string | null;
  order: number;
  columnId: string;
  authorId: string;
}

export interface CardWithDetails extends Card {
  columnName: string;
  authorName: string;
}

export interface CreateCardDTO {
  title: string;
  description?: string;
  columnId: string;
  authorId: string;
  order?: number;
}

export interface UpdateCardDTO {
  title?: string;
  description?: string;
}

export interface MoveCardDTO {
  columnId: string;
  order: number;
}
