import express from 'express';
import route from './src/routes/routes';

const app = express();

app.use(express.json());

app.use("/api/v1", route);

app.get('/api/v1/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});