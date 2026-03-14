import { Router } from 'express';
import { ColumnController } from '../controllers/column.controller';
import { ColumnService } from '../services/column.service';
import { ColumnRepository } from '../repositories/column.repository';
import { BoardRepository } from '../repositories/board.repository';

const router = Router();

const columnRepository = new ColumnRepository();
const boardRepository = new BoardRepository();
const columnService = new ColumnService(columnRepository, boardRepository);
const columnController = new ColumnController(columnService);

router.post('/', columnController.create);
router.get('/', columnController.getAll);
router.get('/board/:boardId', columnController.getByBoardId);
router.get('/:id', columnController.getById);
router.get('/:id/cards', columnController.getByIdWithCards);
router.put('/:id', columnController.update);
router.patch('/:id/reorder', columnController.reorder);
router.delete('/:id', columnController.delete);

export default router;
