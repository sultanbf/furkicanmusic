/* ── Suno API sağlayıcı tanımları ──────────────────────
 * Netlify Functions ortak modülü.
 * NOT: server/server.js içindeki PROVIDER ile senkron tutun.
 */
const PROVIDER = {
  sunoapi: {
    create: (base, key, body) => {
      const b = base.replace(/\/$/, "");
      const url = b.endsWith("/api/v1") ? `${b}/generate` : `${b}/api/v1/generate`;
      const lyrics = body.lyrics || (body.prompt && body.prompt.length > 500 ? body.prompt : "");
      const customMode = !!lyrics;
      return {
        url,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: {
          prompt: lyrics || body.prompt || "",
          style: customMode ? body.style : "",
          title: customMode ? (body.title || body.songTitle || "") : "",
          customMode,
          instrumental: !!body.instrumental,
          model: body.model || "V4_5",
          callBackUrl: body.callBackUrl || undefined,
        },
      };
    },
    taskId: (d) => d?.data?.taskId || d?.data?.id || d?.taskId,
    statusUrl: (base, id) => {
      const b = base.replace(/\/$/, "");
      return b.endsWith("/api/v1")
        ? `${b}/generate/record-info?taskId=${id}`
        : `${b}/api/v1/generate/record-info?taskId=${id}`;
    },
    parse: (d) => {
      const resp = d?.data?.response || d?.response || {};
      const arr = Array.isArray(resp.data) ? resp.data : resp.sunoData || [];
      const tracks = arr.map((t) => ({
        id: t.id,
        audio_url: t.audio_url || t.audioUrl,
        image_url: t.image_url || t.imageUrl,
        title: t.title,
        tags: t.tags,
        duration: t.duration,
      }));
      return {
        status: d?.data?.status || d?.status,
        errorMessage: d?.data?.errorMessage || d?.errorMessage || d?.data?.msg || d?.msg,
        tracks,
        audio_url: tracks[0]?.audio_url,
        image_url: tracks[0]?.image_url,
        title: tracks[0]?.title,
        tags: tracks[0]?.tags,
      };
    },
  },
  sunor: {
    create: (base, key, body) => ({
      url: `${base.replace(/\/$/, "")}/task`,
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: {
        model: "suno",
        task_type: "music",
        input: {
          gpt_description_prompt: body.prompt,
          make_instrumental: !!body.instrumental,
          title: body.title,
          tags: body.style,
          custom_mode: !!body.lyrics,
          model_version: body.model || undefined,
          vocal_gender: body.vocalGender === "kadin" ? "f" : body.vocalGender === "erkek" ? "m" : undefined,
        },
      },
    }),
    taskId: (d) => d?.data?.taskId || d?.data?.task_id || d?.data?.id || d?.taskId || d?.id,
    statusUrl: (base, id) => `${base.replace(/\/$/, "")}/task/${id}`,
    parse: (d) => d?.data || d,
  },
  songapi: {
    create: (base, key, body) => ({
      url: `${base.replace(/\/$/, "")}/generate`,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: {
        prompt: body.prompt,
        title: body.title,
        style: body.style,
        lyrics: body.lyrics || undefined,
        instrumental: !!body.instrumental,
        model: body.model || undefined,
      },
    }),
    taskId: (d) => d?.data?.id || d?.id,
    statusUrl: (base, id) => `${base.replace(/\/$/, "")}/generate/${id}`,
    parse: (d) => d?.data || d,
  },
  apiframe: {
    create: (base, key, body) => ({
      url: `${base.replace(/\/$/, "")}/music/generate`,
      headers: { "Content-Type": "application/json", "X-API-Key": key },
      body: {
        prompt: body.prompt,
        model: "suno",
        sunoParams: {
          custom_mode: !!body.lyrics,
          instrumental: !!body.instrumental,
          model_version: body.model || undefined,
          title: body.title,
          style: body.style,
        },
      },
    }),
    taskId: (d) => d?.id || d?.jobId,
    statusUrl: (base, id) => `${base.replace(/\/$/, "")}/jobs/${id}`,
    parse: (d) => d,
  },
  gcui: {
    create: (base, key, body) => ({
      url: `${base.replace(/\/$/, "")}/api/custom_generate`,
      headers: { "Content-Type": "application/json", ...(key ? { Cookie: key } : {}) },
      body: {
        prompt: body.lyrics || body.prompt,
        style: body.style,
        title: body.title,
        instrumental: !!body.instrumental,
        model: body.model || undefined,
      },
    }),
    taskId: (d) => (Array.isArray(d) ? d[0]?.id : d?.id),
    statusUrl: (base, id) => `${base.replace(/\/$/, "")}/api/get?ids=${id}`,
    parse: (d) => (Array.isArray(d) ? d[0] : d),
  },
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

module.exports = { PROVIDER, CORS };
