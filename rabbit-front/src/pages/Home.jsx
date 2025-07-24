import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectToRabbitMQ } from "../services/api";
import { useDispatch } from "react-redux";
import { setUsername, setPassword } from "../store/authSlice";

const Home = () => {
    const [username, setUsernameInput] = useState("");
    const [password, setPasswordInput] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleConnect = async () => {
        try {
            dispatch(setUsername(username));
            dispatch(setPassword(password));

            console.log("RabbitMQ'ya bağlanılıyor...", { username });
            const response = await connectToRabbitMQ(username, password);
            console.log("Home Page Response:", response.data);

            if (!response.data.response || response.data.response.length === 0) {
                setError("Erişilebilir virtual host bulunamadı.");
                return;
            }

            navigate("/feature", { state: { data: response.data } });
        } catch (err) {
            console.error("Bağlantı hatası:", err);
            if (err.response) {
                console.error("Hata detayları:", err.response.data);
                setError(`Bağlantı kurulamadı: ${err.response.data.error || "Bilgilerinizi kontrol edin."}`);
            } else {
                setError("Bağlantı kurulamadı, bilgilerinizi kontrol edin.");
            }
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div
                className="card shadow p-4"
                style={{
                    maxWidth: "700px",
                    width: "100%",
                    height: "400px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                }}
            >
                <div className="d-flex justify-content-center">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/7/71/RabbitMQ_logo.svg"
                        alt="RabbitMQ Logo"
                        className="mb-4 w-50 p-3"
                    />
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <form>
                    <div className="mb-3">
                        <label className="form-label">Kullanıcı Adı</label>
                        <input
                            type="text"
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsernameInput(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Şifre</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPasswordInput(e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary w-100"
                        onClick={handleConnect}
                        disabled={!username || !password} // Bilgiler eksikse buton pasif
                    >
                        Connect
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Home;
