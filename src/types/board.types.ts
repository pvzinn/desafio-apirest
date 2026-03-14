export interface Board {
  id: string;
  name: string;
}

export interface CreateBoardDTO {
  name: string;
}

export interface UpdateBoardDTO {
  name?: string;
}
