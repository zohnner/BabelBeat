// GET /api/lyrics-search?track=<name>&artist=<name>
// Proxies lrclib.net's search endpoint and parses each candidate's LRC
// (synced) or plain lyrics into a line array the frontend can render/sync
// against video playback time directly.

export async function onRequestGet({ request }) {
  const { searchParams } = new URL(request.url);
  const track = searchParams.get("track");
  const artist = searchParams.get("artist");

  if (!track || !track.trim()) {
    return json({ error: "Missing track parameter" }, 400);
  }

  const params = new URLSearchParams({ track_name: track.trim() });
  if (artist && artist.trim()) {
    params.set("artist_name", artist.trim());
  }

  try {
    const res = await fetch(`https://lrclib.net/api/search?${params.toString()}`, {
      headers: { "User-Agent": "BabelBeat/1.0 (+https://babelbeat.pages.dev)" },
    });

    if (!res.ok) {
      return json({ error: "Lyrics search failed" }, 502);
    }

    const results = await res.json();

    const candidates = (Array.isArray(results) ? results : [])
      .filter((r) => r.syncedLyrics || r.plainLyrics)
      .slice(0, 8)
      .map((r) => ({
        id: r.id,
        trackName: r.trackName,
        artistName: r.artistName,
        albumName: r.albumName,
        duration: r.duration,
        synced: Boolean(r.syncedLyrics),
        lines: r.syncedLyrics
          ? parseSyncedLyrics(r.syncedLyrics)
          : parsePlainLyrics(r.plainLyrics),
      }))
      // Prefer synced results first, then longer (more complete) lyric sets.
      .sort((a, b) => Number(b.synced) - Number(a.synced) || b.lines.length - a.lines.length);

    return json({ candidates });
  } catch (err) {
    return json({ error: "Failed to search lyrics" }, 502);
  }
}

function parseSyncedLyrics(raw) {
  const lineRe = /^\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/;
  return raw
    .split("\n")
    .map((line) => {
      const match = line.trim().match(lineRe);
      if (!match) return null;
      const [, mm, ss, frac = "0", text] = match;
      const fracSeconds = Number(`0.${frac}`);
      const start = Number(mm) * 60 + Number(ss) + fracSeconds;
      return { start, text: text.trim() };
    })
    .filter((l) => l && l.text.length > 0);
}

function parsePlainLyrics(raw) {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ start: null, text }));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
