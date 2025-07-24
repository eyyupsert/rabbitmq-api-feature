const express = require('express');
const cors = require('cors');
const rabbitRoutes = require('./routes/rabbitRoutes');

const app = express();

// CORS ayarları
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// Middleware for logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// RabbitMQ routes
app.use('/api/rabbit', rabbitRoutes);

// Port
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Rabbit-backend server is running on http://localhost:${PORT}`);
});
