// POST /api/translate  { lines: string[], target: "es", source?: "en" }
// Proxies MyMemory's translation API line-by-line (small parallel batches)
// so the frontend never has to talk to a third-party API directly.
//
// GET /api/translate?q=<text>&target=<lang>  — debug helper, returns the
// raw MyMemory response so translation issues are easy to diagnose from
// outside the Worker sandbox.

const CONCURRENCY = 8;
const MAX_CHARS_PER_LINE = 480; // MyMemory's anonymous-tier request limit is ~500 bytes

export async function onRequestGet({ request }) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const target = searchParams.get("target") || "es";
  if (!q) return json({ error: "Missing q parameter" }, 400);

  const params = new URLSearchParams({ q, langpair: `en|${target}` });
  const upstreamUrl = `https://api.mymemory.translated.net/get?${params.toString()}`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: { "User-Agent": "BabelBeat/1.0 (+https://babelbeat.pages.dev)" },
    });
    const text = await res.text();
    return json({ upstreamStatus: res.status, upstreamOk: res.ok, upstreamBody: text.slice(0, 1000) });
  } catch (err) {
    return json({ error: "fetch threw", message: String(err), stack: err?.stack });
  }
}

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

  const langpair = `${source}|${target}`;

  try {
    const translations = await translateInBatches(lines, langpair);
    return json({ translations });
  } catch (err) {
    return json({ error: "Translation failed" }, 502);
  }
}

async function translateInBatches(lines, langpair) {
  const results = new Array(lines.length);
  let cursor = 0;

  async function worker() {
    while (cursor < lines.length) {
      const i = cursor++;
      results[i] = await translateLine(lines[i], langpair);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, lines.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function translateLine(text, langpair) {
  if (!text || !text.trim()) return "";

  const params = new URLSearchParams({
    q: text.slice(0, MAX_CHARS_PER_LINE),
    langpair,
  });

  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
      headers: { "User-Agent": "BabelBeat/1.0 (+https://babelbeat.pages.dev)" },
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
