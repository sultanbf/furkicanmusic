/* ─────────────────────────────────────────────────────────────
   GÖMÜLÜ API ANAHTARLARI ve BAĞLANTI ADRESLERİ
   -------------------------------------------------------------
   Bu dosya siteye sabit olarak gömülüdür. Ayarlar sayfasında
   API anahtarı / base URL alanı YOKTUR — değerler buradan okunur.
   Yayınlamadan önce AŞAĞIDAKİ YERLERE kendi anahtarlarını yaz.

   Güvenlik notu: Bu dosya kaynak kodda görünür (client-side).
   Key'i tamamen gizli tutmak istiyorsan boş bırakın ve key'i
   server (server/server.js) veya Netlify ortam değişkeninde
   (SUNO_API_KEY) tutun.
   ───────────────────────────────────────────────────────────── */

/* Sağlayıcı seçimine göre otomatik kullanılan base URL'ler.
   Config.get() içinde sağlayıcının base URL'i her zaman buradan
   türetilir (Ayarlar'da base URL alanı yok). */
const PROVIDER_BASE_URLS = {
  sunoapi: "https://api.sunoapi.org",
  sunor: "https://sunor.cc/api/v1",
  songapi: "https://api.songapi.dev/v1",
  apiframe: "https://api.apiframe.ai/v2",
  gcui: "http://localhost:3000",
};

/* Buraya kendi API anahtarlarınızı gömün:
   Yalnızca kullandığınız sağlayıcının key'ini doldurun. */
const EMBEDDED_KEYS = {
  sunoapi: "a5407bb80b7d5fd07816ed7a5f724709",   // https://api.sunoapi.org   (öncelikle önerilen)
  sunor: "CyUApsUkgwoGbYxpcdOifdooJoSOWaAIRUAspHJLTzXNwzfGEdMQAalsKTuHDOJH",     // https://sunor.cc/api/v1
  songapi: "sk_live_PbAHKW2XVXzjVirvDCMj96D7",   // https://api.songapi.dev/v1
  apiframe: "afk_9c35e56b2107b7594c49e75c9665e01db100e58b",  // https://api.apiframe.ai/v2
  gcui: "",      // self-hosted suno-api (genelde key gerekmez)
};

/* n8n modu için gömülü webhook adresi (Ayarlar'da dolu alan yok).
   Boşsa otomatik olarak varsayılan n8n webhook'u kullanılır. */
const EMBEDDED_N8N = {
  webhookUrl: "https://45.43.152.156.nip.io/webhook/7e060783-665c-47f8-9fd1-823ee5b1b73f",
  proxyUrl: "http://localhost:3000/api/n8n",
};