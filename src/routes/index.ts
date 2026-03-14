import { Router } from 'express';
import userRoutes from './user.routes';
import boardRoutes from './board.routes';
import columnRoutes from './column.routes';
import cardRoutes from './card.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/boards', boardRoutes);
router.use('/columns', columnRoutes);
router.use('/cards', cardRoutes);

export default router;
