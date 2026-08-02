/* Furkicanmusic Studio - Prompt Oluşturucu veri ve mantığı */

const CATEGORIES = [
  {
    key: "vocal",
    icon: "🎤",
    title: "Vokal Stili",
    desc: "Şarkıcının ses karakterini belirleyin (tek seçim)",
    single: true,
    items: [
      { en: "male vocals", tr: "👦 Erkek Vokal" },
      { en: "female vocals", tr: "👩 Kadın Vokal" },
      { en: "powerful vocals", tr: "💪 Güçlü" },
      { en: "soft vocals", tr: "🌸 Yumuşak" },
      { en: "raspy vocals", tr: "🎤 Boğuk" },
      { en: "smooth vocals", tr: "✨ Pürüzsüz" },
      { en: "emotional vocals", tr: "❤️ Duygusal" },
      { en: "ethereal vocals", tr: "🌙 Ruhani" },
      { en: "rap vocals", tr: "🎤 Rap" },
      { en: "melodic vocals", tr: "🎵 Melodik" },
      { en: "sparse vocals", tr: "🎼 Seyrek Vokal" },
      { en: "layered vocals", tr: "♬ Katmanlı Vokal" },
      { en: "distorted vocals", tr: "🔊 Bozulmuş" },
      { en: "autotuned vocals", tr: "🎹 Oto-ayarlı" },
      { en: "instrumental only", tr: "🎹 Enstrümantal (Vokalsiz)" },
    ],
  },
  {
    key: "genre",
    icon: "🎸",
    title: "Türler",
    desc: "Müzik türünü seçin (birden fazla olabilir)",
    single: false,
    items: [
      { en: "electronic dance music", tr: "🎛️ Elektronik ve Dans" },
      { en: "rock", tr: "🎸 Rock" },
      { en: "metal", tr: "🤘 Metal" },
      { en: "pop", tr: "🎤 Pop ve Çağdaş" },
      { en: "hip hop", tr: "🎧 Hip Hop ve R&B" },
      { en: "jazz", tr: "🎷 Caz" },
      { en: "blues", tr: "🎸 Blues" },
      { en: "classical", tr: "🎻 Klasik ve Orkestral" },
      { en: "country", tr: "🤠 Country" },
      { en: "folk", tr: "🪕 Folk" },
      { en: "latin", tr: "💃 Latin Müziği" },
      { en: "world music", tr: "🌍 Dünya Müziği" },
      { en: "a cappella", tr: "🎙️ Vokal ve Koro" },
      { en: "turkish pop", tr: "🇹🇷 Türk Pop" },
      { en: "arabesque", tr: "🎻 Arabesk" },
      { en: "turkish fantasy music", tr: "✨ Fantezi Müzik" },
      { en: "turkish singer-songwriter", tr: "🎸 Özgün Müzik" },
      { en: "anatolian rock", tr: "🏔️ Anatolian Rock" },
      { en: "turkish folk music", tr: "🪕 Türk Halk Müziği" },
      { en: "turkish classical music", tr: "🎼 Türk Sanat Müziği" },
      { en: "turkish folk song", tr: "🎵 Türkü" },
      { en: "turkish dance music", tr: "💃 Oyun Havası" },
      { en: "turkish zeibek", tr: "⚡ Zeybek" },
      { en: "turkish halay", tr: "💫 Halay" },
      { en: "90s turkish pop", tr: "📼 90s Türk Pop" },
      { en: "turkish jazz", tr: "🎷 Turkish Jazz" },
      { en: "turkish hip hop", tr: "🎧 Turkish Hip Hop" },
      { en: "ottoman music", tr: "🕌 Ottoman Music" },
      { en: "bozlak", tr: "🎻 Bozlak" },
      { en: "hoyrat", tr: "🎻 Hoyrat" },
      { en: "uzun hava", tr: "🌾 Uzun Hava" },
      { en: "kırık hava", tr: "🥁 Kırık Hava" },
      { en: "maya", tr: "🌙 Maya" },
      { en: "gurbet havası", tr: "🛤️ Gurbet Havası" },
      { en: "barak havası", tr: "🐫 Barak Havası" },
      { en: "ağıt", tr: "😢 Ağıt" },
      { en: "güzelleme", tr: "🌹 Güzelleme" },
      { en: "taşlama", tr: "⚔️ Taşlama" },
      { en: "koşma", tr: "🎤 Koşma" },
      { en: "mani", tr: "🎤 Mani" },
      { en: "divan havası", tr: "🎻 Divan Havası" },
      { en: "karşılama", tr: "🤝 Karşılama" },
      { en: "kına havası", tr: "💍 Kına Havası" },
      { en: "rumeli türküsü", tr: "🪗 Rumeli Türküsü" },
      { en: "sıra gecesi", tr: "☕ Sıra Gecesi" },
      { en: "çiftetelli", tr: "💃 Çiftetelli" },
      { en: "roman havası", tr: "🎪 Roman Havası" },
      { en: "horon", tr: "⚡ Horon" },
      { en: "bar", tr: "🪩 Bar Dansı" },
      { en: "teke zotlatması", tr: "🥄 Teke Zotlatması" },
      { en: "semah", tr: "🕊️ Semah" },
      { en: "deyiş", tr: "🎶 Deyiş" },
      { en: "nefes", tr: "🌬️ Nefes" },
      { en: "ilahi", tr: "🕌 İlahi" },
      { en: "tulum müziği", tr: "🪗 Tulum Müziği" },
      { en: "davul zurna", tr: "🥁 Davul-Zurna" },
      { en: "kafkas halk müziği", tr: "⛰️ Kafkas Halk Müziği" },
      { en: "mehter", tr: "⚔️ Mehter (Askeri)" },
      { en: "fasıl", tr: "🎼 Fasıl (TSM)" },
      { en: "gazel", tr: "🎤 Gazel" },
      { en: "peşrev", tr: "🎻 Peşrev" },
      { en: "saz semaisi", tr: "🎻 Saz Semaisi" },
      { en: "taksim", tr: "🎶 Taksim" },
      { en: "longa", tr: "⚡ Longa" },
      { en: "sirto", tr: "💃 Sirto" },
      { en: "tasavvuf müziği", tr: "🧿 Tasavvuf Müziği" },
      { en: "mevlevi ayini", tr: "🌙 Mevlevi Ayini (Sema)" },
      { en: "tekke müziği", tr: "🕌 Tekke Müziği" },
      { en: "turkish drill", tr: "🔥 Turkish Drill" },
      { en: "turkish r&b", tr: "🎤 Turkish R&B" },
      { en: "turkish electro", tr: "⚡ Turkish Electro" },
      { en: "turkish indie", tr: "🎸 Turkish Indie" },
      { en: "turkish slow", tr: "🌧️ Türkçe Slow" },
      { en: "arabesk rock", tr: "🎸 Arabesk Rock" },
      { en: "anadolu pop", tr: "🌻 Anadolu Pop" },
      { en: "turkish punk", tr: "🤘 Türkçe Punk" },
      { en: "turkish grunge", tr: "🎸 Türkçe Grunge" },
      { en: "turkish funk", tr: "🕺 Turkish Funk" },
      { en: "2000s turkish pop", tr: "💿 2000s Türk Pop" },
      { en: "turkish synthpop", tr: "🌃 Turkish Synthpop" },
      { en: "turkish deep house", tr: "🌊 Turkish Deep House" },
      { en: "turkish acoustic", tr: "🎸 Türkçe Akustik" },
      { en: "turkish folk rock", tr: "🏔️ Türk Folk Rock" },
    ],
  },
  {
    key: "makam",
    icon: "🎼",
    title: "Makamlar (TSM / Tasavvuf)",
    desc: "Türk sanat müziği makamları — oryantal ton için (tek seçim)",
    single: true,
    items: [
      { en: "hicaz makamı", tr: "🎻 Hicaz" },
      { en: "nihavend makamı", tr: "🎻 Nihavend" },
      { en: "rast makamı", tr: "🎻 Rast" },
      { en: "uşşak makamı", tr: "🎻 Uşşak" },
      { en: "kürdilihicazkar makamı", tr: "🎻 Kürdilihicazkar" },
      { en: "hüseyni makamı", tr: "🎻 Hüseyni" },
      { en: "segah makamı", tr: "🎻 Segâh" },
      { en: "bayati makamı", tr: "🎻 Bayati" },
      { en: "saba makamı", tr: "🎻 Sabâ" },
      { en: "hicazkar makamı", tr: "🎻 Hicazkar" },
      { en: "acemaşiran makamı", tr: "🎻 Acemaşiran" },
      { en: "muhayyer makamı", tr: "🎻 Muhayyer" },
      { en: "hüzzam makamı", tr: "🎻 Hüzzam" },
      { en: "suzinak makamı", tr: "🎻 Suz-i Nak" },
      { en: "nikriz makamı", tr: "🎻 Nikriz" },
      { en: "mahur makamı", tr: "🎻 Mahur" },
      { en: "evc makamı", tr: "🎻 Evc" },
      { en: "neva makamı", tr: "🎻 Neva" },
      { en: "buselik makamı", tr: "🎻 Bûselik" },
      { en: "karciğar makamı", tr: "🎻 Karciğar" },
    ],
  },
  {
    key: "instruments",
    icon: "🎹",
    title: "Enstrümanlar",
    desc: "Ana enstrümanları seçin",
    single: false,
    items: [
      { en: "baglama", tr: "🎸 Bağlama" },
      { en: "electric baglama", tr: "⚡ Elektro Bağlama" },
      { en: "ney flute", tr: "🎵 Ney" },
      { en: "kanun", tr: "🎹 Kanun" },
      { en: "kemenche", tr: "🎻 Kemençe" },
      { en: "tanbur", tr: "🎸 Tanbur" },
      { en: "darbuka", tr: "🪘 Darbuka" },
      { en: "bendir", tr: "🥁 Bendir" },
      { en: "davul", tr: "🥁 Davul" },
      { en: "zurna", tr: "🎺 Zurna" },
      { en: "kaval", tr: "🎵 Kaval" },
      { en: "cura", tr: "🎸 Cura" },
      { en: "oud", tr: "🎸 Ud" },
      { en: "acoustic guitar", tr: "🎸 Akustik Gitar" },
      { en: "electric guitar", tr: "⚡ Elektro Gitar" },
      { en: "bass guitar", tr: "🎸 Bas Gitar" },
      { en: "violin", tr: "🎻 Keman" },
      { en: "cello", tr: "🎻 Cello" },
      { en: "harp", tr: "🪇 Arp" },
      { en: "mandolin", tr: "🪕 Mandolin" },
      { en: "banjo", tr: "🪕 Banjo" },
      { en: "piano", tr: "🎹 Piyano" },
      { en: "electric piano", tr: "🎹 Elektrik Piyano" },
      { en: "synthesizer", tr: "🎹 Sentezleyici" },
      { en: "organ", tr: "🎹 Org" },
      { en: "rhodes piano", tr: "🎹 Rhodes Piyano" },
      { en: "drums", tr: "🥁 Bateri" },
      { en: "808 drums", tr: "🥁 808 Davul" },
      { en: "percussion", tr: "🥁 Perküsyon" },
      { en: "tabla", tr: "🪘 Tabla" },
      { en: "saxophone", tr: "🎷 Saksafon" },
      { en: "trumpet", tr: "🎺 Trompet" },
      { en: "trombone", tr: "🎺 Trombon" },
      { en: "flute", tr: "🎵 Flüt" },
      { en: "clarinet", tr: "🎵 Klarnet" },
      { en: "oboe", tr: "🎵 Obua" },
      { en: "harmonica", tr: "🎵 Mızıka" },
      { en: "vocoder", tr: "🎙️ Vocoder" },
      { en: "tulum", tr: "🪗 Tulum" },
      { en: "sipsi", tr: "🎵 Sipsi" },
      { en: "kabak kemane", tr: "🎻 Kabak Kemane" },
      { en: "cümbüş", tr: "🎸 Cümbüş" },
      { en: "mey", tr: "🎵 Mey" },
      { en: "balaban", tr: "🎵 Balaban" },
      { en: "kudüm", tr: "🥁 Kudüm" },
      { en: "tef", tr: "🥁 Tef" },
      { en: "zil", tr: "🔔 Zil" },
      { en: "kaşık", tr: "🥄 Kaşık" },
      { en: "çöğür", tr: "🎸 Çöğür" },
      { en: "divan sazı", tr: "🎸 Divan Sazı" },
      { en: "kopuz", tr: "🎸 Kopuz" },
      { en: "koltuk davulu", tr: "🥁 Koltuk Davulu" },
      { en: "dümbelek", tr: "🥁 Dümbelek" },
      { en: "santur", tr: "🎹 Santur" },
    ],
  },
  {
    key: "mood",
    icon: "🎭",
    title: "Mod & Atmosfer",
    desc: "Müziğin duygusal tonunu seçin",
    single: false,
    items: [
      { en: "happy", tr: "😊 Neşeli" },
      { en: "melancholic", tr: "😔 Melankolik" },
      { en: "atmospheric", tr: "🌫️ Atmosferik" },
      { en: "dark", tr: "🌑 Karanlık" },
      { en: "spiritual", tr: "✨ Ruhani" },
      { en: "aggressive", tr: "💥 Agresif" },
      { en: "rhythmic", tr: "🎵 Ritmik" },
      { en: "dreamy", tr: "🌙 Rüya Gibi" },
      { en: "energetic", tr: "⚡ Enerjik" },
      { en: "calming", tr: "🍃 Sakinleştirici" },
      { en: "emotional", tr: "❤️ Duygusal" },
      { en: "epic", tr: "🏔️ Epik" },
      { en: "intimate", tr: "🤗 Samimi" },
      { en: "nostalgic", tr: "📼 Nostaljik" },
      { en: "mysterious", tr: "🔮 Gizemli" },
      { en: "triumphant", tr: "🏆 Muzaffer" },
      { en: "creepy", tr: "👻 Ürkütücü" },
      { en: "playful", tr: "🎪 Oyuncu" },
      { en: "romantic", tr: "💕 Romantik" },
      { en: "chaotic", tr: "🌀 Kaotik" },
    ],
  },
  {
    key: "extra",
    icon: "🎚️",
    title: "Ek Stil İfadeleri",
    desc: "İsteğe bağlı stil nüansları",
    single: false,
    items: [
      { en: "with reverb", tr: "🌊 Reverb" },
      { en: "with echo", tr: "🔊 Echo" },
      { en: "lo-fi", tr: "📼 Lo-Fi" },
      { en: "vinyl crackle", tr: "🎛️ Plak Hışırtısı" },
      { en: "live performance", tr: "🎪 Canlı Performans" },
      { en: "cassette tape", tr: "📼 Kaset" },
      { en: "choir", tr: "👥 Koro" },
      { en: "808 bass", tr: "🔊 808 Bas" },
      { en: "bass drop", tr: "💥 Bass Drop" },
      { en: "synth arpeggios", tr: "🎹 Sentez Arpejleri" },
      { en: "build up and drop", tr: "📈 Build-Up & Drop" },
      { en: "groovy", tr: "🕺 Groovy" },
      { en: "upbeat", tr: "☀️ Upbeat" },
      { en: "minimal", tr: "⬜ Minimal" },
      { en: "orchestral strings", tr: "🎻 Orkestra Yaylılar" },
      { en: "music box", tr: "🎵 Müzik Kutusu" },
      { en: "bell sounds", tr: "🔔 Çan Sesleri" },
      { en: "water sounds", tr: "💧 Su Sesleri" },
      { en: "birdsong", tr: "🐦 Kuş Sesleri" },
      { en: "crowd cheering", tr: "🎉 Kalabalık" },
    ],
  },
];

const selected = {}; // key -> Set<en>

function renderCategories() {
  const wrap = document.getElementById("categories");
  CATEGORIES.forEach((cat) => {
    const box = document.createElement("div");
    box.className = "prompt-category";
    box.innerHTML = `
      <h4><span>${cat.icon}</span> ${cat.title}</h4>
      <div class="desc">${cat.desc}</div>
      <div class="chips" data-cat="${cat.key}">
        ${cat.items.map((it) => `<span class="chip" data-en="${it.en}">${it.tr}</span>`).join("")}
      </div>`;
    wrap.appendChild(box);

    if (!selected[cat.key]) selected[cat.key] = new Set();

    box.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const en = chip.dataset.en;
        if (cat.single) {
          box.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
          selected[cat.key].clear();
        }
        if (selected[cat.key].has(en)) {
          selected[cat.key].delete(en);
          chip.classList.remove("selected");
        } else {
          selected[cat.key].add(en);
          chip.classList.add("selected");
        }
        updatePrompt();
      });
    });
  });
}

function updatePrompt() {
  const out = document.getElementById("promptOutput");
  const parts = [];

  const genre = [...(selected["genre"] || [])].join(", ");
  const vocal = [...(selected["vocal"] || [])];
  const mood = [...(selected["mood"] || [])];
  const inst = [...(selected["instruments"] || [])];
  const extra = [...(selected["extra"] || [])];

  if (genre) parts.push(genre);
  if (vocal.length) parts.push(...vocal);
  if (mood.length) parts.push(...mood);
  if (inst.length) parts.push(`featuring ${inst.join(", ")}`);
  if (extra.length) parts.push(...extra);

  if (document.getElementById("optInstrumental").checked) {
    parts.push("instrumental only, no vocals");
  }
  if (document.getElementById("optEffects").checked) {
    parts.push("with vocal effects, reverb and echo");
  }

  const tempo = parseInt(document.getElementById("tempoRange").value, 10);
  if (tempo > 0) parts.push(`~${tempo} BPM`);

  const words = document.getElementById("optWords").value.trim();
  if (words) parts.push(`featuring lyrics about: ${words}`);

  const negative = document.getElementById("optNegative").value.trim();
  let promptText = parts.filter(Boolean).join(", ");

  if (negative) promptText += `\n[Avoid: ${negative}]`;

  if (!promptText.trim()) {
    out.textContent = "Yukarıdaki kategorilerden seçim yaparak prompt'unuzu oluşturun...";
    out.classList.add("placeholder");
  } else {
    out.textContent = promptText;
    out.classList.remove("placeholder");
  }
  return promptText;
}

function resetAll() {
  Object.keys(selected).forEach((k) => selected[k].clear());
  document.querySelectorAll(".chip.selected").forEach((c) => c.classList.remove("selected"));
  document.getElementById("optInstrumental").checked = false;
  document.getElementById("optEffects").checked = false;
  document.getElementById("optWords").value = "";
  document.getElementById("optNegative").value = "";
  document.getElementById("tempoRange").value = 120;
  document.getElementById("tempoVal").textContent = "Orta (120 BPM)";
  updatePrompt();
}

function randomSong() {
  resetAll();
  const pick = (key) => {
    const list = CATEGORIES.find((c) => c.key === key).items;
    const n = 1 + Math.floor(Math.random() * Math.min(3, list.length));
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    shuffled.slice(0, n).forEach((it) => {
      selected[key].add(it.en);
    });
  };
  pick("genre");
  pick("mood");
  pick("instruments");
  if (Math.random() > 0.3) pick("vocal");
  if (Math.random() > 0.5) pick("extra");
  if (Math.random() > 0.65) pick("makam");
  document.getElementById("tempoRange").value = 60 + Math.floor(Math.random() * 141);
  document.getElementById("tempoVal").textContent = `${document.getElementById("tempoRange").value} BPM`;
  document.getElementById("songTitleInput").value = randomSongTitle();
  document.querySelectorAll(".chip").forEach((chip) => {
    const cat = chip.closest(".chips").dataset.cat;
    if (selected[cat] && selected[cat].has(chip.dataset.en)) chip.classList.add("selected");
  });
  updatePrompt();
  toast("Rastgele şarkı promptu oluşturuldu! 🎲", "success");
}

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();

  const catWrap = document.getElementById("categories");

  const tempoBox = document.createElement("div");
  tempoBox.className = "prompt-category";
  tempoBox.innerHTML = `
    <h4><span>⚡</span> Tempo</h4>
    <div class="desc">Müziğinizin hızını ayarlayın</div>
    <input type="range" id="tempoRange" min="60" max="200" step="1" value="120" />
    <div class="range-labels"><span>60 BPM</span><span>120 BPM</span><span>200 BPM</span></div>
    <div class="tempo-value" id="tempoVal">Orta (120 BPM)</div>`;
  catWrap.appendChild(tempoBox);

  document.getElementById("tempoRange").addEventListener("input", (e) => {
    const v = parseInt(e.target.value, 10);
    document.getElementById("tempoVal").textContent = v === 120 ? "Orta (120 BPM)" : `${v} BPM`;
    updatePrompt();
  });

  ["optInstrumental", "optEffects"].forEach((id) => {
    document.getElementById(id).addEventListener("change", updatePrompt);
  });
  ["optWords", "optNegative"].forEach((id) => {
    document.getElementById(id).addEventListener("input", updatePrompt);
  });

  document.getElementById("copyBtn").addEventListener("click", () => {
    const t = updatePrompt();
    if (!t.trim()) return toast("Önce seçim yapın", "warning");
    navigator.clipboard.writeText(t).then(() => toast("Prompt kopyalandı! 📋", "success"));
  });

  document.getElementById("useBtn").addEventListener("click", () => {
    const t = updatePrompt();
    if (!t.trim()) return toast("Önce seçim yapın", "warning");
    sessionStorage.setItem("draftPrompt", t);
    const title = document.getElementById("songTitleInput").value.trim() || randomSongTitle();
    sessionStorage.setItem("draftSongName", title);
    if (document.getElementById("optAutoLyrics").checked) {
      sessionStorage.setItem("draftLyrics", generateLyrics(t, title));
    }
    const instrumental = document.getElementById("optInstrumental").checked;
    if (instrumental) sessionStorage.setItem("draftInstrumental", "1");
    location.href = "index.html";
  });

  document.getElementById("clearBtn").addEventListener("click", resetAll);
  document.getElementById("randomBtn").addEventListener("click", randomSong);

  const saved = sessionStorage.getItem("draftPrompt");
  if (saved) {
    // Gelen promptu göster
    const out = document.getElementById("promptOutput");
    out.textContent = saved;
    out.classList.remove("placeholder");
    toast("Müzik Oluştur'dan gelen prompt yüklendi", "info");
    sessionStorage.removeItem("draftPrompt");
  }
});
