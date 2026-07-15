// Extracts a vivid accent color pair from an image (a song's YouTube
// thumbnail) so the UI can re-theme itself per song. Pure canvas pixel
// sampling — no dependencies.

/**
 * @param {string} imageUrl same-origin (or CORS-friendly) image URL
 * @returns {Promise<{accent1: [number,number,number], accent2: [number,number,number]} | null>}
 */
export function extractAccentColors(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    const cleanup = () => resolve(null);
    const timeout = setTimeout(cleanup, 6000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = new Map();
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];
          if (alpha < 200) continue;

          const { s, l } = rgbToHsl(r, g, b);
          // Skip washed-out / near-black-or-white pixels — they make for
          // muddy theme colors.
          if (s < 0.18 || l < 0.12 || l > 0.9) continue;

          // Quantize so near-identical colors group together.
          const key = [r >> 4, g >> 4, b >> 4].join(",");
          const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
          bucket.r += r;
          bucket.g += g;
          bucket.b += b;
          bucket.count += 1;
          buckets.set(key, bucket);
        }

        const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count);
        if (sorted.length === 0) {
          resolve(null);
          return;
        }

        const top = sorted[0];
        const primary = [
          Math.round(top.r / top.count),
          Math.round(top.g / top.count),
          Math.round(top.b / top.count),
        ];

        // Second accent: prefer the next distinct-hued bucket; fall back to
        // a hue-shifted variant of the primary so we always get a gradient.
        const primaryHsl = rgbToHsl(...primary);
        const distinct = sorted
          .slice(1)
          .map((b) => [Math.round(b.r / b.count), Math.round(b.g / b.count), Math.round(b.b / b.count)])
          .find((c) => {
            const h = rgbToHsl(...c);
            return Math.abs(h.h - primaryHsl.h) > 0.12;
          });

        const secondary = distinct || hslToRgb((primaryHsl.h + 0.12) % 1, primaryHsl.s, Math.min(0.65, primaryHsl.l + 0.1));

        resolve({ accent1: boostVibrance(primary), accent2: boostVibrance(secondary) });
      } catch {
        // getImageData throws if the canvas got tainted anyway (e.g. proxy
        // failed and browser fell back to an opaque/cross-origin load).
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };

    img.src = imageUrl;
  });
}

function boostVibrance([r, g, b]) {
  const { h, s, l } = rgbToHsl(r, g, b);
  return hslToRgb(h, Math.min(1, s * 1.15), Math.min(0.68, Math.max(0.42, l)));
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return { h, s, l };
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
