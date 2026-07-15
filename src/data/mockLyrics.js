// Mock lyrics data for BabelBeat's initial frame.
// Each line has a start time (seconds) and text in the original language,
// plus translations keyed by language code.
//
// Replace this with real lyrics/translation API results later.

export const mockSong = {
  title: "Sample Song (Placeholder)",
  artist: "Demo Artist",
  // Default YouTube video used until the user pastes their own URL.
  youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  originalLanguage: "en",
  lines: [
    {
      start: 0,
      text: "This is the first line of the song",
      translations: {
        es: "Esta es la primera línea de la canción",
        fr: "Voici la première ligne de la chanson",
        ja: "これは曲の最初の行です",
      },
    },
    {
      start: 4,
      text: "Waiting here for the beat to drop",
      translations: {
        es: "Esperando aquí a que caiga el ritmo",
        fr: "J'attends ici que le rythme tombe",
        ja: "ビートが落ちるのをここで待っている",
      },
    },
    {
      start: 8,
      text: "Lyrics will sync as the video plays",
      translations: {
        es: "La letra se sincronizará mientras se reproduce el video",
        fr: "Les paroles se synchroniseront pendant la lecture de la vidéo",
        ja: "動画が再生されると歌詞が同期します",
      },
    },
    {
      start: 12,
      text: "This is just placeholder text for now",
      translations: {
        es: "Esto es solo texto de marcador de posición por ahora",
        fr: "Ceci n'est qu'un texte provisoire pour le moment",
        ja: "これは今のところ仮のテキストです",
      },
    },
    {
      start: 16,
      text: "Soon real lyrics will replace this frame",
      translations: {
        es: "Pronto la letra real reemplazará este marco",
        fr: "Bientôt, de vraies paroles remplaceront ce cadre",
        ja: "すぐに本物の歌詞がこの枠組みに取って代わります",
      },
    },
    {
      start: 20,
      text: "But the structure you see is here to stay",
      translations: {
        es: "Pero la estructura que ves llegó para quedarse",
        fr: "Mais la structure que vous voyez est là pour rester",
        ja: "しかし、あなたが見る構造はここに残ります",
      },
    },
  ],
};

export const supportedLanguages = [
  { code: "en", label: "English (original)" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "ja", label: "Japanese" },
];
