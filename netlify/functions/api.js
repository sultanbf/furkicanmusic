/* ── AI Music Studio Netlify Function ─────────────────
 * /api/suno/create, /api/suno/status, /api/suno/callback,
 * /api/n8n yollarını server.js'deki proxy ile aynı mantıkla işler.
 */
const { PROVIDER, CORS } = require("./_shared");

function send(statusCode, body, extra = {}) {
  return {
    statusCode,
    headers: { ...CORS, "Content-Type": "application/json", ...extra },
    body: typeof body === "string" ? body : JSON.stringify(body),
  };
}

async function createTask(body) {
  const { apiType, apiKey, baseUrl, ...rest } = body || {};
  const p = PROVIDER[apiType] || PROVIDER.sunor;
  if (!rest.callBackUrl) {
    rest.callBackUrl = `${process.env.URL || "https://localhost"}/api/suno/callback`;
  }
  const apiReq = p.create(baseUrl || process.env.SUNO_BASE_URL, apiKey || process.env.SUNO_API_KEY, rest);

  const r = await fetch(apiReq.url, { method: "POST", headers: apiReq.headers, body: JSON.stringify(apiReq.body) });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    return { statusCode: r.status, json: { error: json.message || json.msg || `HTTP ${r.status}` } };
  }
  if (json.code !== undefined && json.code !== 200) {
    return { statusCode: 400, json: { error: json.msg || json.message || `API hatası (code: ${json.code})`, code: json.code } };
  }
  const taskId = p.taskId(json);
  if (!taskId) return { statusCode: 502, json: { error: "Görev ID çözümlenemedi", raw: json } };
  return { statusCode: 200, json: { taskId, raw: json } };
}

async function taskStatus(query) {
  const { taskId, apiType, baseUrl, apiKey } = query || {};
  const p = PROVIDER[apiType] || PROVIDER.sunor;
  const url = p.statusUrl(baseUrl || process.env.SUNO_BASE_URL, taskId);

  const headers = {};
  const key = apiKey || process.env.SUNO_API_KEY;
  if (key) {
    headers["x-api-key"] = key;
    headers.Authorization = `Bearer ${key}`;
    if (apiType === "gcui") headers.Cookie = key;
  }

  const r = await fetch(url, { headers });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) return { statusCode: r.status, json: { error: json.message || `HTTP ${r.status}` } };
  return { statusCode: 200, json: { data: p.parse(json) } };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return send(200, {});

  const path = (event.path || "").replace(/\/+$/, "");
  const qs = event.queryStringParameters || {};

  try {
    if (path.endsWith("/api/suno/create")) {
      const { statusCode, json } = await createTask(JSON.parse(event.body || "{}"));
      return send(statusCode, json);
    }
    if (path.endsWith("/api/suno/status")) {
      const { statusCode, json } = await taskStatus(qs);
      return send(statusCode, json);
    }
    if (path.endsWith("/api/suno/callback")) {
      return send(200, { status: "received" });
    }
    if (path.endsWith("/api/n8n")) {
      const body = JSON.parse(event.body || "{}");
      const target = String(body._webhookUrl || "").trim();
      if (!target) return send(400, { error: "_webhookUrl gerekli" });

      const { _webhookUrl, ...payload } = body;
      const r = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        redirect: "follow",
      });

      const ct = r.headers.get("content-type") || "";
      if (ct.includes("json")) {
        const json = await r.json().catch(() => ({}));
        return send(r.status, json);
      }
      const buf = Buffer.from(await r.arrayBuffer());
      return {
        statusCode: r.status,
        headers: { ...CORS, "Content-Type": ct || "application/octet-stream", "Content-Disposition": 'attachment; filename="result.mp4"' },
        body: buf.toString("base64"),
        isBase64Encoded: true,
      };
    }
    return send(404, { error: "Bilinmeyen API yolu: " + path });
  } catch (e) {
    return send(500, { error: e.message });
  }
};
