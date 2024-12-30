import React, { useState } from "react";
import { consumeData } from "../services/api";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const Consume = () => {
    const [queueName, setQueueName] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const location = useLocation();
    const { vhName } = location.state || {};

    const username = useSelector((state) => state.auth.username);
    const password = useSelector((state) => state.auth.password);

    const handleConsume = async () => {
        try {
            const response = await consumeData(username, password, queueName, vhName);
            console.log("response:", response.data);
            const messages = response.data.messages;

            if (messages.length === 0) {
                setError("Kuyrukra veri bulunamadı");
                return;
            }

            const blob = new Blob([messages.join("\n")], { type: "text/plain" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "consumedData.txt";
            link.click();
            setSuccess("Kuyruktan veri okuma tamamlandı. Dosyaya(txt) yazdırıldı.");
        } catch (error) {
            setError("Error!");
        }
    };

    return (
        <div className="container mt-5">
            <h1>Consume Sayfası</h1>
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
            <button
                className="btn btn-primary"
                onClick={handleConsume}
                disabled={!queueName}
            >
                Data Consume Et
            </button>
        </div>
    );
};

export default Consume;
