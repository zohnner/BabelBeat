import { useEffect, useRef } from "react";
import { supportedLanguages, originalLanguageOption } from "../data/languages";

/**
 * Displays the lyric line list, highlighting whichever line is active for
 * synced songs, showing a translated line underneath once one is available.
 */
export default function LyricsPanel({
  song,
  currentTime,
  language,
  onLanguageChange,
  translatedLines,
  translationLoading,
  translationError,
}) {
  const listRef = useRef(null);
  const activeLineRef = useRef(null);

  const activeIndex = song.synced ? getActiveLineIndex(song.lines, currentTime) : -1;

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex]);

  return (
    <div className="lyrics-panel">
      <div className="lyrics-panel__header">
        <div>
          <h2>{song.title}</h2>
          <p className="lyrics-panel__artist">{song.artist}</p>
          {!song.synced && <span className="lyrics-panel__unsynced-note">not time-synced</span>}
        </div>
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

          return (
            <div
              key={`${line.start ?? "x"}-${index}`}
              ref={isActive ? activeLineRef : null}
              className={`lyrics-line${isActive ? " lyrics-line--active" : ""}`}
            >
              <p className="lyrics-line__original">{line.text}</p>
              {language !== originalLanguageOption.code && (
                <p className="lyrics-line__translated">
                  {translated ?? (translationLoading ? "…" : "")}
                </p>
              )}
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
