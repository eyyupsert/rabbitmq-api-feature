import React, { useState, useEffect } from "react";
import { consumeData, getQueuesByVHost } from "../services/api";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const Consume = () => {
    const [queueName, setQueueName] = useState("");
    const [deleteMessages, setDeleteMessages] = useState("");
    const [downloadFormat, setDownloadFormat] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState("");

    const location = useLocation();
    const { vhName } = location.state || {};

    const username = useSelector((state) => state.auth.username);
    const password = useSelector((state) => state.auth.password);

    useEffect(() => {
        const fetchQueues = async () => {
            try {
                console.log("Consume sayfası - Virtual Host:", vhName);
                console.log("Consume sayfası - Credentials:", { username, password });
                
                if (!vhName) {
                    console.error("Virtual host değeri bulunamadı!");
                    setError("Virtual host değeri bulunamadı. Lütfen ana sayfaya dönün ve tekrar deneyin.");
                    setLoading(false);
                    return;
                }
                
                setLoading(true);
                console.log("Kuyrukları getirmek için istek gönderiliyor...");
                const response = await getQueuesByVHost(username, password, vhName);
                console.log("Kuyruk yanıtı:", response.data);
                setQueues(response.data.queues);
                setLoading(false);
            } catch (err) {
                console.error("Kuyruklar yüklenirken hata oluştu:", err);
                if (err.response) {
                    console.error("Hata detayları:", err.response.data);
                    setError(`Kuyruklar yüklenemedi: ${err.response.data.error || err.message}`);
                } else {
                    setError(`Kuyruklar yüklenemedi: ${err.message}`);
                }
                setLoading(false);
            }
        };

        if (vhName) {
            fetchQueues();
        } else {
            console.warn("Virtual host değeri bulunamadı, kuyruklar yüklenemeyecek.");
        }
    }, [vhName, username, password]);

    const convertToCSV = (jsonArray) => {
        try {
            // İlerleme durumunu güncelle
            setProgress(60);
            setProgressStatus("Veriler CSV formatına dönüştürülüyor...");
            
            console.log("Dönüştürülecek ham mesajlar:", jsonArray);
            
            // JSON string'lerini parse et (güvenli bir şekilde)
            const parsedData = jsonArray.map(item => {
                try {
                    // Eğer string ise JSON parse et
                    if (typeof item === 'string') {
                        return JSON.parse(item);
                    } 
                    // Zaten obje ise doğrudan kullan
                    else if (typeof item === 'object' && item !== null) {
                        return item;
                    }
                    // Diğer türleri string olarak döndür
                    return { value: String(item) };
                } catch (parseError) {
                    console.warn("JSON parse hatası, ham değer kullanılıyor:", parseError);
                    return { value: item };
                }
            });
            
            console.log("Parse edilmiş veri:", parsedData);
            
            if (parsedData.length === 0) return '';
            
            // Tüm objelerin anahtarlarını birleştir (benzersiz başlıklar için)
            const headers = [...new Set(parsedData.flatMap(obj => Object.keys(obj)))];
            console.log("CSV başlıkları:", headers);
            
            // CSV başlık satırı
            let csvContent = headers.join(',') + '\n';
            
            // Her veri satırını ekle
            let counter = 0;
            const totalItems = parsedData.length;
            
            parsedData.forEach(obj => {
                const row = headers.map(header => {
                    // Değer varsa ve virgül içeriyorsa çift tırnak içine al
                    const value = obj[header] === undefined ? '' : obj[header];
                    
                    // Obje veya dizi ise JSON.stringify kullan
                    const valueStr = typeof value === 'object' && value !== null 
                        ? JSON.stringify(value).replace(/"/g, '""') 
                        : String(value).replace(/"/g, '""');
                    
                    return valueStr.includes(',') ? `"${valueStr}"` : valueStr;
                });
                csvContent += row.join(',') + '\n';
                
                // Her %10'luk ilerleme için progress bar'ı güncelle
                counter++;
                if (counter % Math.max(1, Math.floor(totalItems / 10)) === 0) {
                    const currentProgress = 60 + Math.floor((counter / totalItems) * 30);
                    setProgress(currentProgress);
                    setProgressStatus(`CSV dönüştürülüyor: ${counter}/${totalItems} kayıt işlendi`);
                }
            });
            
            setProgress(90);
            setProgressStatus("CSV dosyası oluşturuldu, indirme hazırlanıyor...");
            
            return csvContent;
        } catch (error) {
            console.error("CSV dönüşüm hatası:", error);
            throw new Error("Veriler CSV formatına dönüştürülemedi: " + error.message);
        }
    };

    const handleConsume = async () => {
        try {
            // İşlem başlangıcı
            setProcessing(true);
            setError(null);
            setSuccess(null);
            setProgress(10);
            setProgressStatus("RabbitMQ bağlantısı kuruluyor...");
            
            // Kısa bir gecikme ekleyerek progress bar'ın başlangıç durumunu göster
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setProgress(20);
            setProgressStatus(`"${queueName}" kuyruğundan veriler çekiliyor...`);
            
            const shouldDeleteMessages = deleteMessages === "true";
            console.log(`Kuyruktan mesajlar ${shouldDeleteMessages ? 'silinecek' : 'silinmeyecek'}`);
            
            const response = await consumeData(username, password, queueName, vhName, shouldDeleteMessages);
            console.log("Backend'den gelen yanıt:", response.data);
            
            let messages = response.data.messages;
            const messagesDeleted = response.data.messagesDeleted;
            const messageCount = response.data.count || (messages ? messages.length : 0);
            
            if (!messages || messages.length === 0) {
                setError("Kuyrukta veri bulunamadı");
                setProcessing(false);
                setProgress(0);
                setProgressStatus("");
                return;
            }
            
            // Mesajları debug için konsola yazdır
            console.log("Kuyruktan çekilen ham mesajlar:", messages);
            console.log(`Toplam ${messageCount} mesaj çekildi, ${messagesDeleted ? 'silindi' : 'silinmedi'}`);
            
            // Mesajları doğru formata dönüştür
            try {
                // Eğer mesajlar string değilse, stringe dönüştür
                messages = messages.map(msg => {
                    if (typeof msg !== 'string') {
                        return JSON.stringify(msg);
                    }
                    return msg;
                });
            } catch (formatError) {
                console.warn("Mesaj format düzeltme hatası:", formatError);
            }

            setProgress(40);
            setProgressStatus(`${messageCount} mesaj çekildi, işleniyor...`);
            
            // Kısa bir gecikme ekleyerek progress bar'ın ilerlediğini göster
            await new Promise(resolve => setTimeout(resolve, 300));

            try {
                if (downloadFormat === 'csv') {
                    // CSV formatına dönüştür
                    const csvContent = convertToCSV(messages);
                    
                    // CSV dosyasını indir
                    setProgress(95);
                    setProgressStatus("CSV dosyası indiriliyor...");
                    
                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `${queueName}_data.csv`;
                    link.click();
                } else {
                    // JSON formatında indir
                    setProgress(95);
                    setProgressStatus("JSON dosyası indiriliyor...");
                    
                    // Mesajları istenen formatta paketleyelim: { "messages": [...] }
                    const jsonData = {
                        messages: messages.map(msg => {
                            try {
                                // Eğer string ise JSON parse et
                                return typeof msg === 'string' ? JSON.parse(msg) : msg;
                            } catch (e) {
                                // Parse edilemezse ham haliyle döndür
                                return msg;
                            }
                        })
                    };
                    
                    const jsonContent = JSON.stringify(jsonData, null, 2); // Pretty print için 2 space indent
                    const blob = new Blob([jsonContent], { type: "application/json" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `${queueName}_data.json`;
                    link.click();
                }
                
                setProgress(100);
                setProgressStatus("İşlem tamamlandı!");
                
                // Başarı mesajını güncelle
                const actionText = shouldDeleteMessages 
                    ? `okundu, kuyruktan silindi (${messageCount} mesaj)` 
                    : `okundu (kuyrukta bırakıldı, ${messageCount} mesaj)`;
                const formatText = downloadFormat === 'csv' ? "CSV" : "JSON";
                setSuccess(`Kuyruktan ${messageCount} mesaj ${actionText} ve ${formatText} dosyasına kaydedildi.`);
                
                // Kısa bir gecikme sonra progress bar'ı gizle
                setTimeout(() => {
                    setProgress(0);
                    setProgressStatus("");
                }, 1000);
                
            } catch (csvError) {
                // CSV dönüşümünde hata olursa, orijinal JSON formatında indir
                console.error("Dönüşüm hatası:", csvError);
                setError(`${downloadFormat === 'csv' ? 'CSV' : 'JSON'} dönüşüm hatası: ${csvError.message}. Veriler JSON formatında indirildi.`);
                
                setProgress(95);
                setProgressStatus("JSON dosyası indiriliyor (hata sonrası)...");
                
                // Hata durumunda da istenen formatta paketleyelim
                const jsonData = {
                    messages: messages.map(msg => {
                        try {
                            return typeof msg === 'string' ? JSON.parse(msg) : msg;
                        } catch (e) {
                            return msg;
                        }
                    })
                };
                
                const jsonContent = JSON.stringify(jsonData, null, 2);
                const blob = new Blob([jsonContent], { type: "application/json" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${queueName}_data.json`;
                link.click();
                
                setProgress(100);
                setProgressStatus("İşlem tamamlandı (JSON formatında)!");
                
                // Kısa bir gecikme sonra progress bar'ı gizle
                setTimeout(() => {
                    setProgress(0);
                    setProgressStatus("");
                }, 1000);
            }
        } catch (error) {
            console.error("Veri çekme hatası:", error);
            setError(`Hata: ${error.message || "Bilinmeyen bir hata oluştu"}`);
            setProgress(0);
            setProgressStatus("");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mt-5">
            <h1>Consume Sayfası</h1>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            <div className="card mb-4">
                <div className="card-header bg-info text-white">
                    <i className="bi bi-info-circle me-2"></i>
                    İndirme Format Bilgisi
                </div>
                <div className="card-body">
                    <h5 className="card-title">Tüm mesajlar application/json formatında işlenir</h5>
                    <p className="card-text">
                        <strong>CSV formatı:</strong> Veriler başlık satırı içeren CSV dosyasına dönüştürülür (Excel ile açılabilir).
                    </p>
                    <p className="card-text">
                        <strong>JSON formatı:</strong> Veriler aşağıdaki formatta indirilir:
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
            
            {progress > 0 && (
                <div className="mb-4">
                    <div className="progress mb-2">
                        <div 
                            className="progress-bar progress-bar-striped progress-bar-animated" 
                            role="progressbar" 
                            style={{ width: `${progress}%` }} 
                            aria-valuenow={progress} 
                            aria-valuemin="0" 
                            aria-valuemax="100">
                            {progress}%
                        </div>
                    </div>
                    <div className="text-center text-muted small">{progressStatus}</div>
                </div>
            )}
            
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
                <label className="form-label">Kuyruktan mesajlar silinsin mi? <span className="text-danger">*</span></label>
                <select
                    className="form-select"
                    value={deleteMessages}
                    onChange={(e) => setDeleteMessages(e.target.value)}
                >
                    <option value="">Seçiniz</option>
                    <option value="false">Hayır - Mesajlar kuyrukta kalsın</option>
                    <option value="true">Evet - Mesajlar kuyruktan silinsin</option>
                </select>
                {deleteMessages && (
                    <div className="form-text text-muted">
                        {deleteMessages === "true" 
                            ? "Mesajlar okunduktan sonra kuyruktan silinecek." 
                            : "Mesajlar okunduktan sonra kuyrukta kalacak, tekrar okunabilir."}
                    </div>
                )}
            </div>
            
            <div className="mb-3">
                <label className="form-label">İndirme Formatı <span className="text-danger">*</span></label>
                <select
                    className="form-select"
                    value={downloadFormat}
                    onChange={(e) => setDownloadFormat(e.target.value)}
                >
                    <option value="">Seçiniz</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                </select>
                {downloadFormat && (
                    <div className="form-text text-muted">
                        {downloadFormat === 'csv' 
                            ? "Veriler CSV formatında indirilecek (Excel ile açılabilir)." 
                            : "Veriler JSON formatında indirilecek."}
                    </div>
                )}
            </div>
            
            <button
                className="btn btn-primary"
                onClick={handleConsume}
                disabled={!queueName || !deleteMessages || !downloadFormat || processing}
            >
                {processing ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        İşleniyor...
                    </>
                ) : (
                    "Data Consume Et"
                )}
            </button>
        </div>
    );
};

export default Consume;
