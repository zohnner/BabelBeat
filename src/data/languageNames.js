// Broad ISO 639-1 code -> display name map. Used to label whatever source
// language Google's auto-detector reports for a song's lyrics, which can be
// far wider than the curated list of languages we offer as translation
// targets (see languages.js).
const LANGUAGE_NAMES = {
  af: "Afrikaans", sq: "Albanian", am: "Amharic", ar: "Arabic", hy: "Armenian",
  az: "Azerbaijani", eu: "Basque", be: "Belarusian", bn: "Bengali", bs: "Bosnian",
  bg: "Bulgarian", ca: "Catalan", ceb: "Cebuano", zh: "Chinese",
  "zh-cn": "Chinese (Simplified)", "zh-tw": "Chinese (Traditional)",
  co: "Corsican", hr: "Croatian", cs: "Czech", da: "Danish", nl: "Dutch",
  en: "English", eo: "Esperanto", et: "Estonian", fi: "Finnish", fr: "French",
  fy: "Frisian", gl: "Galician", ka: "Georgian", de: "German", el: "Greek",
  gu: "Gujarati", ht: "Haitian Creole", ha: "Hausa", haw: "Hawaiian",
  he: "Hebrew", iw: "Hebrew", hi: "Hindi", hmn: "Hmong", hu: "Hungarian",
  is: "Icelandic", ig: "Igbo", id: "Indonesian", ga: "Irish", it: "Italian",
  ja: "Japanese", jv: "Javanese", kn: "Kannada", kk: "Kazakh", km: "Khmer",
  ko: "Korean", ku: "Kurdish", ky: "Kyrgyz", lo: "Lao", la: "Latin",
  lv: "Latvian", lt: "Lithuanian", lb: "Luxembourgish", mk: "Macedonian",
  mg: "Malagasy", ms: "Malay", ml: "Malayalam", mt: "Maltese", mi: "Maori",
  mr: "Marathi", mn: "Mongolian", my: "Burmese", ne: "Nepali", no: "Norwegian",
  ny: "Chichewa", or: "Odia", ps: "Pashto", fa: "Persian", pl: "Polish",
  pt: "Portuguese", pa: "Punjabi", ro: "Romanian", ru: "Russian", sm: "Samoan",
  gd: "Scots Gaelic", sr: "Serbian", st: "Sesotho", sn: "Shona", sd: "Sindhi",
  si: "Sinhala", sk: "Slovak", sl: "Slovenian", so: "Somali", es: "Spanish",
  su: "Sundanese", sw: "Swahili", sv: "Swedish", tl: "Tagalog", tg: "Tajik",
  ta: "Tamil", tt: "Tatar", te: "Telugu", th: "Thai", tr: "Turkish",
  tk: "Turkmen", uk: "Ukrainian", ur: "Urdu", ug: "Uyghur", uz: "Uzbek",
  vi: "Vietnamese", cy: "Welsh", xh: "Xhosa", yi: "Yiddish", yo: "Yoruba",
  zu: "Zulu",
};

export function languageDisplayName(code) {
  if (!code) return null;
  return LANGUAGE_NAMES[code.toLowerCase()] || code.toUpperCase();
}

export default LANGUAGE_NAMES;
