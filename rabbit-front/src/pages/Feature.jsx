import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Feature = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { data } = location.state || {};
    const [selectedVh, setSelectedVh] = useState("");

    const handleProduce = () => {
        navigate("/produce", { state: { vhName: selectedVh } });
    };

    const handleConsume = () => {
        navigate("/consume", { state: { vhName: selectedVh } });
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card shadow p-4" style={{ maxWidth: "500px", width: "100%" }}>
                <h1 className="text-center mb-4">Feature Sayfası</h1>
                <div className="mb-3">
                    <label className="form-label">Kuyruk Seç</label>
                    <select
                        className="form-select"
                        value={selectedVh}
                        onChange={(e) => setSelectedVh(e.target.value)}
                    >
                        <option value="">Virtual Host Seçiniz</option>
                        {data?.response?.map((queue, index) => (
                            <option key={index} value={queue}>
                                {queue}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="d-flex justify-content-center">
                    <button
                        className="btn btn-success"
                        onClick={handleProduce}
                        disabled={!selectedVh}
                    >
                        Produce
                    </button>
                    <button
                        className="btn btn-info ms-3"
                        onClick={handleConsume}
                        disabled={!selectedVh}
                    >
                        Consume
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Feature;
