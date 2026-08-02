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
    webhookUrl: "https://45.43.152.156.nip.io/webhook/7e060783-665c-47f8-9fd1-823ee5b1b73f",
    proxyUrl: "http://localhost:3000/api/n8n",
    model: "V5_5",
  },
  suno: {
    apiType: "sunor", // sunor | songapi | apiframe | gcui
    baseUrl: "https://sunor.cc/api/v1",
    apiKey: "",
    backendUrl: "http://localhost:3000", // proxy sunucusu (CORS engelini aşar)
    model: "V4_5",
  },
};

const Config = {
  get() {
    const c = Store.get("musicConfig", null);
    return c
      ? {
          ...DEFAULT_CONFIG,
          ...c,
          n8n: { ...DEFAULT_CONFIG.n8n, ...(c.n8n || {}), proxyUrl: Config.saneProxyUrl(c.n8n && c.n8n.proxyUrl ? c.n8n.proxyUrl : "") },
          suno: {
            ...DEFAULT_CONFIG.suno,
            ...(c.suno || {}),
            backendUrl: Config.saneProxyUrl(c.suno && c.suno.backendUrl ? c.suno.backendUrl : ""),
          },
        }
      : DEFAULT_CONFIG;
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

/* ── Ayarlar sayfası şifre koruması ─────── */
const SettingsAuth = {
  KEY: "musicSettingsHash",
  SESSION: "musicSettingsAuthed",
  ATTEMPT_KEY: "musicSettingsAttempts",
  LOCK_KEY: "musicSettingsLockUntil",

  async hash(pw) {
    const s = "ai-music-studio::" + pw;
    if (window.crypto && crypto.subtle) {
      const data = new TextEncoder().encode(s);
      const buf = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return "djb2_" + h.toString(16);
  },

  hasPassword() {
    return !!localStorage.getItem(this.KEY);
  },

  async setPassword(pw) {
    localStorage.setItem(this.KEY, await this.hash(pw));
  },

  async verify(pw) {
    return (await this.hash(pw)) === localStorage.getItem(this.KEY);
  },

  isAuthed() {
    return sessionStorage.getItem(this.SESSION) === "1";
  },

  setAuthed(v) {
    v ? sessionStorage.setItem(this.SESSION, "1") : sessionStorage.removeItem(this.SESSION);
  },

  lockRemaining() {
    const until = parseInt(localStorage.getItem(this.LOCK_KEY) || "0", 10);
    return Math.max(0, until - Date.now());
  },

  registerFail() {
    const n = (parseInt(localStorage.getItem(this.ATTEMPT_KEY) || "0", 10) || 0) + 1;
    localStorage.setItem(this.ATTEMPT_KEY, String(n));
    if (n >= 5) {
      localStorage.setItem(this.LOCK_KEY, String(Date.now() + 30000));
      localStorage.setItem(this.ATTEMPT_KEY, "0");
    }
  },

  registerSuccess() {
    localStorage.setItem(this.ATTEMPT_KEY, "0");
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
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiType: c.apiType, apiKey: c.apiKey, baseUrl: c.baseUrl, taskId, audioId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Video görevi açılamadı (${res.status})`);
  return json.taskId || json.data?.taskId || json.id;
}

async function sunoGetVideoTask(videoTaskId) {
  const c = Config.get().suno;
  const base = c.backendUrl.trim().replace(/\/$/, "");
  const url = base
    ? `${base}/api/suno/video/status?taskId=${encodeURIComponent(videoTaskId)}&apiKey=${encodeURIComponent(c.apiKey)}&baseUrl=${encodeURIComponent(c.baseUrl)}`
    : `/api/suno/video/status?taskId=${encodeURIComponent(videoTaskId)}&apiKey=${encodeURIComponent(c.apiKey)}&baseUrl=${encodeURIComponent(c.baseUrl)}`;
  return (await fetch(url)).json();
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
        const state = (d.state || d.status || "pending").toLowerCase();
        const out = d.output && typeof d.output === "object" ? d.output : {};
        const sunoData = d.response && d.response.sunoData ? d.response.sunoData : d.sunoData || null;
        const items = Array.isArray(d.output)
          ? d.output
          : Array.isArray(d.data)
          ? d.data
          : Array.isArray(out.result)
          ? out.result
          : sunoData || d.tracks || [];
        const first = items[0] || {};
        const audioUrl = first.audio_url || first.audioUrl || first.url || out.audio_url || out.audioUrl || d.audio_url || d.audioUrl;
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
          const generateVideo =
            !!payload.video &&
            (c.apiType === "sunoapi" || /sunoapi\.org/i.test(c.baseUrl || "") || /sunoapi\.org/i.test(c.apiKey || ""));
          if (generateVideo) {
            onProgress("video");
            const audioId = first.id || (Array.isArray(d.data) ? d.data[0]?.id : "") || (sunoData && sunoData[0]?.id) || "";
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
            tracks: items,
            audioUrl: finalAudioUrl,
            videoUrl,
            isVideo,
            imageUrl: first.image_url || first.imageUrl || out.image_url || out.imageUrl || d.image_url || "",
            title: first.title || out.title || payload.title || "Şarkı",
            tags: first.tags || out.tags || payload.style || "",
          });
          return;
        }
        if (["failed", "error", "canceled", "cancelled"].includes(state) || state.includes("_failed") || state.includes("exception") || state.includes("sensitive")) {
          onError("Üretim başarısız oldu: " + (d.message || d.error || d.errorMessage || state));
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
