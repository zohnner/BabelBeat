import { useEffect, useRef } from "react";
import { supportedLanguages, originalLanguageOption, isRomanizable } from "../data/languages";

/**
 * Displays the lyric line list, highlighting whichever line is active for
 * synced songs (with a word-by-word karaoke wipe), showing a translated +
 * optional romanized line underneath, and letting the user click a line to
 * seek the video or share it as an image card.
 */
export default function LyricsPanel({
  song,
  currentTime,
  language,
  onLanguageChange,
  translatedLines,
  translationLoading,
  translationError,
  romanizations,
  showPronunciation,
  onTogglePronunciation,
  onSeek,
  onShareLine,
}) {
  const listRef = useRef(null);
  const activeLineRef = useRef(null);

  const activeIndex = song.synced ? getActiveLineIndex(song.lines, currentTime) : -1;
  const activeProgress =
    activeIndex >= 0 ? getLineProgress(song.lines, activeIndex, currentTime) : 0;

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex]);

  const canRomanize = isRomanizable(language);

  return (
    <div className="lyrics-panel">
      <div className="lyrics-panel__header">
        <div>
          <h2>{song.title}</h2>
          <p className="lyrics-panel__artist">{song.artist}</p>
          {!song.synced && <span className="lyrics-panel__unsynced-note">not time-synced</span>}
        </div>
        <div className="lyrics-panel__toolbar">
          {canRomanize && (
            <button
              type="button"
              className={`lyrics-panel__pronounce-toggle${showPronunciation ? " lyrics-panel__pronounce-toggle--on" : ""}`}
              onClick={onTogglePronunciation}
            >
              Aa Pronunciation
            </button>
          )}
          <label className="lyrics-panel__lang-select">
            Translate to
            <select value={language} onChange={(e) => onLanguageChange(e.target.value)}>
              <option value={originalLanguageOption.code}>{originalLanguageOption.label}</option>
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {translationError && (
        <p className="lyrics-panel__translation-error">
          <span>⚠</span> {translationError}
        </p>
      )}

      <div className="lyrics-panel__list" ref={listRef}>
        {song.lines.map((line, index) => {
          const isActive = index === activeIndex;
          const translated =
            language !== originalLanguageOption.code ? translatedLines?.[index] : null;
          const romanized =
            showPronunciation && language !== originalLanguageOption.code
              ? romanizations?.[index]
              : null;
          const clickable = line.start !== null;

          return (
            <div
              key={`${line.start ?? "x"}-${index}`}
              ref={isActive ? activeLineRef : null}
              className={`lyrics-line${isActive ? " lyrics-line--active" : ""}${clickable ? " lyrics-line--clickable" : ""}`}
              onClick={clickable ? () => onSeek?.(line.start) : undefined}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
            >
              <p className="lyrics-line__original">
                {isActive ? renderKaraokeWords(line.text, activeProgress) : line.text}
              </p>
              {language !== originalLanguageOption.code && (
                <p className="lyrics-line__translated">
                  {translated ?? (translationLoading ? "…" : "")}
                </p>
              )}
              {romanized && <p className="lyrics-line__romanized">{romanized}</p>}

              <button
                type="button"
                className="lyrics-line__share"
                title="Share this line"
                aria-label="Share this line"
                onClick={(e) => {
                  e.stopPropagation();
                  onShareLine?.({ line, translated, romanized });
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8.7 10.7 15.3 7M8.7 13.3l6.6 3.7M18 5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm0 14a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM9 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getActiveLineIndex(lines, currentTime) {
  let active = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].start !== null && lines[i].start <= currentTime) {
      active = i;
    } else if (lines[i].start !== null) {
      break;
    }
  }
  return active;
}

// Estimates 0..1 progress through the active line using the next synced
// line's start time as the window end (lrclib only gives us line-level
// timestamps, so word-level position is an interpolated approximation).
function getLineProgress(lines, activeIndex, currentTime) {
  const line = lines[activeIndex];
  if (line.start === null) return 0;

  const next = lines.slice(activeIndex + 1).find((l) => l.start !== null);
  const end = next ? next.start : line.start + 4;
  const span = Math.max(end - line.start, 0.4);

  return Math.min(1, Math.max(0, (currentTime - line.start) / span));
}

function renderKaraokeWords(text, progress) {
  const tokens = text.split(/(\s+)/); // keep whitespace as its own tokens
  const totalChars = tokens.reduce((sum, t) => sum + (t.trim() ? t.length : 0), 0) || 1;

  let charsSeen = 0;
  return tokens.map((token, i) => {
    if (!token.trim()) return token; // whitespace, render as-is

    const startFrac = charsSeen / totalChars;
    charsSeen += token.length;
    const endFrac = charsSeen / totalChars;
    const sung = progress >= startFrac;
    const current = progress >= startFrac && progress < endFrac;

    return (
      <span
        key={i}
        className={`lyrics-line__word${sung ? " lyrics-line__word--sung" : ""}${current ? " lyrics-line__word--current" : ""}`}
      >
        {token}
      </span>
    );
  });
}
