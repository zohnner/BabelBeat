import { useState } from "react";
import YouTubePlayer from "./components/YouTubePlayer";
import LyricsPanel from "./components/LyricsPanel";
import { mockSong } from "./data/mockLyrics";
import { extractVideoId } from "./utils/youtube";
import "./App.css";

const defaultVideoId = extractVideoId(mockSong.youtubeUrl);

export default function App() {
  const [urlInput, setUrlInput] = useState(mockSong.youtubeUrl);
  const [videoId, setVideoId] = useState(defaultVideoId);
  const [currentTime, setCurrentTime] = useState(0);
  const [language, setLanguage] = useState("es");
  const [error, setError] = useState(null);

  function handleLoadVideo(e) {
    e.preventDefault();
    const id = extractVideoId(urlInput);
    if (!id) {
      setError("Couldn't find a video ID in that URL. Paste a full YouTube link.");
      return;
    }
    setError(null);
    setVideoId(id);
    setCurrentTime(0);
  }

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
          <button type="submit">Load</button>
        </form>
        {error && <p className="app__error">{error}</p>}
      </header>

      <main className="app__main">
        <div className="app__player-column">
          {videoId ? (
            <YouTubePlayer videoId={videoId} onTimeUpdate={setCurrentTime} />
          ) : (
            <div className="app__player-placeholder">No video loaded</div>
          )}
        </div>

        <div className="app__lyrics-column">
          <LyricsPanel
            song={mockSong}
            currentTime={currentTime}
            language={language}
            onLanguageChange={setLanguage}
          />
        </div>
      </main>

      <footer className="app__footer">
        <p>
          Lyrics shown are placeholder data — real lyrics/translation lookup
          comes next.
        </p>
      </footer>
    </div>
  );
}
