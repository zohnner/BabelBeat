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
        <h1>BabelBeat</h1>
        <form className="app__url-form" onSubmit={handleLoadVideo}>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste a YouTube URL"
          />
          <button type="submit" disabled={loadingVideoInfo}>
            {loadingVideoInfo ? "Loading…" : "Load"}
          </button>
        </form>
        {urlError && <p className="app__error">{urlError}</p>}
      </header>

      <main className="app__main">
        <div className="app__player-column">
          {videoId ? (
            <YouTubePlayer videoId={videoId} onTimeUpdate={setCurrentTime} />
          ) : (
            <div className="app__player-placeholder">Paste a YouTube URL above to get started</div>
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
                <p>Searching for lyrics…</p>
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
