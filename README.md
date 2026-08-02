# 🎵 Furkicanmusic Studio

Suno.ai gücüyle çalışan **müzik prompt oluşturucu + şarkı üretici** web sitesi.

- 🎛️ **Müzik Oluştur** — stil, sözler, şarkı adı, enstrümantal/video seçenekleriyle üretim
- 🎨 **Prompt Oluşturucu** — 100+ kategorili seçim (vokal, tür, enstrüman, atmosfer, tempo) ile İngilizce Suno promptu üretir
- 📚 **Geçmiş** — üretilen tüm müzikler tarayıcıda saklanır
- ⚙️ **Ayarlar** — iki bağlantı modu: **n8n webhook** veya **Suno API servisi**

## 📦 Dosya Yapısı

```
├── index.html          → Ana sayfa (müzik üretimi)
├── prompt.html         → Prompt Oluşturucu
├── history.html        → Geçmiş
├── settings.html       → Bağlantı ayarları
├── assets/
│   ├── css/style.css   → Tema
│   └── js/             → Uygulama mantığı
└── server/             → Opsiyonel Node.js proxy (Suno API key'ini gizli tutar)
```

## 🔌 Bağlantı Kurma (önemli)

Suno'nun **resmi public API'si yoktur**. İki çalışma modundan birini kurun:

### Seçenek 1 — n8n Webhook (önerilen)

**Hazır workflow:** `n8n/ai-music-studio.json` dosyası hazır — sadece içe aktarın.

1. n8n'de **Workflows → Import from File** ile `n8n/ai-music-studio.json`'u yükleyin.
2. n8n ayarlarına API key ekleyin: **Settings → Environment Variables** → `SUNO_API_KEY` = sunoapi.org key'iniz.
3. Workflow'u **Active** yapın. Webhook adresiniz: `https://n8n-adresiniz.com/webhook/ai-music-uret`
4. Bu URL'yi sitenin **Ayarlar** sayfasına yapıştırın (n8n modu zaten seçili).

Workflow şunları yapar: sitenin gönderdiği formu alır → `POST /api/v1/generate` ile sunoapi.org'da görev açar → her 30 saniyede durumu sorgular → müzik hazır olunca **Respond to Webhook** ile `audioUrl`'yi siteye geri döndürür → site şarkıyı oynatıcıda gösterir ve geçmişe kaydeder.

### Seçenek 2 — Suno API Servisi (key bazlı, site içinden)

1. [sunoapi.org](https://sunoapi.org/)'a kaydolun, [API Key sayfasından](https://sunoapi.org/api-key) key alın.
2. Sitenin **Ayarlar** sayfasında "Suno API Servisi" modunu seçin → sağlayıcı `sunoapi.org (API)`, base URL `https://api.sunoapi.org`, key'inizi girin.
3. (Önerilir) Key'i tarayıcıda tutmamak için proxy'yi çalıştırın:
   ```bash
   cd server
   npm install
   npm start        # http://localhost:3000
   ```
   Ayarlar'da "Backend Proxy URL" kısmına `http://localhost:3000` yazın.

Diğer sağlayıcılar: [sunor.cc](https://sunor.cc) (25 ücretsiz kredi), [songapi.dev](https://songapi.dev) (ücretsiz sandbox), [apiframe.ai](https://apiframe.ai).

## 🌍 Netlify'a Deploy

Statik site olduğundan klasörü Netlify'a sürükleyip bırakmanız yeterli (n8n modunda). API modunu proxy ile kullanacaksanız `server/` klasörünü ayrı bir Render/Railway servisine kurun.

## ⚠️ Notlar

- Üçüncü parti API servisleri resmi değildir; fiyat/kota değişebilir.
- Ürettiğiniz müziğin haklarını dağıtım öncesi kontrol edin (Suno'nun ücretli planlarında ticari kullanım hakkı vardır).
