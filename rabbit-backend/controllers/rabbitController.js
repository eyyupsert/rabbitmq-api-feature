const { connectToRabbitMQ, publishToQueue, consumeFromQueue } = require('../services/rabbitService');

async function connect(req, res) {
    try {
        const resp = await connectToRabbitMQ(req.body.username, req.body.password);
        console.log("test-resp", req.body);

        await connectToRabbitMQ(req.body.username, req.body.password);
        res.status(200).json({ message: 'RabbitMQ connection successful', response: resp });
    } catch (err) {
        res.status(500).json({ error: 'Failed to connect to RabbitMQ' });
    }
}

async function produce(req, res) {
    console.log("test-produce", req.body);

    const { username, password, queueName, virtualHost, messages} = req.body;

    if (!queueName || !virtualHost || !messages) {
        return res.status(400).json({ error: 'queueName and message are required' });
    }

    try {
        await publishToQueue("", username, password, queueName, virtualHost , messages);
        res.status(200).json({ message: 'Message sent successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send message' });
    }
}

async function consume(req, res) {
    const { username, password, queueName, virtualHost } = req.body;
    if (!queueName || !virtualHost) {
        return res.status(400).json({ error: 'queueName and virtualHost are required' });
    }

    try {
        console.log("Consumed messages 1");
        const messages = await consumeFromQueue("queueName", username, password, queueName, virtualHost);
        console.log("Consumed messages:", messages);
        res.status(200).json({ messages });
    } catch (err) {
        console.error("Error consuming messages:", err.message);
        res.status(500).json({ error: 'Failed to consume messages' });
    }
}

module.exports = {
    connect,
    produce,
    consume,
};
