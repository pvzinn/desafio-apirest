export interface Column {
  id: string;
  name: string;
  order: number;
  boardId: string;
}

export interface ColumnWithBoard extends Column {
  boardName: string;
}

export interface CreateColumnDTO {
  name: string;
  boardId: string;
  order?: number;
}

export interface UpdateColumnDTO {
  name?: string;
  order?: number;
}

export interface ReorderColumnDTO {
  order: number;
}
