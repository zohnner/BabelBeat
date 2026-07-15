// Small helper for pulling a YouTube video ID out of the various URL formats
// people paste in (watch?v=, youtu.be/, embed/, or a bare ID).

export function extractVideoId(input) {
  if (!input) return null;
  const trimmed = input.trim();

  // Already looks like a bare 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1) || null;
    }

    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/embed/")[1];
      }
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/shorts/")[1];
      }
    }
  } catch {
    // Not a valid URL — fall through to null
  }

  return null;
}
