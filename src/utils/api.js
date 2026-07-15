// Thin client for BabelBeat's own Cloudflare Pages Functions (see
// /functions/api/*). Keeping these calls same-origin sidesteps CORS
// restrictions on YouTube's oEmbed endpoint and lets us proxy lrclib.net /
// MyMemory from one place.

async function handleJson(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchVideoInfo(videoId) {
  const res = await fetch(`/api/video-info?videoId=${encodeURIComponent(videoId)}`);
  return handleJson(res);
}

export async function searchLyrics(track, artist) {
  const params = new URLSearchParams({ track });
  if (artist) params.set("artist", artist);
  const res = await fetch(`/api/lyrics-search?${params.toString()}`);
  return handleJson(res);
}

export async function translateLines(lines, target, source = "en") {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines, target, source }),
  });
  return handleJson(res);
}
