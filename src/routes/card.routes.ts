import { Router } from 'express';
import { CardController } from '../controllers/card.controller';
import { CardService } from '../services/card.service';
import { CardRepository } from '../repositories/card.repository';
import { ColumnRepository } from '../repositories/column.repository';
import { UserRepository } from '../repositories/user.repository';

const router = Router();

// injeção de dependências
const cardRepository = new CardRepository();
const columnRepository = new ColumnRepository();
const userRepository = new UserRepository();
const cardService = new CardService(cardRepository, columnRepository, userRepository);
const cardController = new CardController(cardService);

// rotas CRUD básicas
router.post('/', cardController.create);
router.get('/', cardController.getAll);
router.get('/column/:columnId', cardController.getByColumnId);
router.get('/:id', cardController.getById);
router.get('/:id/details', cardController.getByIdWithDetails);
router.put('/:id', cardController.update);
router.delete('/:id', cardController.delete);

// rota importante: movimentação de cards
router.patch('/:id/move', cardController.move);

export default router;
