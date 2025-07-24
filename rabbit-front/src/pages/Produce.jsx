import React, { useState, useEffect } from "react";
import { produceData, getQueuesByVHost } from "../services/api";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Papa from 'papaparse';

const Produce = () => {
    const [queueName, setQueueName] = useState("");
    const [fileContent, setFileContent] = useState(null);
    const [fileFormat, setFileFormat] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(false);

    const location = useLocation();
    const { vhName } = location.state || {};

    const username = useSelector((state) => state.auth.username);
    const password = useSelector((state) => state.auth.password);

    useEffect(() => {
        const fetchQueues = async () => {
            try {
                setLoading(true);
                const response = await getQueuesByVHost(username, password, vhName);
                setQueues(response.data.queues);
                setLoading(false);
            } catch (err) {
                console.error("Kuyruklar yüklenirken hata oluştu:", err);
                setError("Kuyruklar yüklenemedi.");
                setLoading(false);
            }
        };

        if (vhName) {
            fetchQueues();
        }
    }, [vhName, username, password]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileContent(null); // Dosya değiştiğinde içeriği sıfırla
            const reader = new FileReader();
            reader.onload = (event) => {
                setFileContent(event.target.result);
            };
            reader.readAsText(file);
        }
    };

    const parseFileContent = () => {
        if (!fileContent) return null;
        
        try {
            if (fileFormat === 'json') {
                // JSON formatı için satır satır JSON parse et
                const lines = fileContent.split("\n").filter(line => line.trim() !== '');
                
                // Tek bir JSON objesi olarak parse etmeyi dene (tüm dosya tek bir JSON objesi olabilir)
                try {
                    const jsonObject = JSON.parse(fileContent);
                    
                    // Eğer messages array'i varsa, doğrudan kullan
                    if (jsonObject.messages && Array.isArray(jsonObject.messages)) {
                        console.log("Tek bir JSON objesi içinde messages array'i bulundu:", jsonObject.messages.length);
                        return jsonObject.messages;
                    }
                    
                    // Tek bir obje ise, array içinde döndür
                    if (typeof jsonObject === 'object' && jsonObject !== null) {
                        console.log("Tek bir JSON objesi bulundu");
                        return [jsonObject];
                    }
                } catch (e) {
                    // Tek bir obje olarak parse edilemedi, satır satır deneyelim
                    console.log("Tek bir JSON objesi olarak parse edilemedi, satır satır deneniyor");
                }
                
                // Satır satır JSON parse
                return lines.map(line => JSON.parse(line));
            } else if (fileFormat === 'csv') {
                // CSV formatı için Papa Parse kullan
                const result = Papa.parse(fileContent, {
                    header: true,
                    skipEmptyLines: true
                });
                
                if (result.errors && result.errors.length > 0) {
                    throw new Error(`CSV parse hatası: ${result.errors[0].message}`);
                }
                
                return result.data;
            }
            
            return null;
        } catch (error) {
            console.error("Dosya parse hatası:", error);
            throw error;
        }
    };

    const handleProduce = async () => {
        try {
            setError(null);
            setSuccess(null);
            
            if (!fileContent) {
                setError("Lütfen bir dosya seçin.");
                return;
            }
            
            let messages;
            try {
                messages = parseFileContent();
                
                if (!messages || messages.length === 0) {
                    setError("Dosyada geçerli veri bulunamadı.");
                    return;
                }
                
                console.log(`${messages.length} mesaj işleniyor...`);
            } catch (parseError) {
                setError(`Dosya formatı hatalı: ${parseError.message}`);
                return;
            }
            
            await produceData(username, password, queueName, vhName, messages);
            setSuccess(`${messages.length} mesaj başarıyla gönderildi!`);
        } catch (err) {
            console.error("Mesaj gönderme hatası:", err);
            setError("Mesajlar gönderilemedi.");
        }
    };

    return (
        <div className="container mt-5">
            <h1>Produce Sayfası</h1>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            <div className="card mb-4">
                <div className="card-header bg-info text-white">
                    <i className="bi bi-info-circle me-2"></i>
                    Dosya Format Bilgisi
                </div>
                <div className="card-body">
                    <h5 className="card-title">Tüm mesajlar application/json formatında gönderilir</h5>
                    <p className="card-text">
                        <strong>CSV formatı:</strong> Başlık satırı içeren CSV dosyası. Her satır JSON objesine dönüştürülür.
                    </p>
                    <p className="card-text">
                        <strong>JSON formatı:</strong> İki şekilde kabul edilir:
                    </p>
                    <ul>
                        <li>Her satırda bir JSON objesi olan dosya</li>
                        <li>Tek bir JSON objesi içinde <code>{`{"messages": [...]}`}</code> formatında bir dizi</li>
                    </ul>
                    <p className="card-text">
                        <strong>Örnek JSON format:</strong>
                    </p>
                    <pre className="bg-light p-2">
{`{
  "messages": [
    {
      "id": 1,
      "name": "Örnek 1",
      "value": 100
    },
    {
      "id": 2,
      "name": "Örnek 2",
      "value": 200
    }
  ]
}`}
                    </pre>
                </div>
            </div>
            
            <div className="mb-3">
                <label className="form-label">Queue Name</label>
                {loading ? (
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                ) : (
                    <select
                        className="form-select"
                        value={queueName}
                        onChange={(e) => setQueueName(e.target.value)}
                    >
                        <option value="">Kuyruk Seçiniz</option>
                        {queues.map((queue, index) => (
                            <option key={index} value={queue}>
                                {queue}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            
            <div className="mb-3">
                <label className="form-label">Dosya Formatı <span className="text-danger">*</span></label>
                <select
                    className="form-select"
                    value={fileFormat}
                    onChange={(e) => setFileFormat(e.target.value)}
                >
                    <option value="">Seçiniz</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                </select>
                {fileFormat && (
                    <div className="form-text text-muted">
                        {fileFormat === 'csv' 
                            ? "CSV dosyası başlık satırı içermelidir." 
                            : "Her satırda bir JSON objesi içermelidir."}
                    </div>
                )}
            </div>
            
            <div className="mb-3">
                <label className="form-label">Dosya Seç</label>
                <input
                    type="file"
                    className="form-control"
                    accept={fileFormat === 'csv' ? ".csv" : ".txt,.json"}
                    onChange={handleFileChange}
                    disabled={!fileFormat}
                />
                {fileFormat ? (
                    <div className="form-text">
                        {fileFormat === 'csv' 
                            ? "CSV formatında bir dosya seçin (.csv)" 
                            : "Her satırda bir JSON objesi olan bir dosya seçin (.txt, .json)"}
                    </div>
                ) : (
                    <div className="form-text text-muted">
                        Lütfen önce dosya formatını seçin
                    </div>
                )}
            </div>
            
            <button
                className="btn btn-primary"
                onClick={handleProduce}
                disabled={!queueName || !fileFormat || !fileContent}
            >
                Data Produce Et
            </button>
        </div>
    );
};

export default Produce;
