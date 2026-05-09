import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import apiRouter from './routes/api.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use('/api', apiRouter);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor', message: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🚛 Google Cargo API corriendo en http://localhost:${PORT}`);
  console.log(`   GMAPS_API_KEY : ${process.env.GMAPS_API_KEY  ? '✓ configurada' : '✗ NO configurada'}`);
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✓ configurada' : '✗ NO configurada'}\n`);
});
