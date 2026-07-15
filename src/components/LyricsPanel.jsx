import { supportedLanguages } from "../data/mockLyrics";

/**
 * Displays the synced lyric line (original + translation) and lets the
 * user pick a target language. Also renders the full scrolling lyric list
 * with the active line highlighted.
 */
export default function LyricsPanel({
  song,
  currentTime,
  language,
  onLanguageChange,
}) {
  const activeIndex = getActiveLineIndex(song.lines, currentTime);

  return (
    <div className="lyrics-panel">
      <div className="lyrics-panel__header">
        <div>
          <h2>{song.title}</h2>
          <p className="lyrics-panel__artist">{song.artist}</p>
        </div>
        <label className="lyrics-panel__lang-select">
          Translate to
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="lyrics-panel__list">
        {song.lines.map((line, index) => {
          const isActive = index === activeIndex;
          const translated =
            language === song.originalLanguage
              ? null
              : line.translations?.[language];

          return (
            <div
              key={line.start}
              className={`lyrics-line${isActive ? " lyrics-line--active" : ""}`}
            >
              <p className="lyrics-line__original">{line.text}</p>
              {translated && (
                <p className="lyrics-line__translated">{translated}</p>
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
    if (lines[i].start <= currentTime) {
      active = i;
    } else {
      break;
    }
  }
  return active;
}
