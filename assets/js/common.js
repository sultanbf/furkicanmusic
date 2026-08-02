/* Furkicanmusic Studio - ortak yardımcılar ve API entegrasyonu */

const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

const DEFAULT_CONFIG = {
  mode: "n8n", // "n8n" | "suno"
  n8n: {
    webhookUrl: "",
    proxyUrl: "",
    model: "V5_5",
  },
  suno: {
    apiType: "sunoapi", // sunoapi | sunor | songapi | apiframe | gcui
    baseUrl: "",
    apiKey: "",
    backendUrl: "http://localhost:3000", // proxy sunucusu (CORS engelini aşar)
    model: "V4_5",
  },
};

/* keys.js'ten gelen gömülü (sabit) değerleri uygular.
 * API anahtarı / base URL kullanıcı tarafından görülmez;
 * apiType seçimi base URL'yi otomatik belirler. */
function embeddedSuno(apiType, stored) {
  const type = apiType || DEFAULT_CONFIG.suno.apiType || "sunoapi";
  const baseUrl = (PROVIDER_BASE_URLS && PROVIDER_BASE_URLS[type]) || "";
  const apiKey = (EMBEDDED_KEYS && EMBEDDED_KEYS[type]) || (stored && stored.apiKey) || "";
  return { apiType: type, baseUrl, apiKey };
}

const Config = {
  get() {
    const c = Store.get("musicConfig", null);
    const s = c || {};
    const sunoEmb = embeddedSuno(s.suno && s.suno.apiType, s.suno || {});
    const n8nWebhook = (EMBEDDED_N8N && EMBEDDED_N8N.webhookUrl) || (s.n8n && s.n8n.webhookUrl) || "";
    const n8nProxy = (EMBEDDED_N8N && EMBEDDED_N8N.proxyUrl) || (s.n8n && s.n8n.proxyUrl) || "";
    return {
      ...DEFAULT_CONFIG,
      ...s,
      mode: s.mode || DEFAULT_CONFIG.mode,
      n8n: { ...DEFAULT_CONFIG.n8n, ...(s.n8n || {}), webhookUrl: n8nWebhook, proxyUrl: Config.saneProxyUrl(n8nProxy) },
      suno: {
        ...DEFAULT_CONFIG.suno,
        ...(s.suno || {}),
        apiType: sunoEmb.apiType,
        baseUrl: sunoEmb.baseUrl,
        apiKey: sunoEmb.apiKey,
        backendUrl: Config.saneProxyUrl((s.suno && s.suno.backendUrl) || DEFAULT_CONFIG.suno.backendUrl),
      },
    };
  },
  /* localhost proxy'si yalnızca sayfa localhost'ta açıldığında geçerlidir.
   * Netlify vb. remote host'ta açıldığında relative /api/... kullanılır. */
  saneProxyUrl(url) {
    const u = (url || "").trim();
    const pageLocal =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:";
    const isLocalProxy = /localhost|127\.0\.0\.1/.test(u);
    return u && !isLocalProxy ? u : pageLocal ? u : "";
  },
  set(c) {
    Store.set("musicConfig", c);
    updateConnBadge();
  },
  isReady() {
    const c = Config.get();
    if (c.mode === "n8n") return !!c.n8n.webhookUrl;
    if (c.mode === "suno") return !!(c.suno.apiKey && c.suno.baseUrl);
    return false;
  },
};

const History = {
  getAll() {
    return Store.get("musicHistory", []);
  },
  add(item) {
    const h = History.getAll();
    h.unshift(item);
    Store.set("musicHistory", h.slice(0, 100));
  },
  remove(id) {
    const h = History.getAll().filter((x) => x.id !== id);
    Store.set("musicHistory", h);
  },
  clear() {
    Store.remove("musicHistory");
  },
};

/* ── Toast bildirimleri ─────────────────── */
function toast(msg, type = "info", ms = 3200) {
  let box = document.querySelector(".toast-container");
  if (!box) {
    box = document.createElement("div");
    box.className = "toast-container";
    document.body.appendChild(box);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/* ── Bağlantı rozeti ────────────────────── */
function updateConnBadge() {
  const badge = document.getElementById("connBadge");
  if (!badge) return;
  const c = Config.get();
  const ready = Config.isReady();
  const label = c.mode === "n8n" ? "n8n Webhook" : "Suno API";
  badge.className = `conn-badge ${ready ? "ready" : ""}`;
  badge.innerHTML = `<span class="dot"></span>${ready ? label : "Bağlantı Yok"}`;
}

/* ── Prompt parçaları ───────────────────── */
function buildPromptFromForm(data) {
  const parts = [];
  if (data.style) parts.push(data.style.trim());
  if (data.genre) parts.push(data.genre.trim());
  if (data.mood) parts.push(data.mood.trim());
  if (data.tempo) parts.push(data.tempo.trim());
  if (data.vocalGender) parts.push(data.vocalGender === "erkek" ? "male vocals" : "female vocals");
  if (data.extraWords && data.extraWords.trim()) parts.push(data.extraWords.trim());
  return parts.join(", ");
}

/* ── Durum adımları ─────────────────────── */
function setStep(elId, state) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.remove("active", "done", "error");
  if (state) el.classList.add(state);
}

/* ── Suno API (üçüncü parti servisler) ──── */
async function sunoCreateTask(payload) {
  const c = Config.get().suno;
  const base = c.backendUrl.trim().replace(/\/$/, "");
  const url = base ? `${base}/api/suno/create` : "/api/suno/create";
  let res;

  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiType: c.apiType, apiKey: c.apiKey, baseUrl: c.baseUrl, ...payload }),
    });
  } catch (e) {
    throw new Error(
      base
        ? "Proxy sunucusuna ulaşılamadı. server klasöründe 'npm start' ile çalıştırdığınızdan emin olun. (Detay: " + e.message + ")"
        : "API isteği gönderilemedi: " + e.message
    );
  }

  if (!res.ok) {
    const t = await res.text();
    let msg = t;
    try {
      const j = JSON.parse(t);
      msg = j.error || j.msg || j.message || j.code || t;
    } catch {}
    throw new Error(`Suno API hatası (${res.status}): ${String(msg).slice(0, 300)}`);
  }
  const json = await res.json();
  return json.data && (json.data.taskId || json.data.task_id || json.data.id) ? json.data : json;
}

async function sunoGetTask(taskId) {
  const c = Config.get().suno;
  const base = c.backendUrl.trim().replace(/\/$/, "");
  const url = base
    ? `${base}/api/suno/status?taskId=${encodeURIComponent(taskId)}&apiType=${encodeURIComponent(c.apiType)}&baseUrl=${encodeURIComponent(c.baseUrl)}&apiKey=${encodeURIComponent(c.apiKey)}`
    : `/api/suno/status?taskId=${encodeURIComponent(taskId)}&apiType=${encodeURIComponent(c.apiType)}&baseUrl=${encodeURIComponent(c.baseUrl)}&apiKey=${encodeURIComponent(c.apiKey)}`;
  const res = await fetch(url);
  return res.json();
}

/* ── MP4 video üretimi (sunoapi.org) ────── */
async function sunoCreateVideoTask(taskId, audioId) {
  const c = Config.get().suno;
  const base = c.backendUrl.trim().replace(/\/$/, "");
  const url = base ? `${base}/api/suno/video/create` : "/api/suno/video/create";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiType: c.apiType, apiKey: c.apiKey, baseUrl: c.baseUrl, taskId, audioId }),
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Video görevi açılamadı (${res.status})`);
    return json.taskId || json.data?.taskId || json.id;
  } catch (e) {
    throw new Error("Video görevi açılamadı: " + (e.name === "AbortError" ? "zaman aşımı" : e.message));
  } finally {
    clearTimeout(timer);
  }
}

async function sunoGetVideoTask(videoTaskId) {
  const c = Config.get().suno;
  const base = c.backendUrl.trim().replace(/\/$/, "");
  const url = base
    ? `${base}/api/suno/video/status?taskId=${encodeURIComponent(videoTaskId)}&apiKey=${encodeURIComponent(c.apiKey)}&baseUrl=${encodeURIComponent(c.baseUrl)}`
    : `/api/suno/video/status?taskId=${encodeURIComponent(videoTaskId)}&apiKey=${encodeURIComponent(c.apiKey)}&baseUrl=${encodeURIComponent(c.baseUrl)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 40000);
  try {
    return (await fetch(url, { signal: ctrl.signal })).json();
  } catch (e) {
    throw new Error("Video durum sorgusu " + (e.name === "AbortError" ? "zaman aşımı" : "başarısız") + ": " + e.message);
  } finally {
    clearTimeout(timer);
  }
}

/* ── n8n entegrasyonu ───────────────────── */
async function n8nSend(payload) {
  const c = Config.get();
  const proxy = (c.n8n.proxyUrl || "").trim().replace(/\/$/, "");
  let res;
  try {
    if (proxy) {
      res = await fetch(proxy, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _webhookUrl: c.n8n.webhookUrl, ...payload }),
      });
    } else {
      res = await fetch("/api/n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _webhookUrl: c.n8n.webhookUrl, ...payload }),
      });
    }
  } catch (e) {
    throw new Error(
      "Webhook'a ulaşılamadı. Kontrol edin: 1) n8n proxy sunucusu çalışıyor mu? " +
      "(server klasöründe: npm start). 2) Ayarlar'daki webhook URL doğru mu? 3) n8n Webhook " +
      "node'unda Options → Allowed Origins (CORS) kısmına * yazın ve workflow'u Save + Active yapın."
    );
  }
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j.error || "";
    } catch {}
    throw new Error(`n8n webhook hatası (${res.status})${detail ? ": " + detail : ""}`);
  }

  const ctype = (res.headers.get("content-type") || "").toLowerCase();
  if (ctype.includes("json")) {
    const text = await res.text();
    return text ? { type: "json", data: JSON.parse(text) } : { type: "json", data: {} };
  }
  if (ctype.includes("audio") || ctype.includes("video") || ctype.includes("octet-stream") || ctype.includes("mpeg")) {
    const blob = await res.blob();
    return { type: "binary", blobUrl: URL.createObjectURL(blob), mime: ctype, size: blob.size };
  }
  const blob = await res.blob();
  if (blob.size > 0) return { type: "binary", blobUrl: URL.createObjectURL(blob), mime: "audio/mpeg", size: blob.size };
  return { type: "json", data: {} };
}

/* ── Otomatik müzik stili ve şarkı adı üretici ── */
function pickRnd(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const STYLE_MAIN = [
  "epic orchestral", "synthwave", "duygusal pop", "trap beat", "indie rock",
  "lo-fi hip hop", "akustik ballad", "elektronik dans", "türk pop", "arabesk",
  "jazz lounge", "ambient", "90s retro pop", "rock ballad", "piano ballad",
  "enerjik pop", "anatolian rock", "halay", "zeybek", "sufi müzik",
];
const STYLE_EXTRA = [
  "male vocals", "female vocals", "emotional", "energetic", "melancholic",
  "atmospheric", "with piano", "with strings", "with 808 bass", "with choir",
  "upbeat", "dreamy", "with baglama", "with ney", "with reverb",
];

function randomMusicStyle() {
  return pickRnd(STYLE_MAIN) + ", " + pickRnd(STYLE_EXTRA);
}

const TITLE_A = [
  "Gecenin", "Yıldızların", "Denizin", "Rüzgarın", "Kalbin", "Yolların",
  "Şehrin", "Hayallerin", "Sabahın", "Aşkın", "Gökyüzünün", "Yağmurun",
];
const TITLE_B = [
  "Şarkısı", "Rüyası", "Sessizliği", "Yansıması", "Melodisi", "Işığı",
  "Gölgesi", "Seslenişi", "Dansı", "Hatırası", "Fısıltısı", "Yolu",
];
const TITLE_C = [
  "Sonsuz", "Kırık", "Yeniden", "Sonbahar", "Gece Yarısı", "Uzak",
  "Sessiz", "Mavi", "Altın", "Karanlık", "Gizli", "Yanık",
];

function randomSongTitle() {
  return Math.random() > 0.5
    ? `${pickRnd(TITLE_A)} ${pickRnd(TITLE_B)}`
    : `${pickRnd(TITLE_C)} ${pickRnd(TITLE_A)} ${pickRnd(TITLE_B)}`;
}

/* ── Otomatik şarkı sözü üretici ────────── */
function generateLyrics(style, title) {
  const tema = [
    "gece", "yıldızlar", "deniz", "yağmur", "rüzgar", "dağlar", "hasret", "sevda",
    "sabah", "güneş", "bulutlar", "yollar", "gölge", "ışık", "sessizlik", "karanlık",
  ];
  const duygu = ["özlüyorum", "ararım", "beklerim", "yürürüm", "söylerim", "inanırım", "dönerim", "susarım"];
  const nesne = ["gözlerin", "ellerin", "sesin", "yüzün", "kalbin", "hayalin", "umudun", "adın"];
  const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const satir = (t, d, n) => `${r(t)} ${r(d)} ${r(n)}`;

  const v1 = [satir(tema, duygu, nesne), satir(tema, duygu, nesne), satir(tema, duygu, nesne), satir(tema, duygu, nesne)];
  const v2 = [satir(tema, duygu, nesne), satir(tema, duygu, nesne), satir(tema, duygu, nesne), satir(tema, duygu, nesne)];
  const ch = [
    `${r(tema)} içinde ${r(duygu)} seni`,
    `her ${r(tema)}'da ${r(nesne)} ile beni`,
    `bu ${r(tema)} şahit olsun ${r(duygu)}`,
    `sonsuz bir ${r(tema)} gibi ${r(duygu)}`,
  ];
  const bridge = [satir(tema, duygu, nesne), `gözlerim ${r(tema)}'da seni ${r(duygu)}`];

  return `[Intro]\n(Enstrümantal giriş)\n\n[Verse 1]\n${v1[0]}\n${v1[1]}\n${v1[2]}\n${v1[3]}\n\n[Pre-Chorus]\n${satir(tema, duygu, nesne)}\n${satir(tema, duygu, nesne)}\n\n[Chorus]\n${ch[0]}\n${ch[1]}\n${ch[2]}\n${ch[3]}\n\n[Verse 2]\n${v2[0]}\n${v2[1]}\n${v2[2]}\n${v2[3]}\n\n[Pre-Chorus]\n${satir(tema, duygu, nesne)}\n${satir(tema, duygu, nesne)}\n\n[Chorus]\n${ch[0]}\n${ch[1]}\n${ch[2]}\n${ch[3]}\n\n[Bridge]\n${bridge[0]}\n${bridge[1]}\n\n[Outro]\n(Kapanış)\n${r(duygu)} seni...`;
}

/* ── Üretim başlatma ────────────────────── */
async function startGeneration(payload, callbacks) {
  const c = Config.get();
  const { onProgress, onDone, onError } = callbacks;

  if (!Config.isReady()) {
    onError("Bağlantı yapılandırılmamış. Önce Ayarlar sayfasından modu ayarlayın.");
    return;
  }

  try {
    if (c.mode === "n8n") {
      onProgress("submitted");
      const taskId = crypto.randomUUID();
      const resp = await n8nSend(payload);

      if (resp.type === "binary") {
        const isVideo = resp.mime.includes("video") || resp.mime.includes("mp4");
        onDone({
          id: taskId,
          provider: "n8n",
          status: "complete",
          audioUrl: resp.blobUrl,
          blobMime: resp.mime,
          imageUrl: "",
          title: payload.songTitle || "Şarkı",
          tags: payload.style || "",
          note: isVideo
            ? "Videolu şarkı hazır! Ayrıca Google Drive, YouTube ve Instagram'a yüklendi."
            : "Şarkı hazır! Ayrıca Google Drive'a yüklendi.",
        });
        return;
      }

      const r = resp.data && resp.data.data ? resp.data.data : resp.data;
      const audio = r.audioUrl || r.audio_url;
      const video = r.videoUrl || r.video_url;
      const isVideo = !!video && String(video).length > 0;
      if (r && (r.status === "complete" || r.status === "success" || audio || video)) {
        onDone({
          id: r.id || taskId,
          provider: "n8n",
          status: "complete",
          audioUrl: isVideo ? video : audio,
          videoUrl: video || "",
          isVideo,
          imageUrl: r.imageUrl || r.image_url || "",
          title: r.title || payload.songTitle || "Şarkı",
          tags: r.tags || payload.style || "",
          track: r,
          tracks: r.tracks || (audio || video ? [r] : []),
        });
      } else {
        onDone({
          id: taskId,
          provider: "n8n",
          status: "submitted",
          message: "n8n akışına gönderildi. Şarkı üretilip Google Drive'a yükleniyor; tamamlandığında video (varsa) buraya dönecek.",
        });
      }
      return;
    }

    if (c.mode === "suno") {
      onProgress("submitted");
      const body = await sunoCreateTask(payload);
      const taskId = body.taskId || body.task_id || body.id || body.data?.taskId || body.data?.task_id || body.data?.id;
      if (!taskId) throw new Error("Görev ID alınamadı: " + JSON.stringify(body).slice(0, 300));

      const deadline = Date.now() + 15 * 60 * 1000;
      let lastState = "";
      while (Date.now() < deadline) {
        await sleep(5000);
        const st = await sunoGetTask(taskId);
        const d = st.data || st;
        const dataObj = d && typeof d === "object" ? d : {};
        const state = (dataObj.state || dataObj.status || "pending").toLowerCase();
        const out = dataObj.output && typeof dataObj.output === "object" ? dataObj.output : {};
        const resp = dataObj.response && typeof dataObj.response === "object" ? dataObj.response : {};
        const tracksArr =
          dataObj.tracks ||
          (Array.isArray(dataObj.data) ? dataObj.data : []) ||
          (dataObj.data && dataObj.data.tracks ? dataObj.data.tracks : []) ||
          (resp && resp.sunoData ? resp.sunoData : []) ||
          dataObj.sunoData ||
          (Array.isArray(dataObj.output) ? dataObj.output : []) ||
          (Array.isArray(out.result) ? out.result : []) ||
          [];
        const tracks = tracksArr;
        const first = tracks[0] || {};
        const audioUrl =
          first.audio_url ||
          first.audioUrl ||
          first.url ||
          dataObj.audio_url ||
          dataObj.audioUrl ||
          (dataObj.data && (dataObj.data.audio_url || dataObj.data.audioUrl)) ||
          out.audio_url ||
          out.audioUrl;
        if (state !== lastState) {
          lastState = state;
          onProgress(state);
        }
        if (["success", "succeeded", "complete", "completed", "done", "finished"].includes(state)) {
          if (!audioUrl) {
            onError("Müzik üretildi ancak ses dosyası bulunamadı: " + JSON.stringify(d).slice(0, 400));
            return;
          }
          let finalAudioUrl = audioUrl;
          let videoUrl = "";
          let isVideo = false;
          const generateVideo = !!payload.video;
          console.log("[video] toggle:", payload.video, "->", generateVideo);
          if (generateVideo) {
            onProgress("video");
            const audioId =
              first.id ||
              (Array.isArray(dataObj.data) ? dataObj.data[0]?.id : "") ||
              (dataObj.data && dataObj.data.tracks ? dataObj.data.tracks[0]?.id : "") ||
              (resp && resp.sunoData ? resp.sunoData[0]?.id : "") ||
              tracks[0]?.id ||
              "";
            if (!audioId) {
              onError("Video üretimi için parça ID bulunamadı: " + JSON.stringify(d).slice(0, 300));
              return;
            }
            try {
              const vTask = await sunoCreateVideoTask(taskId, audioId);
              if (!vTask) throw new Error("Video görev ID alınamadı");
              const vDeadline = Date.now() + 10 * 60 * 1000;
              while (Date.now() < vDeadline) {
                await sleep(5000);
                const vs = await sunoGetVideoTask(vTask);
                const vd = vs.data || vs;
                const sv = (vd.successFlag || vd.status || "pending").toLowerCase();
                if (sv === "success" && vd.videoUrl) {
                  videoUrl = vd.videoUrl;
                  isVideo = true;
                  break;
                }
                if (["create_task_failed", "generate_mp4_failed", "callback_exception", "failed", "error"].includes(sv)) {
                  throw new Error(vd.errorMessage || "Video üretimi başarısız oldu");
                }
              }
              if (!isVideo) throw new Error("Video üretimi zaman aşımına uğradı");
            } catch (e) {
              onError(e.message);
              return;
            }
            finalAudioUrl = videoUrl;
          }
          onDone({
            id: taskId,
            provider: "suno",
            status: "complete",
            tracks,
            audioUrl: finalAudioUrl,
            videoUrl,
            isVideo,
            imageUrl: first.image_url || first.imageUrl || (dataObj.data && (dataObj.data.image_url || dataObj.data.imageUrl)) || out.image_url || out.imageUrl || dataObj.image_url || "",
            title: first.title || (dataObj.data && dataObj.data.title) || out.title || payload.title || "Şarkı",
            tags: first.tags || (dataObj.data && dataObj.data.tags) || out.tags || payload.style || "",
          });
          return;
        }
        if (["failed", "error", "canceled", "cancelled"].includes(state) || state.includes("_failed") || state.includes("exception") || state.includes("sensitive")) {
          onError("Üretim başarısız oldu: " + (dataObj.message || dataObj.error || dataObj.errorMessage || state));
          return;
        }
      }
      onError("Zaman aşımı (15 dk). Görev hala işleniyor olabilir.");
    }
  } catch (e) {
    onError(e.message || "Bilinmeyen hata");
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ── Dosya indirme ──────────────────────── */
async function downloadFile(url, filename) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("İndirme başladı", "success");
  } catch {
    window.open(url, "_blank");
    toast("Tarayıcı engelledi, yeni sekmede açıldı", "warning");
  }
}

/* ── Sayaçlar ───────────────────────────── */
function bindCharCount(id, max) {
  const el = document.getElementById(id);
  if (!el) return;
  const upd = () => {
    const cnt = document.getElementById(id + "Count");
    if (cnt) cnt.textContent = `${el.value.length} / ${max}`;
  };
  el.addEventListener("input", upd);
  upd();
}

/* ── Ortak iskelet yükleme (nav + footer) ── */
const PAGES = [
  { href: "index.html", label: "🎵 Oluştur" },
  { href: "prompt.html", label: "🎨 Prompt" },
  { href: "history.html", label: "📚 Geçmiş" },
  { href: "settings.html", label: "⚙️ Ayarlar" },
];

function renderShell(activePage) {
  const links = PAGES.map(
    (p) => `<a href="${p.href}" class="${p.href === activePage ? "active" : ""}">${p.label}</a>`
  ).join("");

  const nav = document.createElement("nav");
  nav.className = "navbar";
  nav.innerHTML = `
    <a class="brand" href="index.html">
      <span class="logo">🎵</span>
      <span>Furkicanmusic Studio</span>
    </a>
    <div class="nav-links">${links}</div>
    <div class="nav-right">
      <span class="conn-badge" id="connBadge"><span class="dot"></span>Bağlantı Yok</span>
    </div>
  `;
  document.body.prepend(nav);
  updateConnBadge();

  const footer = document.createElement("footer");
  footer.className = "footer";
  footer.innerHTML = "© 2026 Furkan Can Çalık — Powered by Furkicanmusic";
  document.body.appendChild(footer);
}
