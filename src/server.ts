import express, { Application, Request, Response } from 'express';
import { connectDatabase, disconnectDatabase } from './config/database';
import routes from './routes';

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API Kanban - Sistema de Gestão de Quadros',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      boards: '/api/boards',
      columns: '/api/columns',
      cards: '/api/cards',
    },
  });
});

app.use('/api', routes);

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\n Encerrando servidor...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n Encerrando servidor...');
  await disconnectDatabase();
  process.exit(0);
});

startServer();
