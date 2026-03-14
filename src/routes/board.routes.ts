import { Router } from 'express';
import { BoardController } from '../controllers/board.controller';
import { BoardService } from '../services/board.service';
import { BoardRepository } from '../repositories/board.repository';

const router = Router();

const boardRepository = new BoardRepository();
const boardService = new BoardService(boardRepository);
const boardController = new BoardController(boardService);

router.post('/', boardController.create);
router.get('/', boardController.getAll);
router.get('/:id', boardController.getById);
router.get('/:id/columns', boardController.getByIdWithColumns);
router.put('/:id', boardController.update);
router.delete('/:id', boardController.delete);

export default router;
