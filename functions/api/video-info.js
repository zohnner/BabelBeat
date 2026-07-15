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
  const clean = (title || "")
    .replace(/\(official.*?\)/gi, "")
    .replace(/\[official.*?\]/gi, "")
    .replace(/\(lyrics?.*?\)/gi, "")
    .replace(/\[lyrics?.*?\]/gi, "")
    .replace(/\(audio\)/gi, "")
    .replace(/\(music video\)/gi, "")
    .replace(/official (music )?video/gi, "")
    .replace(/lyrics?( video)?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

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
