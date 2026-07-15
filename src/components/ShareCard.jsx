import { useEffect, useRef } from "react";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

/**
 * Modal that renders a shareable image card for a single lyric line
 * (original + translation) onto a canvas, styled with the song's current
 * accent theme, and offers it as a PNG download.
 */
export default function ShareCard({ data, accentColors, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    drawCard(canvas, data, accentColors);
  }, [data, accentColors]);

  if (!data) return null;

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `babelbeat-${slugify(data.songTitle)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="share-modal" onClick={onClose}>
      <div className="share-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal__header">
          <h3>Share this line</h3>
          <button type="button" className="share-modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="share-modal__canvas-wrap">
          <canvas ref={canvasRef} width={CARD_WIDTH} height={CARD_HEIGHT} />
        </div>

        <div className="share-modal__actions">
          <button type="button" className="share-modal__cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="share-modal__download" onClick={handleDownload}>
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}

function drawCard(canvas, { original, translated, romanized, songTitle, artist }, accentColors) {
  const ctx = canvas.getContext("2d");
  const [a1r, a1g, a1b] = accentColors?.accent1 || [139, 92, 246];
  const [a2r, a2g, a2b] = accentColors?.accent2 || [79, 124, 255];

  // Background
  const bg = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  bg.addColorStop(0, "#0a0a10");
  bg.addColorStop(1, `rgb(${Math.round(a1r * 0.18)}, ${Math.round(a1g * 0.18)}, ${Math.round(a1b * 0.18)})`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Soft glow blobs
  drawGlow(ctx, CARD_WIDTH * 0.85, CARD_HEIGHT * 0.1, 260, `rgba(${a1r}, ${a1g}, ${a1b}, 0.35)`);
  drawGlow(ctx, CARD_WIDTH * 0.08, CARD_HEIGHT * 0.95, 220, `rgba(${a2r}, ${a2g}, ${a2b}, 0.28)`);

  // Song title / artist
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 26px Inter, sans-serif";
  ctx.fillText(truncate(`${songTitle} — ${artist}`, 60), 64, 90);

  // Original line (wrapped, centered vertically-ish)
  ctx.fillStyle = "#f5f5f8";
  ctx.font = "700 54px Manrope, Inter, sans-serif";
  const originalLines = wrapText(ctx, original, CARD_WIDTH - 128);
  let y = 240 - (originalLines.length - 1) * 32;
  for (const line of originalLines) {
    ctx.fillText(line, 64, y);
    y += 64;
  }

  // Translated line
  if (translated) {
    ctx.fillStyle = `rgb(${a2r}, ${a2g}, ${a2b})`;
    ctx.font = "italic 600 38px Inter, sans-serif";
    const translatedLines = wrapText(ctx, translated, CARD_WIDTH - 128);
    for (const line of translatedLines) {
      y += 8;
      ctx.fillText(line, 64, y);
      y += 46;
    }
  }

  // Romanization
  if (romanized) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "400 26px Inter, sans-serif";
    ctx.fillText(truncate(romanized, 80), 64, y + 10);
  }

  // Watermark
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "700 24px Manrope, Inter, sans-serif";
  ctx.fillText("BabelBeat", 64, CARD_HEIGHT - 48);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "400 20px Inter, sans-serif";
  ctx.fillText("babelbeat.pages.dev", 64, CARD_HEIGHT - 22);
}

function drawGlow(ctx, x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function wrapText(ctx, text, maxWidth) {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
    if (lines.length === 3) break;
  }
  if (current && lines.length < 3) lines.push(current);
  return lines.length ? lines : [""];
}

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function slugify(text) {
  return (text || "song")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
