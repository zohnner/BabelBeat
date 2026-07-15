import { useState } from "react";
import YouTubePlayer from "./components/YouTubePlayer";
import LyricsPanel from "./components/LyricsPanel";
import LyricsSearchForm from "./components/LyricsSearchForm";
import { exampleVideoUrl } from "./data/mockLyrics";
import { originalLanguageOption } from "./data/languages";
import { extractVideoId } from "./utils/youtube";
import { fetchVideoInfo, searchLyrics, translateLines } from "./utils/api";
import "./App.css";

export default function App() {
  const [urlInput, setUrlInput] = useState(exampleVideoUrl);
  const [videoId, setVideoId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [urlError, setUrlError] = useState(null);

  const [videoInfo, setVideoInfo] = useState(null);
  const [loadingVideoInfo, setLoadingVideoInfo] = useState(false);

  const [candidates, setCandidates] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState(null);

  const [language, setLanguage] = useState(originalLanguageOption.code);
  const [translationsCache, setTranslationsCache] = useState({}); // { [songId]: { [lang]: string[] } }
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState(null);

  async function handleLoadVideo(e) {
    e.preventDefault();
    const id = extractVideoId(urlInput);
    if (!id) {
      setUrlError("Couldn't find a video ID in that URL. Paste a full YouTube link.");
      return;
    }

    setUrlError(null);
    setVideoId(id);
    setCurrentTime(0);
    setVideoInfo(null);
    setCandidates(null);
    setSelectedSong(null);
    setLanguage(originalLanguageOption.code);
    setTranslationsCache({});
    setTranslationError(null);
    setLyricsError(null);

    setLoadingVideoInfo(true);
    try {
      const info = await fetchVideoInfo(id);
      setVideoInfo(info);
      await runLyricsSearch(info.guessedTrack, info.guessedArtist, { autoSelect: true });
    } catch (err) {
      setUrlError(err.message || "Couldn't load video info.");
    } finally {
      setLoadingVideoInfo(false);
    }
  }

  async function runLyricsSearch(track, artist, { autoSelect = false } = {}) {
    if (!track) return;
    setLyricsLoading(true);
    setLyricsError(null);
    try {
      const { candidates: results } = await searchLyrics(track, artist);
      setCandidates(results);
      if (autoSelect && results.length > 0) {
        setSelectedSong(toSong(results[0], artist));
      } else if (results.length === 0) {
        setSelectedSong(null);
      }
    } catch (err) {
      setLyricsError(err.message || "Lyrics search failed.");
      setCandidates([]);
    } finally {
      setLyricsLoading(false);
    }
  }

  function handleSelectCandidate(candidate) {
    setSelectedSong(toSong(candidate));
    setLanguage(originalLanguageOption.code);
    setTranslationError(null);
  }

  async function handleLanguageChange(lang) {
    setLanguage(lang);
    setTranslationError(null);

    if (lang === originalLanguageOption.code || !selectedSong) return;

    const cached = translationsCache[selectedSong.id]?.[lang];
    if (cached) return;

    setTranslationLoading(true);
    try {
      const { translations, warning } = await translateLines(
        selectedSong.lines.map((l) => l.text),
        lang,
      );
      setTranslationsCache((prev) => ({
        ...prev,
        [selectedSong.id]: { ...(prev[selectedSong.id] || {}), [lang]: translations },
      }));
      if (warning) setTranslationError(warning);
    } catch (err) {
      setTranslationError(err.message || "Translation failed.");
    } finally {
      setTranslationLoading(false);
    }
  }

  const translatedLines =
    selectedSong && language !== originalLanguageOption.code
      ? translationsCache[selectedSong.id]?.[language]
      : null;

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-mark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 18V5l10-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                stroke="white"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1>BabelBeat</h1>
          <span className="app__tagline">— sing along in any language</span>
        </div>

        <form className="app__url-form" onSubmit={handleLoadVideo}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste a YouTube URL"
          />
          <button type="submit" disabled={loadingVideoInfo}>
            {loadingVideoInfo && <span className="spinner" aria-hidden="true" />}
            {loadingVideoInfo ? "Loading" : "Load"}
          </button>
        </form>
        {urlError && <p className="app__error">{urlError}</p>}
      </header>

      <main className="app__main">
        <div className="app__player-column">
          {videoId ? (
            <YouTubePlayer videoId={videoId} onTimeUpdate={setCurrentTime} />
          ) : (
            <div className="app__player-placeholder">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M10 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor" />
              </svg>
              <span>Paste a YouTube URL above to get started</span>
            </div>
          )}
        </div>

        <div className="app__lyrics-column">
          {selectedSong ? (
            <>
              <LyricsPanel
                song={selectedSong}
                currentTime={currentTime}
                language={language}
                onLanguageChange={handleLanguageChange}
                translatedLines={translatedLines}
                translationLoading={translationLoading}
                translationError={translationError}
              />
              {candidates && candidates.length > 1 && (
                <details className="app__other-matches">
                  <summary>Not the right song? {candidates.length} matches found</summary>
                  <LyricsSearchForm
                    initialTrack={videoInfo?.guessedTrack}
                    initialArtist={videoInfo?.guessedArtist}
                    candidates={candidates}
                    selectedId={selectedSong.id}
                    loading={lyricsLoading}
                    error={lyricsError}
                    onSearch={(track, artist) => runLyricsSearch(track, artist)}
                    onSelect={handleSelectCandidate}
                  />
                </details>
              )}
            </>
          ) : videoId ? (
            <div className="lyrics-panel lyrics-panel--empty">
              <h2>Lyrics</h2>
              {lyricsLoading || loadingVideoInfo ? (
                <p className="app__loading-state">
                  <span className="spinner" aria-hidden="true" />
                  Searching for lyrics…
                </p>
              ) : (
                <LyricsSearchForm
                  initialTrack={videoInfo?.guessedTrack}
                  initialArtist={videoInfo?.guessedArtist}
                  candidates={candidates}
                  selectedId={null}
                  loading={lyricsLoading}
                  error={lyricsError}
                  onSearch={(track, artist) => runLyricsSearch(track, artist)}
                  onSelect={handleSelectCandidate}
                />
              )}
            </div>
          ) : (
            <div className="lyrics-panel lyrics-panel--empty">
              <h2>Lyrics</h2>
              <p>Load a video to see synced lyrics and translations here.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="app__footer">
        <p>Lyrics via lrclib.net · translations via Google Translate</p>
      </footer>
    </div>
  );
}

function toSong(candidate, fallbackArtist) {
  return {
    id: candidate.id,
    title: candidate.trackName,
    artist: candidate.artistName || fallbackArtist || "Unknown artist",
    synced: candidate.synced,
    lines: candidate.lines,
  };
}
