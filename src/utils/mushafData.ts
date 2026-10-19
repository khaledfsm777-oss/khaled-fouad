import { ALL_SURAHS, SurahListItem } from './surahList';
import { quranData } from './quranData';
import { stripBismillah } from './jummal';

export interface MushafSurahInfo {
  id: number;
  name: string;
  fullName: string;
  versesCount: number;
  type: 'مكية' | 'مدنية';
  startJuz: number;
  revelationOrder: number;
  isNoorani: boolean;
  nooraniLetters?: string;
}

export interface JuzInfo {
  juzNumber: number;
  name: string;
  startSurahId: number;
  startVerse: number;
  startSurahName: string;
}

// 25 undisputed Madani Surahs
export const MADANI_SURAH_IDS = new Set<number>([
  2, 3, 4, 5, 8, 9, 22, 24, 33, 47, 48, 49, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 76, 98, 110
]);

// 29 Noorani Surahs with their opening letters
const NOORANI_MAP: Record<number, string> = {
  2: 'الم', 3: 'الم', 7: 'المص', 10: 'الر', 11: 'الر', 12: 'الر', 13: 'المر',
  14: 'الر', 15: 'الر', 19: 'كهيعص', 20: 'طه', 26: 'طسم', 27: 'طس', 28: 'طسم',
  29: 'الم', 30: 'الم', 31: 'الم', 32: 'الم', 36: 'يس', 38: 'ص', 40: 'حم',
  41: 'حم', 42: 'حم عسق', 43: 'حم', 44: 'حم', 45: 'حم', 46: 'حم', 50: 'ق', 68: 'ن'
};

// 30 Juz Starting References
export const JUZ_DEFINITIONS: JuzInfo[] = [
  { juzNumber: 1, name: 'الجزء الأول (الم)', startSurahId: 1, startVerse: 1, startSurahName: 'الفاتحة' },
  { juzNumber: 2, name: 'الجزء الثاني (سيقول)', startSurahId: 2, startVerse: 142, startSurahName: 'البقرة' },
  { juzNumber: 3, name: 'الجزء الثالث (تلك الرسل)', startSurahId: 2, startVerse: 253, startSurahName: 'البقرة' },
  { juzNumber: 4, name: 'الجزء الرابع (لن تنالوا)', startSurahId: 3, startVerse: 93, startSurahName: 'آل عمران' },
  { juzNumber: 5, name: 'الجزء الخامس (والمحصنات)', startSurahId: 4, startVerse: 24, startSurahName: 'النساء' },
  { juzNumber: 6, name: 'الجزء السادس (لا يحب الله)', startSurahId: 4, startVerse: 148, startSurahName: 'النساء' },
  { juzNumber: 7, name: 'الجزء السابع (وإذا سمعوا)', startSurahId: 5, startVerse: 82, startSurahName: 'المائدة' },
  { juzNumber: 8, name: 'الجزء الثامن (ولو أننا)', startSurahId: 6, startVerse: 111, startSurahName: 'الأنعام' },
  { juzNumber: 9, name: 'الجزء التاسع (قال الملأ)', startSurahId: 7, startVerse: 88, startSurahName: 'الأعراف' },
  { juzNumber: 10, name: 'الجزء العاشر (واعلموا)', startSurahId: 8, startVerse: 41, startSurahName: 'الأنفال' },
  { juzNumber: 11, name: 'الجزء الحادي عشر (يعتذرون)', startSurahId: 9, startVerse: 93, startSurahName: 'التوبة' },
  { juzNumber: 12, name: 'الجزء الثاني عشر (وما من دابة)', startSurahId: 11, startVerse: 6, startSurahName: 'هود' },
  { juzNumber: 13, name: 'الجزء الثالث عشر (وما أبرئ نفسي)', startSurahId: 12, startVerse: 53, startSurahName: 'يوسف' },
  { juzNumber: 14, name: 'الجزء الرابع عشر (ربما)', startSurahId: 15, startVerse: 1, startSurahName: 'الحجر' },
  { juzNumber: 15, name: 'الجزء الخامس عشر (سبحان الذي)', startSurahId: 17, startVerse: 1, startSurahName: 'الإسراء' },
  { juzNumber: 16, name: 'الجزء السادس عشر (قال ألم)', startSurahId: 18, startVerse: 75, startSurahName: 'الكهف' },
  { juzNumber: 17, name: 'الجزء السابع عشر (اقترب)', startSurahId: 21, startVerse: 1, startSurahName: 'الأنبياء' },
  { juzNumber: 18, name: 'الجزء الثامن عشر (قد أفلح)', startSurahId: 23, startVerse: 1, startSurahName: 'المؤمنون' },
  { juzNumber: 19, name: 'الجزء التاسع عشر (وقال الذين)', startSurahId: 25, startVerse: 21, startSurahName: 'الفرقان' },
  { juzNumber: 20, name: 'الجزء العشرون (فما كان جواب)', startSurahId: 27, startVerse: 56, startSurahName: 'النمل' },
  { juzNumber: 21, name: 'الجزء الحادي والعشرون (ولا تجادلوا)', startSurahId: 29, startVerse: 46, startSurahName: 'العنكبوت' },
  { juzNumber: 22, name: 'الجزء الثاني والعشرون (ومن يقنت)', startSurahId: 33, startVerse: 31, startSurahName: 'الأحزاب' },
  { juzNumber: 23, name: 'الجزء الثالث والعشرون (وما أنزلنا)', startSurahId: 36, startVerse: 28, startSurahName: 'يس' },
  { juzNumber: 24, name: 'الجزء الرابع والعشرون (فمن أظلم)', startSurahId: 39, startVerse: 32, startSurahName: 'الزمر' },
  { juzNumber: 25, name: 'الجزء الخامس والعشرون (إليه يرد)', startSurahId: 41, startVerse: 47, startSurahName: 'فصلت' },
  { juzNumber: 26, name: 'الجزء السادس والعشرون (حم)', startSurahId: 46, startVerse: 1, startSurahName: 'الأحقاف' },
  { juzNumber: 27, name: 'الجزء السابع والعشرون (قال فما خطبكم)', startSurahId: 51, startVerse: 31, startSurahName: 'الذاريات' },
  { juzNumber: 28, name: 'الجزء الثامن والعشرون (قد سمع)', startSurahId: 58, startVerse: 1, startSurahName: 'المجادلة' },
  { juzNumber: 29, name: 'الجزء التاسع والعشرون (تبارك)', startSurahId: 67, startVerse: 1, startSurahName: 'الملك' },
  { juzNumber: 30, name: 'الجزء الثلاثون (عمّ)', startSurahId: 78, startVerse: 1, startSurahName: 'النبأ' },
];

export function getJuzForVerse(surahId: number, verseNum: number): number {
  for (let i = JUZ_DEFINITIONS.length - 1; i >= 0; i--) {
    const js = JUZ_DEFINITIONS[i];
    if (surahId > js.startSurahId || (surahId === js.startSurahId && verseNum >= js.startVerse)) {
      return js.juzNumber;
    }
  }
  return 1;
}

// Revelation orders standard scholarly sequence
export const REVELATION_ORDERS: Record<number, number> = {
  1: 5, 2: 87, 3: 89, 4: 92, 5: 112, 6: 55, 7: 39, 8: 88, 9: 113, 10: 51,
  11: 52, 12: 53, 13: 96, 14: 72, 15: 54, 16: 70, 17: 50, 18: 69, 19: 44, 20: 45,
  21: 73, 22: 103, 23: 74, 24: 102, 25: 42, 26: 47, 27: 48, 28: 49, 29: 85, 30: 84,
  31: 57, 32: 75, 33: 90, 34: 58, 35: 43, 36: 41, 37: 56, 38: 38, 39: 59, 40: 60,
  41: 61, 42: 62, 43: 63, 44: 64, 45: 65, 46: 66, 47: 95, 48: 111, 49: 106, 50: 34,
  51: 67, 52: 76, 53: 23, 54: 37, 55: 97, 56: 46, 57: 94, 58: 105, 59: 101, 60: 91,
  61: 109, 62: 110, 63: 104, 64: 108, 65: 99, 66: 107, 67: 77, 68: 2, 69: 78, 70: 79,
  71: 71, 72: 40, 73: 3, 74: 4, 75: 31, 76: 98, 77: 33, 78: 80, 79: 81, 80: 24,
  81: 7, 82: 82, 83: 86, 84: 83, 85: 27, 86: 36, 87: 8, 88: 68, 89: 10, 90: 35,
  91: 26, 92: 9, 93: 11, 94: 12, 95: 28, 96: 1, 97: 25, 98: 100, 99: 93, 100: 14,
  101: 30, 102: 16, 103: 13, 104: 32, 105: 19, 106: 29, 107: 17, 108: 15, 109: 18, 110: 114,
  111: 6, 112: 22, 113: 20, 114: 21
};

// Pre-index the 114 surahs with counts and details
let cachedSurahDetails: MushafSurahInfo[] | null = null;

export function getAllMushafSurahs(): MushafSurahInfo[] {
  if (cachedSurahDetails) return cachedSurahDetails;

  const counts: Record<number, number> = {};
  const sampleNames: Record<number, string> = {};

  quranData.forEach((v) => {
    counts[v.surahId] = (counts[v.surahId] || 0) + 1;
    if (!sampleNames[v.surahId] && v.surahName) {
      sampleNames[v.surahId] = v.surahName;
    }
  });

  cachedSurahDetails = ALL_SURAHS.map((s) => {
    const isMadani = MADANI_SURAH_IDS.has(s.id);
    const versesCount = counts[s.id] || 0;
    const startJuz = getJuzForVerse(s.id, 1);
    const isNoorani = s.id in NOORANI_MAP;
    const nooraniLetters = NOORANI_MAP[s.id];
    const fullName = sampleNames[s.id] || `سُورَةُ ${s.name}`;

    return {
      id: s.id,
      name: s.name,
      fullName,
      versesCount,
      type: isMadani ? 'مدنية' : 'مكية',
      startJuz,
      revelationOrder: REVELATION_ORDERS[s.id] || s.id,
      isNoorani,
      nooraniLetters,
    };
  });

  return cachedSurahDetails;
}

export function getMushafSurah(surahId: number): MushafSurahInfo | undefined {
  return getAllMushafSurahs().find((s) => s.id === surahId);
}

export interface MushafVerseForReading {
  id: number;
  surahId: number;
  verseNumber: number;
  text: string;
  juz: number;
}

/**
 * Get all verses of a Surah prepared for continuous Mushaf reading.
 * Strips Basmalah from verse 1 for surahs 2..114 so the Basmalah banner can be rendered cleanly.
 */
export function getMushafVersesForSurah(surahId: number): MushafVerseForReading[] {
  const surahVerses = quranData.filter((v) => v.surahId === surahId);
  return surahVerses.map((v) => {
    let text = v.text;
    // For Surahs 2 to 114, strip the Basmalah from verse 1 text
    if (surahId !== 1 && v.verseNumber === 1) {
      text = stripBismillah(text);
    }
    const juz = getJuzForVerse(surahId, v.verseNumber);
    return {
      id: v.id,
      surahId: v.surahId,
      verseNumber: v.verseNumber,
      text,
      juz,
    };
  });
}

/**
 * Convert standard numerals to authentic Arabic numerals (١, ٢, ٣...)
 */
export function toArabicNumerals(num: number | string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (w) => arabicDigits[+w]);
}

/**
 * Blessed Duaa Khatm Al-Quran text
 */
export const DUAA_KHATM_QURAN = `اللَّهُمَّ ارْحَمْنَا بِالقُرْءَانِ، وَاجْعَلْهُ لَنَا إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً.
اللَّهُمَّ ذَكِّرْنَا مِنْهُ مَا نَسِينَا، وَعَلِّمْنَا مِنْهُ مَا جَهِلْنَا، وَارْزُقْنَا تِلاَوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ، وَاجْعَلْهُ لَنَا حُجَّةً يَا رَبَّ العَالَمِينَ.
اللَّهُمَّ أَصْلِحْ لَنَا دِينَنَا الَّذِي هُوَ عِصْمَةُ أَمْرِنَا، وَأَصْلِحْ لَنَا دُنْيَانَا الَّتِي فِيهَا مَعَاشُنَا، وَأَصْلِحْ لَنَا آخِرَتَنَا الَّتِي إِلَيْهَا مَعَادُنَا، وَاجْعَلِ الحَيَاةَ زِيَادَةً لَنَا فِي كُلِّ خَيْرٍ، وَاجْعَلِ المَوْتَ رَاحَةً لَنَا مِنْ كُلِّ شَرٍّ.
اللَّهُمَّ اجْعَلْ خَيْرَ أَعْمَارِنَا أَوَاخِرَهَا، وَخَيْرَ أَعْمَالِنَا خَوَاتِيمَهَا، وَخَيْرَ أَيَّامِنَا يَوْمَ نَلْقَاكَ فِيهِ.
اللَّهُمَّ إِنَّا نَسْأَلُكَ عِيشَةً هَنِيَّةً، وَمِيتَةً سَوِيَّةً، وَمَرَدًّا غَيْرَ مُخْزٍ وَلاَ فَاضِحٍ.
اللَّهُمَّ اجْعَلِ القُرْآنَ العَظِيمَ رَبِيعَ قُلُوبِنَا، وَنُورَ صُدُورِنَا، وَجِلاَءَ أَحْزَانِنَا، وَذَهَابَ هُمُومِنَا وَغُمُومِنَا.
وَصَلَّى اللَّهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلَّمَ تَسْلِيمًا كَثِيرًا دَائِمًا إِلَى يَوْمِ الدِّينِ.`;
