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


async function consumeFromQueue(environment, username, password, queueName, virtualHost) {
    const connection = await connectToRabbitMqWithVirtualHost(environment, username, password, virtualHost);
    const ch = await connection.createChannel();

    if (!ch) throw new Error('RabbitMQ is not connected');
    await ch.checkQueue(queueName);

    const messages = [];

    try {
        while (true) {
            const msg = await ch.get(queueName, { noAck: false });

            if (!msg) break;

            const message = msg.content.toString();
            messages.push(message);
            ch.ack(msg);
            console.log(`Message received from queue "${queueName}":`, message);
        }

        await connection.close();
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
};
