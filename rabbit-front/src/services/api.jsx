import axios from "axios";

export const connectToRabbitMQ = (username, password) => {
    return axios.post("/api/rabbit/connect", { username, password });
};

export const getQueuesByVHost = (username, password, virtualHost) => {
    return axios.post("/api/rabbit/queues", { username, password, virtualHost });
};

export const produceData = (username, password, queueName, virtualHost, messages) => {
    console.log(queueName);
    return axios.post("/api/rabbit/produce", { username, password, queueName, virtualHost, messages });
};

export const consumeData = (username, password, queueName, virtualHost, deleteMessages) => {
    return axios.post("/api/rabbit/consume", { username, password, queueName, virtualHost, deleteMessages });
};
