/** Normalize Arabic text for search/display comparisons without changing the stored legal text. */
export function normalizeArabicText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u200E\u200F\u202A-\u202E]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("ar");
}
