// GET /api/detect-language?text=<sample>
// Figures out what language a snippet of lyrics is actually written in, by
// piggybacking on Google Translate's sl=auto detection (the same endpoint
// /api/translate uses). We translate to English purely as a vehicle for the
// detection — the translation itself is discarded, only the detected source
// language code (data[2] in Google's response) is returned.

export async function onRequestGet({ request }) {
  const { searchParams } = new URL(request.url);
  const text = (searchParams.get("text") || "").slice(0, 500);

  if (!text.trim()) {
    return json({ error: "Missing text parameter" }, 400);
  }

  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: "en",
    dt: "t",
    q: text,
  });

  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`, {
      headers: { "User-Agent": "Mozilla/5.0 (BabelBeat/1.0; +https://babelbeat.pages.dev)" },
    });
    if (!res.ok) return json({ error: "Detection failed" }, 502);

    const data = await res.json();
    // data[2] holds the auto-detected source language code, e.g. "es".
    const language = typeof data?.[2] === "string" ? data[2] : null;
    if (!language) return json({ error: "Could not detect language" }, 502);

    return json({ language });
  } catch {
    return json({ error: "Detection failed" }, 502);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
