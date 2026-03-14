import { BoardRepository } from '../repositories/board.repository';
import { Board, CreateBoardDTO, UpdateBoardDTO } from '../types/board.types';

export class BoardService {
  private boardRepository: BoardRepository;

  constructor(boardRepository: BoardRepository) {
    this.boardRepository = boardRepository;
  }

  // cria um novo board e realiza validações para garantir sua integridade
  async createBoard(data: CreateBoardDTO): Promise<Board> {
    // garante que um nome foi inserido
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nome do quadro é obrigatório');
    }

    // procura um board já existente com esse nome, pois os nomes devem ser únicos
    const existingBoard = await this.boardRepository.findByName(data.name);
    
    if (existingBoard) {
      throw new Error('Já existe um quadro com este nome');
    }

    return await this.boardRepository.create(data);
  }

  // busca um board pelo ID
  async getBoardById(id: string): Promise<Board> {
    const board = await this.boardRepository.findById(id);
    
    if (!board) { // devolve ERRO se não encontrar
      throw new Error('Quadro não encontrado');
    }

    return board;
  }

  async getBoardWithColumns(id: string): Promise<any> {
    const board = await this.boardRepository.findWithColumns(id);
    
    if (!board) {
      throw new Error('Quadro não encontrado');
    }

    return board;
  }

  async getAllBoards(): Promise<Board[]> {
    return await this.boardRepository.findAll();
  }

  // atualiza as informações de um board
  async updateBoard(id: string, data: UpdateBoardDTO): Promise<Board> {
    // garante que o board existe
    const boardExists = await this.boardRepository.exists(id);
    
    if (!boardExists) {
      throw new Error('Quadro não encontrado');
    }

    if (data.name !== undefined) { // antes de atualizar o nome, 
      if (data.name.trim().length === 0) { // garante que o novo nome não seja vazio
        throw new Error('Nome do quadro não pode ser vazio');
      }
      // garante que não exista um board já existente com o nome desejado
      const existingBoard = await this.boardRepository.findByName(data.name);
      if (existingBoard && existingBoard.id !== id) {
        throw new Error('Já existe um quadro com este nome');
      }
    }

    // atualiza as informações se passou nas validações anteriores
    const updatedBoard = await this.boardRepository.update(id, data);
    
    if (!updatedBoard) {
      throw new Error('Erro ao atualizar quadro');
    }

    return updatedBoard;
  }

  // deleta um board do sistema
  async deleteBoard(id: string): Promise<void> {
    // verifica se o board existe
    const boardExists = await this.boardRepository.exists(id);
    
    if (!boardExists) {
      throw new Error('Quadro não encontrado');
    }

    // verifica o número de colunas do board
    const columnCount = await this.boardRepository.countColumns(id);
    
    if (columnCount > 0) { // não permite deletar o board se ele contiver colunas
      throw new Error(`Não é possível deletar o quadro. Existem ${columnCount} coluna(s) vinculada(s)`);
    }

    const deleted = await this.boardRepository.delete(id);
    
    if (!deleted) {
      throw new Error('Erro ao deletar quadro');
    }
  }
}
