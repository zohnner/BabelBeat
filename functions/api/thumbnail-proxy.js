// GET /api/thumbnail-proxy?url=<youtube thumbnail url>
// Re-serves a YouTube thumbnail image same-origin so the frontend can read
// its pixels on a <canvas> for per-song color theming — YouTube's CDN
// doesn't send CORS headers, so a direct <img crossorigin> load taints the
// canvas and blocks getImageData. Restricted to YouTube's own image hosts
// so this can't be used as an open image proxy.

const ALLOWED_HOSTS = new Set([
  "i.ytimg.com",
  "img.youtube.com",
]);

export async function onRequestGet({ request }) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new Response("Missing url parameter", { status: 400 });

  let target;
  try {
    target = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return new Response("Host not allowed", { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: { "User-Agent": "BabelBeat/1.0 (+https://babelbeat.pages.dev)" },
    });

    if (!res.ok) {
      return new Response("Failed to fetch thumbnail", { status: 502 });
    }

    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Failed to fetch thumbnail", { status: 502 });
  }
}
