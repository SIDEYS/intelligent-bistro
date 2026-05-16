import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import menuRouter from './routes/menu';
import chatRouter from './routes/chat';
import ordersRouter from './routes/orders';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/menu', menuRouter);
app.use('/chat', chatRouter);
app.use('/orders', ordersRouter);

app.listen(PORT, () => {
  console.log(`[bistro-api] listening on http://localhost:${PORT}`);
});

export { app };
