// Thin client for BabelBeat's own Cloudflare Pages Functions (see
// /functions/api/*). Keeping these calls same-origin sidesteps CORS
// restrictions on YouTube's oEmbed endpoint / thumbnail CDN and lets us
// proxy lrclib.net / Google Translate from one place.

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

// source defaults to "auto" so we never assume a song's lyrics are in any
// particular language — Google detects it from the text itself.
export async function translateLines(lines, target, source = "auto", { romanize = false } = {}) {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines, target, source, romanize }),
  });
  return handleJson(res);
}

// Detects what language a snippet of text is written in (used to figure out
// a song's actual source language, e.g. so a Spanish-language song isn't
// silently assumed to be English).
export async function detectLanguage(text) {
  const res = await fetch(`/api/detect-language?text=${encodeURIComponent(text)}`);
  return handleJson(res);
}

// Builds a same-origin URL for a YouTube thumbnail so it can be drawn to a
// <canvas> without tainting it (YouTube's CDN sends no CORS headers).
export function thumbnailProxyUrl(thumbnailUrl) {
  if (!thumbnailUrl) return null;
  return `/api/thumbnail-proxy?url=${encodeURIComponent(thumbnailUrl)}`;
}
