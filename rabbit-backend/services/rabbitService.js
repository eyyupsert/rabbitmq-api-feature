const amqplib = require('amqplib');
const { RABBITMQ_URL,  RABBITMQ_FRONTEND_URL } = require('../config/rabbitConfig');
const axios = require('axios');

function getRabbitConnectionUri(username, password, virtualHost = null) {
    console.log("vh", virtualHost);
    if (virtualHost != null) {
        return  `amqp://${username}:${password}@${RABBITMQ_URL}/${encodeURIComponent(virtualHost)}`;
    } else {
        return  `amqp://${username}:${password}@${RABBITMQ_URL}`;
    }
}

async function getVhostNames(username, password) {
    try {
        const response = await axios.get(RABBITMQ_FRONTEND_URL + '/api/vhosts', {
            headers: { Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64') }
        });

        return response.data.map((vhost) => vhost.name);
    } catch (error) {
        console.error('Error fetching vhosts:', error.message);
        throw error;
    }
}

async function getQueuesByVHost(username, password, virtualHost) {
    try {
        console.log(`Fetching queues for vhost: ${virtualHost}`);
        console.log(`API URL: ${RABBITMQ_FRONTEND_URL}/api/queues/${encodeURIComponent(virtualHost)}`);
        
        const response = await axios.get(RABBITMQ_FRONTEND_URL + `/api/queues/${encodeURIComponent(virtualHost)}`, {
            headers: { Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64') }
        });

        console.log(`Queues API response status: ${response.status}`);
        console.log(`Queues data:`, response.data);

        return response.data.map((queue) => queue.name);
    } catch (error) {
        console.error('Error fetching queues:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

async function getQueueWithVHostName(username, password) {
    try {
        const response = await axios.get(RABBITMQ_FRONTEND_URL + '/api/vhosts', {
            headers: { Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64') }
        });

        return response.data.map((vhost) => vhost.name);
    } catch (error) {
        console.error('Error fetching vhosts:', error.message);
        throw error;
    }
}

async function connectToRabbitMQ(username, password) {
    let connection;
    try {
        connection = await amqplib.connect(getRabbitConnectionUri(username, password));
        console.log('RabbitMQ connection successful.');

        const vhostNames = await getVhostNames(username, password);

        await connection.close();
        console.log('RabbitMQ connection closed.');

        return vhostNames;
    } catch (err) {
        console.error('RabbitMQ Connection Error:', err.message);

        if (connection) {
            await connection.close();
            console.log('RabbitMQ connection closed after error.');
        }

        throw new Error('Failed to establish a connection to RabbitMQ.');
    }
}


async function connectToRabbitMqWithVirtualHost(environment, username, password, virtualHost) {
    try {
        const connection = await amqplib.connect(getRabbitConnectionUri(username, password, virtualHost));

        console.log(`Connected to RabbitMQ on virtual host: "${virtualHost}"`);

        return await connection;
    } catch (err) {
        console.error('RabbitMQ Connection Error:', err.message);
        throw new Error(`Failed to connect to RabbitMQ: ${err.message}`);
    }
}

async function publishToQueue(environment, username, password, queueName, virtualHost, messages) {
    const connection = await connectToRabbitMqWithVirtualHost(environment, username, password, virtualHost);

    if (!connection) throw new Error('RabbitMQ is not connected');

    const ch = await connection.createConfirmChannel();

    await ch.checkQueue(queueName);

    try {
        for (const message of messages) {
            const jsonMessage = JSON.stringify(message);

            await new Promise((resolve, reject) => {
                ch.sendToQueue(queueName, Buffer.from(jsonMessage), { contentType: 'application/json' }, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            console.log(`Message sent to queue "${queueName}":`, jsonMessage);
        }

        console.log(`All messages sent to queue "${queueName}".`);
    } catch (error) {
        console.error(`Failed to send messages to queue "${queueName}":`, error);
    } finally {
        await connection.close();
        console.log('RabbitMQ connection closed.');
    }
}


async function consumeFromQueue(environment, username, password, queueName, virtualHost, deleteMessages = false) {
    const connection = await connectToRabbitMqWithVirtualHost(environment, username, password, virtualHost);
    const ch = await connection.createChannel();

    if (!ch) throw new Error('RabbitMQ is not connected');
    await ch.checkQueue(queueName);

    const messages = [];

    try {
        // Kuyruk bilgilerini al
        const queueInfo = await ch.assertQueue(queueName, { durable: true });
        const messageCount = queueInfo.messageCount;
        console.log(`Queue "${queueName}" has ${messageCount} messages`);

        // Mesajları oku
        for (let i = 0; i < messageCount; i++) {
            const msg = await ch.get(queueName, { noAck: false });
            
            if (!msg) break;

            try {
                // Mesajı string olarak al
                const messageContent = msg.content.toString();
                console.log(`Raw message from queue "${queueName}" (${i + 1}/${messageCount}):`, messageContent);
                
                // Mesajı JSON olarak parse etmeyi dene
                try {
                    const jsonMessage = JSON.parse(messageContent);
                    console.log(`Parsed JSON message:`, jsonMessage);
                    // JSON olarak parse edilebiliyorsa, string formatında ekle
                    messages.push(messageContent);
                } catch (parseError) {
                    // JSON olarak parse edilemiyorsa, ham haliyle ekle
                    console.log(`Message is not valid JSON, using raw content`);
                    messages.push(messageContent);
                }
            } catch (messageError) {
                console.error(`Error processing message:`, messageError);
                // Hata durumunda da mesajı ekle
                messages.push(msg.content.toString());
            }
            
            // deleteMessages true ise mesajı kuyruktan sil
            if (deleteMessages) {
                ch.ack(msg);
                console.log(`Message acknowledged and removed from queue "${queueName}"`);
            }
        }

        await connection.close();
        console.log(`Returning ${messages.length} messages from queue "${queueName}"`);
        return messages;
    } catch (error) {
        console.error("Error while consuming messages:", error.message);
        await connection.close();
        throw error;
    }
}

module.exports = {
    connectToRabbitMQ,
    publishToQueue,
    consumeFromQueue,
    getQueuesByVHost,
};
