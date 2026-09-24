export interface ArabicLetterMetadata {
  char: string;
  name: string;
  value: number;
}

// Help descriptions for each Arabic character and its numerical Jummal value
export const ARABIC_LETTERS_METADATA: ArabicLetterMetadata[] = [
  { char: 'أ', name: 'ألف / همزة (أ، إ، آ، ٱ، ء، ٰ)', value: 1 },
  { char: 'ب', name: 'باء', value: 2 },
  { char: 'ج', name: 'جيم', value: 3 },
  { char: 'د', name: 'دال', value: 4 },
  { char: 'ه', name: 'هاء (هـ/ه)', value: 5 },
  { char: 'و', name: 'واو / همزة على واو (ؤ)', value: 6 },
  { char: 'ز', name: 'زاي', value: 7 },
  { char: 'ح', name: 'حاء', value: 8 },
  { char: 'ط', name: 'طاء', value: 9 },
  { char: 'ي', name: 'ياء / ألف مقصورة / همزة على ياء (ي، ى، ئ)', value: 10 },
  { char: 'ك', name: 'كاف', value: 20 },
  { char: 'ل', name: 'لام', value: 30 },
  { char: 'م', name: 'ميم', value: 40 },
  { char: 'ن', name: 'نون', value: 50 },
  { char: 'س', name: 'سين', value: 60 },
  { char: 'ع', name: 'عين', value: 70 },
  { char: 'ف', name: 'فاء', value: 80 },
  { char: 'ص', name: 'صاد', value: 90 },
  { char: 'ق', name: 'قاف', value: 100 },
  { char: 'ر', name: 'راء', value: 200 },
  { char: 'ش', name: 'شين', value: 300 },
  { char: 'ت', name: 'تاء مفتوحة ومربوطة (ت، ة)', value: 400 },
  { char: 'ث', name: 'ثاء', value: 500 },
  { char: 'خ', name: 'خاء', value: 600 },
  { char: 'ذ', name: 'ذال', value: 700 },
  { char: 'ض', name: 'ضاد', value: 800 },
  { char: 'ظ', name: 'ظاء', value: 900 },
  { char: 'غ', name: 'غين', value: 1000 },
];
