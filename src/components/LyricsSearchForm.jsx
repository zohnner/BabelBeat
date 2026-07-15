import { useState } from "react";

/**
 * Manual lyrics search: track/artist inputs plus a candidate list to pick
 * from. Shown automatically when the auto-search (from the video title)
 * comes up empty, or on demand if the user wants to correct a bad match.
 */
export default function LyricsSearchForm({
  initialTrack,
  initialArtist,
  candidates,
  selectedId,
  loading,
  error,
  onSearch,
  onSelect,
}) {
  const [track, setTrack] = useState(initialTrack || "");
  const [artist, setArtist] = useState(initialArtist || "");

  function handleSubmit(e) {
    e.preventDefault();
    if (!track.trim()) return;
    onSearch(track.trim(), artist.trim());
  }

  return (
    <div className="lyrics-search">
      <form className="lyrics-search__form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          placeholder="Song title"
        />
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist (optional)"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search lyrics"}
        </button>
      </form>

      {error && <p className="lyrics-search__error">{error}</p>}

      {candidates && candidates.length > 0 && (
        <ul className="lyrics-search__results">
          {candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`lyrics-search__result${c.id === selectedId ? " lyrics-search__result--active" : ""}`}
                onClick={() => onSelect(c)}
              >
                <span className="lyrics-search__result-title">
                  {c.trackName} — {c.artistName}
                </span>
                <span className="lyrics-search__result-meta">
                  {c.albumName ? `${c.albumName} · ` : ""}
                  {c.synced ? "synced" : "plain text"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {candidates && candidates.length === 0 && !loading && (
        <p className="lyrics-search__empty">
          No lyrics found. Try adjusting the title or artist above.
        </p>
      )}
    </div>
  );
}
