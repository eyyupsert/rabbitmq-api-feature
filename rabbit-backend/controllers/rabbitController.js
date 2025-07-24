const { connectToRabbitMQ, publishToQueue, consumeFromQueue, getQueuesByVHost } = require('../services/rabbitService');

async function connect(req, res) {
    try {
        const resp = await connectToRabbitMQ(req.body.username, req.body.password);
        res.status(200).json({ message: 'RabbitMQ connection successful', response: resp });
    } catch (err) {
        res.status(500).json({ error: 'Failed to connect to RabbitMQ' });
    }
}

async function getQueues(req, res) {
    try {
        const { username, password, virtualHost } = req.body;
        console.log("getQueues request:", { username, virtualHost });
        
        if (!virtualHost) {
            return res.status(400).json({ error: 'virtualHost is required' });
        }
        
        const queues = await getQueuesByVHost(username, password, virtualHost);
        console.log("Queues fetched successfully:", queues);
        res.status(200).json({ queues });
    } catch (err) {
        console.error("Error fetching queues:", err);
        res.status(500).json({ error: `Failed to fetch queues: ${err.message}` });
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
    const { username, password, queueName, virtualHost, deleteMessages } = req.body;
    if (!queueName || !virtualHost) {
        return res.status(400).json({ error: 'queueName and virtualHost are required' });
    }

    try {
        console.log("Consumed messages request:", { 
            queueName, 
            virtualHost, 
            deleteMessages: deleteMessages === true || deleteMessages === "true" ? "true" : "false" 
        });
        
        // deleteMessages parametresini boolean'a çevir
        const shouldDeleteMessages = deleteMessages === true || deleteMessages === "true";
        
        const messages = await consumeFromQueue("queueName", username, password, queueName, virtualHost, shouldDeleteMessages);
        console.log(`Consumed ${messages.length} messages from queue "${queueName}"`);
        res.status(200).json({ messages });
    } catch (err) {
        console.error("Error consuming messages:", err);
        res.status(500).json({ error: `Failed to consume messages: ${err.message}` });
    }
}

module.exports = {
    connect,
    produce,
    consume,
    getQueues,
};
