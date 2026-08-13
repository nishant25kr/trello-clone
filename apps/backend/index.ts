import express from 'express';
import userRoutes from './src/routes/userRoutes';
const app = express();

app.use(express.json());

app.use("/api/v1", userRoutes);

app.get('/api/v1/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});