// POST /api/translate  { lines: string[], target: "es", source?: "en" }
// Proxies Google Translate's public (unofficial, key-free) endpoint —
// the same one used by countless browser extensions and CLI tools — so
// the frontend never has to talk to a third-party API directly.
//
// We started on MyMemory's free API, but its anonymous quota is tracked
// per IP, and Cloudflare Workers share egress IPs across every project on
// the platform — so unrelated traffic exhausted our daily limit almost
// immediately. Google's `translate_a/single` endpoint has no such shared
// per-IP bottleneck at our volume and needs no account, key, or email.

const CONCURRENCY = 8;
const MAX_CHARS_PER_LINE = 1800;

export async function onRequestPost({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { lines, target, source = "en" } = body || {};

  if (!Array.isArray(lines) || lines.length === 0) {
    return json({ error: "Missing lines array" }, 400);
  }
  if (!target || typeof target !== "string") {
    return json({ error: "Missing target language" }, 400);
  }

  try {
    const results = await translateInBatches(lines, source, target);
    const translations = results.map((r) => r.text);
    const anyFailed = results.some((r) => !r.ok);

    return json({
      translations,
      warning: anyFailed ? "Some lines could not be translated." : undefined,
    });
  } catch (err) {
    return json({ error: "Translation failed" }, 502);
  }
}

async function translateInBatches(lines, source, target) {
  const results = new Array(lines.length);
  let cursor = 0;

  async function worker() {
    while (cursor < lines.length) {
      const i = cursor++;
      results[i] = await translateLine(lines[i], source, target);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, lines.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function translateLine(text, source, target) {
  if (!text || !text.trim()) return { text: "", ok: true };

  const params = new URLSearchParams({
    client: "gtx",
    sl: source,
    tl: target,
    dt: "t",
    q: text.slice(0, MAX_CHARS_PER_LINE),
  });

  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, {
      headers: { "User-Agent": "Mozilla/5.0 (BabelBeat/1.0; +https://babelbeat.pages.dev)" },
    });
    if (!res.ok) return { text, ok: false };

    const data = await res.json();
    // Response shape: [[[translatedChunk, originalChunk, ...], ...], ...]
    const segments = Array.isArray(data?.[0]) ? data[0] : null;
    const translated = segments?.map((seg) => seg?.[0] ?? "").join("");

    if (!translated) return { text, ok: false };
    return { text: translated, ok: true };
  } catch {
    return { text, ok: false };
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
