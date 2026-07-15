import { useEffect, useRef } from "react";

// Loads the YouTube IFrame API once and resolves when it's ready.
let apiPromise = null;
function loadYouTubeApi() {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevCallback === "function") prevCallback();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });

  return apiPromise;
}

/**
 * Renders a YouTube player and reports playback time back up via onTimeUpdate.
 * videoId: the 11-char YouTube video ID to load.
 * onTimeUpdate(seconds): called ~4x/sec while playing.
 * onReady(player): called once the underlying YT.Player is ready.
 */
export default function YouTubePlayer({ videoId, onTimeUpdate, onReady }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0 },
        events: {
          onReady: () => {
            onReady?.(playerRef.current);
          },
          onStateChange: (event) => {
            const isPlaying = event.data === YT.PlayerState.PLAYING;
            if (isPlaying && !pollRef.current) {
              pollRef.current = setInterval(() => {
                if (playerRef.current?.getCurrentTime) {
                  onTimeUpdate?.(playerRef.current.getCurrentTime());
                }
              }, 250);
            } else if (!isPlaying && pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return <div className="youtube-player" ref={containerRef} />;
}
