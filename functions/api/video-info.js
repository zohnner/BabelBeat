// GET /api/video-info?url=<youtube url>  (or ?videoId=<id>)
// Proxies YouTube's oEmbed endpoint (which blocks browser CORS) and takes a
// best guess at "artist" / "track" from the video title so the frontend can
// kick off a lyrics search automatically.

export async function onRequestGet({ request }) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const videoId = searchParams.get("videoId");

  let targetUrl;
  if (videoId) {
    targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  } else if (url) {
    targetUrl = url;
  } else {
    return json({ error: "Missing url or videoId parameter" }, 400);
  }

  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;

  try {
    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "BabelBeat/1.0 (+https://babelbeat.pages.dev)" },
    });

    if (!res.ok) {
      return json({ error: "Video not found or unavailable" }, res.status === 404 ? 404 : 502);
    }

    const data = await res.json();
    const { track, artist } = guessTrackArtist(data.title, data.author_name);

    return json({
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url,
      guessedTrack: track,
      guessedArtist: artist,
    });
  } catch (err) {
    return json({ error: "Failed to fetch video info" }, 502);
  }
}

function guessTrackArtist(title, author) {
  let clean = (title || "")
    // Strip any parenthesized/bracketed qualifier entirely — video titles
    // pack all kinds of tags in there (Official Video, Video Oficial, 4K
    // Remaster, Lyrics, HD, Audio, Clean, etc.) and none of them belong in
    // a lyrics search.
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/official (music )?video/gi, "")
    .replace(/(v[ií]deo|audio) oficial/gi, "")
    .replace(/lyrics?( video)?/gi, "")
    .replace(/letra/gi, "")
    .replace(/visualizer/gi, "");

  // Uploaders often tack extra metadata after a "|" or "•" separator —
  // usually the album name or promo text, e.g. "Artist - Track | Album
  // Name". That trailing chunk isn't part of the song title and corrupts
  // the lyrics search query, so keep only what's before the first one.
  clean = clean.split(/[|•]/)[0];

  clean = clean.replace(/\s{2,}/g, " ").trim();

  const dashSplit = clean.split(/\s[-–—]\s/);
  if (dashSplit.length >= 2) {
    return {
      artist: dashSplit[0].trim(),
      track: dashSplit.slice(1).join(" - ").trim(),
    };
  }

  const artist = (author || "").replace(/\s*-\s*Topic$/i, "").trim();
  return { artist, track: clean };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
