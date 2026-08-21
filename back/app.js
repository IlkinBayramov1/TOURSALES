import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import errorHandler from './middlewares/error.middleware.js';

const app = express();

// Qlobal middleware-lər
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// İctimai şəkillərin paylaşılması üçün statik marşrut (məs. /public/uploads/...)
app.use('/public', express.static('public'));

// Bütün API marşrutları '/api' prefiksi altında birləşir
app.use('/api', routes);

// Qlobal xətaların idarə olunması middleware-i
app.use(errorHandler);

export default app;
