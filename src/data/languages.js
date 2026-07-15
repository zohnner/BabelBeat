// Target languages offered in the translation picker. Codes match what
// Google Translate's public endpoint (our translation proxy) expects for
// its sl/tl parameters.
export const supportedLanguages = [
  { code: "es", label: "Spanish", romanizable: false },
  { code: "fr", label: "French", romanizable: false },
  { code: "de", label: "German", romanizable: false },
  { code: "it", label: "Italian", romanizable: false },
  { code: "pt", label: "Portuguese", romanizable: false },
  { code: "ja", label: "Japanese", romanizable: true },
  { code: "ko", label: "Korean", romanizable: true },
  { code: "zh", label: "Chinese (Simplified)", romanizable: true },
  { code: "ar", label: "Arabic", romanizable: true },
  { code: "hi", label: "Hindi", romanizable: true },
  { code: "ru", label: "Russian", romanizable: true },
  { code: "tr", label: "Turkish", romanizable: false },
];

export const originalLanguageOption = { code: "original", label: "Original (no translation)" };

export function isRomanizable(code) {
  return supportedLanguages.some((lang) => lang.code === code && lang.romanizable);
}
