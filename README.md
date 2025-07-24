# RabbitMQ API Feature

Bu proje, RabbitMQ mesaj kuyruğu sistemini yönetmek için bir web arayüzü sağlar. Kullanıcılar, RabbitMQ kuyruklarına mesaj gönderebilir (produce) ve kuyruktan mesaj alabilir (consume).

## Özellikler

- RabbitMQ sunucusuna bağlanma
- Virtual host listesini görüntüleme
- Kuyruk listesini görüntüleme
- CSV veya JSON formatında veri gönderme
- Kuyruktan veri okuma ve CSV veya JSON formatında indirme
- Mesajları kuyruktan silme veya koruma seçeneği

## Kurulum

### Backend

```bash
cd rabbit-backend
npm install
```

### Frontend

```bash
cd rabbit-front
npm install
```

## Yapılandırma

### RabbitMQ Bağlantısı

`rabbit-backend/config/rabbitConfig.js` dosyasını düzenleyerek RabbitMQ bağlantı bilgilerinizi ayarlayın:

```javascript
module.exports = {
    RABBITMQ_URL: 'rabbitmq.example.com:5672', // RabbitMQ AMQP adresi (5672 portu)
    RABBITMQ_FRONTEND_URL: 'http://rabbitmq.example.com:15672' // RabbitMQ HTTP API adresi (15672 portu)
};
```

## Çalıştırma

### Backend

```bash
cd rabbit-backend
node app.js
```

### Frontend

```bash
cd rabbit-front
npm run dev
```

## Kullanım

1. Ana sayfada RabbitMQ kullanıcı adı ve şifrenizi girin
2. Bağlantı başarılı olduktan sonra bir virtual host seçin
3. Produce veya Consume işlemi seçin
4. İlgili sayfada gerekli bilgileri doldurun ve işlemi gerçekleştirin

## Dosya Formatları

### Produce (Gönderme)

- **CSV**: Başlık satırı içeren CSV dosyası
- **JSON**: Her satırda bir JSON objesi içeren dosya

### Consume (Alma)

- **CSV**: Verileri CSV formatında indir (Excel ile açılabilir)
- **JSON**: Verileri JSON formatında indir

## Geliştirme

Bu proje şu teknolojileri kullanmaktadır:

- **Backend**: Node.js, Express, amqplib
- **Frontend**: React, Redux, Bootstrap

## Not

Bu proje, RabbitMQ API'sini kullanarak mesaj kuyruklarını yönetmek için geliştirilmiştir. Gerçek bir üretim ortamında kullanmadan önce güvenlik önlemlerini gözden geçirin.
