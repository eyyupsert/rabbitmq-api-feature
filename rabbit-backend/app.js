const express = require('express');
const cors = require('cors');
const rabbitRoutes = require('./routes/rabbitRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// RabbitMQ routes
app.use('/api/rabbit', rabbitRoutes);

// Port
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Rabbit-backend server is running on http://localhost:${PORT}`);
});
