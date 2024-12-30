import React, { useState } from "react";
import { produceData } from "../services/api";
import {useSelector} from "react-redux";
import {useLocation} from "react-router-dom";

const Produce = () => {
    const [queueName, setQueueName] = useState("");
    const [fileContent, setFileContent] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const location = useLocation();
    const { vhName } = location.state || {};

    const username = useSelector((state) => state.auth.username);
    const password = useSelector((state) => state.auth.password);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFileContent(event.target.result);
            };
            reader.readAsText(file);
        }
    };

    const handleProduce = async () => {
        try {
            console.log(queueName);
            const messages = fileContent.split("\n").map((line) => JSON.parse(line));
            await produceData(username, password, queueName, vhName, messages);
            setSuccess("Mesajlar başarıyla gönderildi!");
        } catch (err) {
            setError("Mesajlar gönderilemedi.");
        }
    };

    return (
        <div className="container mt-5">
            <h1>Produce Sayfası</h1>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <div className="mb-3">
                <label className="form-label">Queue Name</label>
                <input
                    type="text"
                    className="form-control"
                    value={queueName}
                    onChange={(e) => setQueueName(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Dosya Seç</label>
                <input
                    type="file"
                    className="form-control"
                    accept=".txt"
                    onChange={handleFileChange}
                />
            </div>
            <button
                className="btn btn-primary"
                onClick={handleProduce}
                disabled={!fileContent}
            >
                Data Produce Et
            </button>
        </div>
    );
};

export default Produce;
