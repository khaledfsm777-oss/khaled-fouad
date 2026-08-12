import { Verse, WordAnalysis, AnalysisSummary } from '../types';

// Helper to clean duplicate or redundant "سورة" prefixes from Surah names
export function formatSurahNameClean(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .replace(/^سُورَةُ\s*/g, '')
    .replace(/^سُورَة\s*/g, '')
    .replace(/^سورة\s*/g, '')
    .replace(/سُورَةُ\s*/g, '')
    .replace(/سورة\s*/g, '')
    .trim();
}

// Al-Bunyan Abjad / Jummal Numerical Values for Arabic Characters
export const JUMMAL_MAP: Record<string, number> = {
  'ا': 1, 'أ': 1, 'إ': 1, 'آ': 1, 'ٱ': 1, 'ٰ': 1, 'ء': 1,
  'ب': 2,
  'ج': 3,
  'د': 4,
  'ه': 5, 'ة': 5, 'هـ': 5,
  'و': 6, 'ؤ': 6,
  'ز': 7,
  'ح': 8,
  'ط': 9,
  'ي': 10, 'ى': 10, 'ئ': 10,
  'ك': 20,
  'ل': 30,
  'م': 40,
  'ن': 50,
  'س': 60,
  'ع': 70,
  'ف': 80,
  'ص': 90,
  'ق': 100,
  'ر': 200,
  'ش': 300,
  'ت': 400,
  'ث': 500,
  'خ': 600,
  'ذ': 700,
  'ض': 800,
  'ظ': 900,
  'غ': 1000
};

// Help descriptions for each character
export const ARABIC_LETTERS_METADATA = [
  { char: 'أ', name: 'ألف / همزة', value: 1 },
  { char: 'ب', name: 'باء', value: 2 },
  { char: 'ج', name: 'جيم', value: 3 },
  { char: 'د', name: 'دال', value: 4 },
  { char: 'ه', name: 'هاء', value: 5 },
  { char: 'و', name: 'واو', value: 6 },
  { char: 'ز', name: 'زاي', value: 7 },
  { char: 'ح', name: 'حاء', value: 8 },
  { char: 'ط', name: 'طاء', value: 9 },
  { char: 'ي', name: 'ياء', value: 10 },
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
  { char: 'ت', name: 'تاء', value: 400 },
  { char: 'ث', name: 'ثاء', value: 500 },
  { char: 'خ', name: 'خاء', value: 600 },
  { char: 'ذ', name: 'ذال', value: 700 },
  { char: 'ض', name: 'ضاد', value: 800 },
  { char: 'ظ', name: 'ظاء', value: 900 },
  { char: 'غ', name: 'غين', value: 1000 },
];

/**
 * Removes Arabic Tashkeel (diacritics), Tatweel, and Quranic recitation marks.
 * Optionally converts non-standard letters to simple counterparts.
 */
export function removeTashkeel(text: string): string {
  if (!text) return '';
  
  // Normalise tatweel (ـ) by stripping it
  let clean = text.replace(/\u0640/g, '');
  
  // Strip Tashkeel (harakat):
  // Fathatan \u064B, Dammatan \u064C, Kasratan \u064D, Fatha \u064E, Damma \u064F, Kasra \u0650, Shaddah \u0651, Sukun \u0652
  // Maddah \u0653, Hamza above/below \u0654 \u0655
  clean = clean.replace(/[\u064B-\u065F]/g, '');
  return clean;
}

/**
 * Simple normalization helper keeping only core Arabic alphabet characters (ا to ي).
 * Strips all diacritics, dagger alifs, recitation glyphs, tatweel and spaces.
 */
function cleanSimpleArabic(w: string): string {
  if (!w) return '';
  const normalized = w.trim();
  let clean = '';
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (char === 'أ' || char === 'إ' || char === 'آ' || char === 'ٱ' || char === 'ء') {
      clean += 'ا';
    } else if (char === 'ة') {
      clean += 'ه';
    } else if (char === 'ى' || char === '\u06CC') {
      clean += 'ي';
    } else if (char === '\u0640' || char === 'ـ') {
      // Skip tatweel
    } else if (char >= 'ا' && char <= 'ي') {
      clean += char;
    }
  }
  return clean;
}

/**
 * Removes standard introductory Bismillah if present.
 * Uses a diacritic-and-orthography-insensitive word match.
 */
export function stripBismillah(text: string): string {
  if (!text) return '';
  let trimmed = text.trim();
  
  // Remove Unicode Bismillah glyph if present
  trimmed = trimmed.replace(/\uFDFD/g, '').trim();

  // Strip standard "بسم الله الرحمن الرحيم" or Unicode inside parentheses
  trimmed = trimmed.replace(/^\s*[\(\{\[﴿\uFD3E][\s\u200B]*(?:بسم\s+الله\s+الرحمن\s+الرحيم|﷽)[\s\u200B]*[\)\}\]﴾\uFD3F]\s*/, '').trim();

  function cleanSimpleArabicChar(char: string): string {
    if (char === 'أ' || char === 'إ' || char === 'آ' || char === 'ٱ' || char === 'ء' || char === '\u0670') {
      return 'ا';
    } else if (char === 'ة') {
      return 'ه';
    } else if (char === 'ى' || char === '\u06CC') {
      return 'ي';
    } else if (char === '\u0640' || char === 'ـ') {
      return ''; // Skip tatweel
    } else if (char >= 'ا' && char <= 'ي') {
      return char;
    }
    return '';
  }

  let changed = true;
  while (changed) {
    changed = false;
    const mapping: { originalIndex: number; char: string; norm: string }[] = [];
    let normalizedStr = '';
    
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      const norm = cleanSimpleArabicChar(char);
      if (norm) {
        mapping.push({ originalIndex: i, char, norm });
        normalizedStr += norm;
      }
    }
    
    const targets = [
      { key: 'بسماللهالرحمانالرحيم', len: 20 },
      { key: 'بسماللهالرحمنالرحيم', len: 19 },
      { key: 'الرحمانالرحيم', len: 13 },
      { key: 'الرحمنالرحيم', len: 12 },
      { key: 'بسمالله', len: 7 },
      { key: 'الرحمان', len: 7 },
      { key: 'الرحمن', len: 6 },
      { key: 'الرحيم', len: 6 }
    ];
    
    const matched = targets.find(t => normalizedStr.startsWith(t.key));
    if (matched) {
      const lastMappedEntry = mapping[matched.len - 1];
      if (lastMappedEntry) {
        trimmed = trimmed.substring(lastMappedEntry.originalIndex + 1).trim();
        // Remove leading spaces, diacritics, recitation marks, tatweel, and punctuation
        trimmed = trimmed.replace(/^[\s\u200B\u00A0\u064B-\u065F\u0670\u06D6-\u06ED،,؛;.:\-–—_/\\*+=~﴿﴾()[\]{}]+/g, '').trim();
        changed = true;
      }
    }
  }

  return trimmed;
}

export interface NooraniSurah {
  id: number;
  name: string;
  letters: string;
  keyValue: number;
  digitalRoot: number;
}

export const NOORANI_SURAHS: NooraniSurah[] = [
  { id: 2, name: 'البقرة (Al-Baqarah)', letters: 'الم', keyValue: 71, digitalRoot: 8 },
  { id: 3, name: 'آل عمران (Ali Imran)', letters: 'الم', keyValue: 71, digitalRoot: 8 },
  { id: 7, name: 'الأعراف (Al-Araf)', letters: 'المص', keyValue: 161, digitalRoot: 8 },
  { id: 10, name: 'يونس (Yunus)', letters: 'الر', keyValue: 231, digitalRoot: 6 },
  { id: 11, name: 'هود (Hud)', letters: 'الر', keyValue: 231, digitalRoot: 6 },
  { id: 12, name: 'يوسف (Yusuf)', letters: 'الر', keyValue: 231, digitalRoot: 6 },
  { id: 13, name: 'الرعد (Ar-Rad)', letters: 'المر', keyValue: 271, digitalRoot: 1 },
  { id: 14, name: 'إبراهيم (Ibrahim)', letters: 'الر', keyValue: 231, digitalRoot: 6 },
  { id: 15, name: 'الحجر (Al-Hijr)', letters: 'الر', keyValue: 231, digitalRoot: 6 },
  { id: 19, name: 'مريم (Maryam)', letters: 'كهيعص', keyValue: 278, digitalRoot: 8 },
  { id: 20, name: 'طه (Taha)', letters: 'طه', keyValue: 14, digitalRoot: 5 },
  { id: 26, name: 'الشعراء (Al-Shuara)', letters: 'طسم', keyValue: 79, digitalRoot: 7 },
  { id: 27, name: 'النمل (Al-Naml)', letters: 'طس', keyValue: 69, digitalRoot: 6 },
  { id: 28, name: 'القصص (Al-Qasas)', letters: 'طسم', keyValue: 79, digitalRoot: 7 },
  { id: 29, name: 'العنكبوت (Al-Ankabut)', letters: 'الم', keyValue: 71, digitalRoot: 8 },
  { id: 30, name: 'الروم (Ar-Rum)', letters: 'الم', keyValue: 71, digitalRoot: 8 },
  { id: 31, name: 'لقمان (Luqman)', letters: 'الم', keyValue: 71, digitalRoot: 8 },
  { id: 32, name: 'السجدة (As-Sajdah)', letters: 'الم', keyValue: 71, digitalRoot: 8 },
  { id: 36, name: 'يس (Ya-Sin)', letters: 'يس', keyValue: 70, digitalRoot: 7 },
  { id: 38, name: 'ص (Sad)', letters: 'ص', keyValue: 90, digitalRoot: 9 },
  { id: 40, name: 'غافر (Ghafir)', letters: 'حم', keyValue: 48, digitalRoot: 3 },
  { id: 41, name: 'فصلت (Fussilat)', letters: 'حم', keyValue: 48, digitalRoot: 3 },
  { id: 42, name: 'الشورى (Al-Shura)', letters: 'حم عسق', keyValue: 278, digitalRoot: 8 },
  { id: 43, name: 'الزخرف (Az-Zukhruf)', letters: 'حم', keyValue: 48, digitalRoot: 3 },
  { id: 44, name: 'الدخان (Ad-Dukhan)', letters: 'حم', keyValue: 48, digitalRoot: 3 },
  { id: 45, name: 'الجاثية (Al-Jathiyah)', letters: 'حم', keyValue: 48, digitalRoot: 3 },
  { id: 46, name: 'الأحقاف (Al-Ahqaf)', letters: 'حم', keyValue: 48, digitalRoot: 3 },
  { id: 50, name: 'ق (Qaf)', letters: 'ق', keyValue: 100, digitalRoot: 1 },
  { id: 68, name: 'القلم (Al-Qalam)', letters: 'ن', keyValue: 50, digitalRoot: 5 },
];

/**
 * Normalizes text for letter extraction and reliable calculation.
 * Removes everything except valid Arabic alphabet letters and spaces.
 */
export function cleanForCalculations(text: string): string {
  if (!text) return '';
  // First remove standard tashkeel
  const withoutTashkeel = removeTashkeel(text);
  
  // Keep only letters inside the Arabic block \u0621-\u064A and \u0671 \u0670 (superscript alif) or space
  let clean = '';
  for (let i = 0; i < withoutTashkeel.length; i++) {
    const char = withoutTashkeel[i];
    if (JUMMAL_MAP[char] !== undefined || char === ' ' || char === '\n') {
      clean += char;
    }
  }
  
  // Replace multiple spaces with a single space
  return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Calculates the Jummal value of a single character.
 */
export function getCharJummal(char: string): number {
  return JUMMAL_MAP[char] || 0;
}

/**
 * Calculates Jummal and statistics for a single word.
 */
export function analyzeWord(word: string): WordAnalysis {
  const cleanWord = cleanForCalculations(word);
  let jummalValue = 0;
  let letterCount = 0;
  
  for (let i = 0; i < cleanWord.length; i++) {
    const char = cleanWord[i];
    if (JUMMAL_MAP[char] !== undefined) {
      jummalValue += JUMMAL_MAP[char];
      letterCount++;
    }
  }
  
  return {
    word,
    cleanWord,
    jummalValue,
    letterCount
  };
}

/**
 * Processes a block of text and parses it into structured Verse rows based on verse indicators like (1), (2), {1}, [1], etc.
 */
export function parseAndAnalyzeVerses(rawBlock: string, separatorType: 'parentheses' | 'curly' | 'auto', excludeBismillah: boolean = true): Verse[] {
  if (!rawBlock || !rawBlock.trim()) return [];

  // Match verse boundaries e.g., (1) or {2} or [15]
  // Auto detects both () and {}
  let regex = /\s*[\(\{\[﴿\uFD3E\u06DD][\s\u200B]*(?:آية\s+)?([0-9\u0660-\u0669]+)[\s\u200B]*[\)\}\]﴾\uFD3F\u06DD]?\s*/g;
  
  if (separatorType === 'parentheses') {
    regex = /\s*[\(\[](?:آية\s+)?([0-9\u0660-\u0669]+)[\)\]]\s*/g;
  } else if (separatorType === 'curly') {
    regex = /\s*\{([0-9\u0660-\u0669]+)\}\s*/g;
  } else if (separatorType === 'auto') {
    // Check if there are any bracketed numbers in the raw block (ordinary, curly, square, ornate ﴿﴾)
    const bracketedRegex = /[\(\{\[﴿\uFD3E\u06DD][\s\u200B]*(?:آية\s+)?([0-9\u0660-\u0669]+)/;
    const hasBrackets = bracketedRegex.test(rawBlock);
    
    if (!hasBrackets) {
      // Check if there are standalone numbers (e.g., words followed/preceded by numbers representing verse boundaries)
      const hasStandaloneDigits = /(?:\s+|^)([0-9\u0660-\u0669]+)(?:\s+|$)/.test(rawBlock);
      if (hasStandaloneDigits) {
        // Use standalone space-surrounded digits as delimiters
        regex = /\s*(?:^|\s+)([0-9\u0660-\u0669]+)(?:\s+|$)\s*/g;
      } else {
        // If there are no numbers at all, check if there are multiple lines (split on lines!)
        if (rawBlock.includes('\n') && rawBlock.split('\n').filter(l => l.trim().length > 0).length > 1) {
          const lines = rawBlock.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const verses: Verse[] = [];
          lines.forEach((line, idx) => {
            const vIdx = idx + 1;
            const shouldExclude = excludeBismillah && (vIdx === 1);
            verses.push(createVerseObject(line, vIdx, `${vIdx}`, line, shouldExclude));
          });
          return verses;
        }
      }
    }
  }

  const verses: Verse[] = [];
  let lastIndex = 0;
  let verseIndex = 1;
  let match;

  // Clone regex to prevent state issues
  const searchRegex = new RegExp(regex.source, regex.flags);

  while ((match = searchRegex.exec(rawBlock)) !== null) {
    const matchIndex = match.index;
    const matchText = match[0];
    const extractedNum = match[1] || `${verseIndex}`; // Fallback if number not parsed

    const rawVerseText = rawBlock.substring(lastIndex, matchIndex).trim();
    if (rawVerseText) {
      // Exclude Bismillah if requested and this is the first parsed verse containing it
      const shouldExclude = excludeBismillah && (verseIndex === 1);
      const verse = createVerseObject(rawVerseText, verseIndex, extractedNum, rawVerseText + " " + matchText, shouldExclude);
      verses.push(verse);
      verseIndex++;
    }
    lastIndex = searchRegex.lastIndex;
  }

  // Handle any trailing text after the last match
  const remainingText = rawBlock.substring(lastIndex).trim();
  if (remainingText) {
    const numStr = verses.length > 0 ? `+` : "1";
    const shouldExclude = excludeBismillah && (verses.length === 0);
    const verse = createVerseObject(remainingText, verseIndex, numStr, remainingText, shouldExclude);
    verses.push(verse);
  }

  return verses;
}

function createVerseObject(rawText: string, index: number, verseNumber: string, originalMatchText: string, excludeBismillah: boolean = false): Verse {
  let textWithoutBrackets = rawText; // Text without verse numbers
  if (excludeBismillah || index === 1) {
    textWithoutBrackets = stripBismillah(textWithoutBrackets);
  }
  const cleanCalculated = cleanForCalculations(textWithoutBrackets);
  
  // Split into words
  const rawWords = textWithoutBrackets.split(/\s+/).filter(w => w.length > 0);
  const wordsAnalysis = rawWords.map(w => analyzeWord(w));
  
  // Sum everything up
  const jummalValue = wordsAnalysis.reduce((sum, w) => sum + w.jummalValue, 0);
  const letterCount = wordsAnalysis.reduce((sum, w) => sum + w.letterCount, 0);
  const wordCount = wordsAnalysis.filter(w => w.cleanWord.length > 0).length || rawWords.length;

  return {
    id: index,
    verseIndex: index,
    verseNumber,
    rawText: originalMatchText,
    text: removeTashkeel(textWithoutBrackets),
    cleanTextForCalculation: cleanCalculated,
    jummalValue,
    wordCount,
    letterCount,
    words: wordsAnalysis
  };
}

/**
 * Compiles aggregated analytics and check keys (Mizan 8, Mizan 3, etc.)
 */
export function calculateSummary(verses: Verse[]): AnalysisSummary {
  let totalWords = 0;
  let totalLetters = 0;
  let totalJummal = 0;
  let mizan8Count = 0;
  let mizan3Count = 0;
  let mizan6Count = 0;

  verses.forEach(v => {
    totalWords += v.wordCount;
    totalLetters += v.letterCount;
    totalJummal += v.jummalValue;

    // Check custom mathematical scales/modulos
    // Mizan 8 - Al-Bunyan Balance: if Jummal modulo 8 is 0, or sum of digits reduces to 8
    if (v.jummalValue % 8 === 0) {
      mizan8Count++;
    }
    // Mizan 3 - Key of Stability/Faith
    if (v.jummalValue % 3 === 0) {
      mizan3Count++;
    }
    // Mizan 6 - Key of Trial/Movement
    if (v.jummalValue % 6 === 0) {
      mizan6Count++;
    }
  });

  return {
    totalVerses: verses.length,
    totalWords,
    totalLetters,
    totalJummal,
    mizan8Count,
    mizan3Count,
    mizan6Count
  };
}

/**
 * Summatic digital root reducer (e.g. 1296 -> 1+2+9+6 = 18 -> 1+8 = 9)
 */
export function reduceDigitalRoot(num: number): number {
  if (num === undefined || num === null || isNaN(num) || num === 0) return 0;
  let working = Math.abs(Math.floor(num));
  if (working === 0) return 0;
  while (working > 9) {
    working = working.toString().split('').reduce((sum, char) => {
      const val = parseInt(char, 10);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }
  return working;
}

/**
 * Advanced Arabic text orthography normalization for bulletproof searching in Quranic scripts
 */
export function normalizeArabicForSearch(text: string): string {
  if (!text) return '';
  let normalized = text.trim();
  
  // 1. Remove zero-width spaces, hair spaces, joiners, direction marks, and BOM
  normalized = normalized.replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/g, '');

  // 2. Remove tatweel (ـ)
  normalized = normalized.replace(/\u0640/g, '');
  
  // 3. Strip standard diacritics / Harakat and recitation marks
  normalized = normalized.replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED]/g, '');
  
  // 4. Handle dagger alif (superscript Alif \u0670) smartly:
  // - If preceded by Alef Maksura "ىٰ", keep it as "ى" (which normalizes to "ي") and do not add an extra "ا".
  // - If preceded by Ya "يٰ", convert to "يا".
  // - Otherwise, map to standard Alif "ا".
  normalized = normalized.replace(/\u0649\u0670/g, 'ى');
  normalized = normalized.replace(/\u064A\u0670/g, 'يا');
  normalized = normalized.replace(/\u0670/g, 'ا');

  // 5. Normalize all Alifs and Hamza variants (آ, أ, إ, ٱ, ء, ؤ, ئ) to standard Alif (ا)
  normalized = normalized.replace(/[\u0622\u0623\u0625\u0671\u0621\u0624\u0626]/g, 'ا');
  
  // Collapse double Alifs "اا+" to a single "ا"
  normalized = normalized.replace(/ا+/g, 'ا');

  // 6. Normalize Farsi/Urdu characters to standard Arabic
  normalized = normalized.replace(/\u06CC/g, 'ي'); // Farsi Yeh
  normalized = normalized.replace(/\u06A9/g, 'ك'); // Farsi Keheh

  // 7. Map Alef Maksura (ى) to Arabic Yeh (ي)
  normalized = normalized.replace(/\u0649/g, 'ي');
  
  // 8. Map Taa Marbuta (ة) to Ha (ه)
  normalized = normalized.replace(/\u0629/g, 'ه');

  // 9. Equate common demonstrative pronouns that have spelling variants
  normalized = normalized.replace(/هذا/g, 'هاذا');
  normalized = normalized.replace(/هذه/g, 'هاذه');
  normalized = normalized.replace(/هذين/g, 'هاذين');
  normalized = normalized.replace(/هذان/g, 'هاذان');
  normalized = normalized.replace(/هؤلاء/g, 'هاولاء');
  normalized = normalized.replace(/ذلك/g, 'ذالك');

  // 10. Equate Rahman/Rahmaan variants so that search works seamlessly
  normalized = normalized.replace(/الرحمان/g, 'الرحمن');
  normalized = normalized.replace(/رحمان/g, 'رحمن');

  // 11. Equate Samawat/Samawaat variants so that search works seamlessly
  normalized = normalized.replace(/السموات/g, 'السماوات');
  normalized = normalized.replace(/سموات/g, 'سماوات');
  
  return normalized;
}

export interface SurahListItem {
  id: number;
  name: string;
}

export const ALL_SURAHS: SurahListItem[] = [
  { id: 1, name: "الفاتحة" },
  { id: 2, name: "البقرة" },
  { id: 3, name: "آل عمران" },
  { id: 4, name: "النساء" },
  { id: 5, name: "المائدة" },
  { id: 6, name: "الأنعام" },
  { id: 7, name: "الأعراف" },
  { id: 8, name: "الأنفال" },
  { id: 9, name: "التوبة" },
  { id: 10, name: "يونس" },
  { id: 11, name: "هود" },
  { id: 12, name: "يوسف" },
  { id: 13, name: "الرعد" },
  { id: 14, name: "إبراهيم" },
  { id: 15, name: "الحجر" },
  { id: 16, name: "النحل" },
  { id: 17, name: "الإسراء" },
  { id: 18, name: "الكهف" },
  { id: 19, name: "مريم" },
  { id: 20, name: "طه" },
  { id: 21, name: "الأنبياء" },
  { id: 22, name: "الحج" },
  { id: 23, name: "المؤمنون" },
  { id: 24, name: "النور" },
  { id: 25, name: "الفرقان" },
  { id: 26, name: "الشعراء" },
  { id: 27, name: "النمل" },
  { id: 28, name: "القصص" },
  { id: 29, name: "العنكبوت" },
  { id: 30, name: "الروم" },
  { id: 31, name: "لقمان" },
  { id: 32, name: "السجدة" },
  { id: 33, name: "الأحزاب" },
  { id: 34, name: "سبأ" },
  { id: 35, name: "فاطر" },
  { id: 36, name: "يس" },
  { id: 37, name: "الصافات" },
  { id: 38, name: "ص" },
  { id: 39, name: "الزمر" },
  { id: 40, name: "غافر" },
  { id: 41, name: "فصلت" },
  { id: 42, name: "الشورى" },
  { id: 43, name: "الزخرف" },
  { id: 44, name: "الدخان" },
  { id: 45, name: "الجاثية" },
  { id: 46, name: "الأحقاف" },
  { id: 47, name: "محمد" },
  { id: 48, name: "الفتح" },
  { id: 49, name: "الحجرات" },
  { id: 50, name: "ق" },
  { id: 51, name: "الذاريات" },
  { id: 52, name: "الطور" },
  { id: 53, name: "النجم" },
  { id: 54, name: "القمر" },
  { id: 55, name: "الرحمن" },
  { id: 56, name: "الواقعة" },
  { id: 57, name: "الحديد" },
  { id: 58, name: "المجادلة" },
  { id: 59, name: "الحشر" },
  { id: 60, name: "الممتحنة" },
  { id: 61, name: "الصف" },
  { id: 62, name: "الجمعة" },
  { id: 63, name: "المنافقون" },
  { id: 64, name: "التغابن" },
  { id: 65, name: "الطلاق" },
  { id: 66, name: "التحريم" },
  { id: 67, name: "الملك" },
  { id: 68, name: "القلم" },
  { id: 69, name: "الحاقة" },
  { id: 70, name: "المعارج" },
  { id: 71, name: "نوح" },
  { id: 72, name: "الجن" },
  { id: 73, name: "المزمل" },
  { id: 74, name: "المدثر" },
  { id: 75, name: "القيامة" },
  { id: 76, name: "الإنسان" },
  { id: 77, name: "المرسلات" },
  { id: 78, name: "النبأ" },
  { id: 79, name: "النازعات" },
  { id: 80, name: "عبس" },
  { id: 81, name: "التكوير" },
  { id: 82, name: "الانفطار" },
  { id: 83, name: "المطففين" },
  { id: 84, name: "الانشقاق" },
  { id: 85, name: "البروج" },
  { id: 86, name: "الطارق" },
  { id: 87, name: "الأعلى" },
  { id: 88, name: "الغاشية" },
  { id: 89, name: "الفجر" },
  { id: 90, name: "البلد" },
  { id: 91, name: "الشمس" },
  { id: 92, name: "الليل" },
  { id: 93, name: "الضحى" },
  { id: 94, name: "الشرح" },
  { id: 95, name: "التين" },
  { id: 96, name: "العلق" },
  { id: 97, name: "القدر" },
  { id: 98, name: "البينة" },
  { id: 99, name: "الزلزلة" },
  { id: 100, name: "العاديات" },
  { id: 101, name: "القارعة" },
  { id: 102, name: "التكاثر" },
  { id: 103, name: "العصر" },
  { id: 104, name: "الهمزة" },
  { id: 105, name: "الفيل" },
  { id: 106, name: "قريش" },
  { id: 107, name: "الماعون" },
  { id: 108, name: "الكوثر" },
  { id: 109, name: "الكافرون" },
  { id: 110, name: "النصر" },
  { id: 111, name: "المسد" },
  { id: 112, name: "الإخلاص" },
  { id: 113, name: "الفلق" },
  { id: 114, name: "الناس" }
];

export function getNooraniRank(surahId: number): number | null {
  const index = NOORANI_SURAHS.findIndex(s => s.id === surahId);
  return index !== -1 ? index + 1 : null;
}

// 6-Condition Compatibility Engine Helpers
export function getCompatibilityDetails(v: any, s: NooraniSurah | { id: number; name: string; letters?: string; keyValue?: number; digitalRoot?: number }) {
  if (!v) {
    return {
      jummal: 0,
      wordCount: 0,
      letterCount: 0,
      score: 0,
      structuralVal: 0,
      densityVal: 0,
      cumulativeVal: 0,
      statusLabel: 'غير متوافقة',
      statusColor: 'bg-rose-50 text-rose-700 border-rose-100',
      conditions: [false, false, false, false, false, false],
      isTawheedCompatible: false,
      isTawheedCompatibleJoint: false,
      isTawheedCompatibleSelf: false,
      tawheedDensitySum: 0,
      tawheedFirstStepReduction: 0,
      finalReduction: 0,
      shuraHameem: null,
      shuraAsaq: null,
      isNoorani: false,
      reducedFactor: 1,
      jummalReduced: 0,
      newColumnProduct: 0,
      finalSingleDigit: 0,
      singleFingerprint: 0,
      verseDigitalRoot: 0,
      digitalReduction: 0,
      densityReduction: 0,
      isDominantNine: false,
      isDigitalMirror: false,
      verseNumReduced: 0,
      isVerseFingerprint: false,
      isOriginalMatch: false,
      isDensityMatch: false,
      nooraniRank: null,
      nooraniRankDigitalRoot: 0,
      isNooraniRankMatch: false,
      surahIdDigitalRoot: 0,
      isSurahIdMatch: false,
      isCompactBasic: false,
      isCompactDense: false,
      compactStatus: 'غير محققة',
      compactReasons: [],
      isIntegratedTawheed: false,
      isDirectMatch: false,
      originalFactorValue: 0
    };
  }

  const text = v.rawText || v.text || '';
  const surahId = typeof s?.id === 'number' && !isNaN(s.id) ? s.id : (typeof v.surahId === 'number' && !isNaN(v.surahId) ? v.surahId : 1);
  const surahObj: { id: number; name: string; letters?: string; keyValue?: number; digitalRoot?: number } = s || {
    id: surahId,
    name: v.surahName || `سورة ${surahId}`,
    letters: '',
    keyValue: 0,
    digitalRoot: reduceDigitalRoot(surahId)
  };

  const N = (typeof surahObj.keyValue === 'number' && !isNaN(surahObj.keyValue)) ? surahObj.keyValue : 0;
  const R = (typeof surahObj.digitalRoot === 'number' && !isNaN(surahObj.digitalRoot) && surahObj.digitalRoot > 0)
    ? surahObj.digitalRoot
    : reduceDigitalRoot(surahId);

  let jummal = (typeof v.jummalValue === 'number' && !isNaN(v.jummalValue)) ? v.jummalValue : 0;
  let wordCount = (typeof v.wordCount === 'number' && !isNaN(v.wordCount)) ? v.wordCount : 0;
  let letterCount = (typeof v.letterCount === 'number' && !isNaN(v.letterCount)) ? v.letterCount : 0;

  if (!jummal || isNaN(jummal) || !wordCount || !letterCount) {
    const rawWords = text.trim().split(/\s+/).filter((w: string) => w.length > 0);
    const wordsAnalysis = rawWords.map((w: string) => analyzeWord(w));
    if (!jummal || isNaN(jummal)) {
      jummal = wordsAnalysis.reduce((sum: number, w: any) => sum + w.jummalValue, 0);
    }
    if (!letterCount || isNaN(letterCount)) {
      letterCount = wordsAnalysis.reduce((sum: number, w: any) => sum + w.letterCount, 0);
    }
    if (!wordCount || isNaN(wordCount)) {
      wordCount = wordsAnalysis.filter((w: any) => w.cleanWord.length > 0).length || rawWords.length;
    }
  }

  const verseNum = typeof v.verseNumber === 'number' && !isNaN(v.verseNumber)
    ? v.verseNumber
    : (parseInt(v.verseNumber, 10) || 1);

  const structuralVal = jummal + verseNum;
  const densityVal = wordCount + letterCount;
  const cumulativeVal = jummal + structuralVal + densityVal;
  const verseDigitalRoot = reduceDigitalRoot(jummal);
  const jummalReduced = verseDigitalRoot;

  const getDigitSum = (num: number): number => String(num).split('').reduce((sum, d) => sum + (parseInt(d, 10) || 0), 0);

  // Pure density sum: Words + Letters (as explicitly requested for Tawheed)
  const tawheedDensityOnlySum = wordCount + letterCount;
  const tawheedFirstStepReductionDensity = getDigitSum(tawheedDensityOnlySum);

  // Joint density sum: Words + Letters + Verse Number
  const tawheedDensitySum = wordCount + letterCount + verseNum;
  const tawheedFirstStepReductionJoint = getDigitSum(tawheedDensitySum);

  const isTawheedCompatibleJoint = (tawheedFirstStepReductionDensity === 11) || (tawheedFirstStepReductionJoint === 11);

  const tawheedFirstStepReduction = (tawheedFirstStepReductionDensity === 11) 
    ? tawheedFirstStepReductionDensity 
    : ((tawheedFirstStepReductionJoint === 11) ? tawheedFirstStepReductionJoint : tawheedFirstStepReductionDensity);

  let isTawheedCompatibleSelf = false;
  let finalReduction = tawheedFirstStepReduction;

  let working = tawheedFirstStepReduction;
  while (working > 9) {
    working = getDigitSum(working);
  }
  finalReduction = working;

  if (!isTawheedCompatibleJoint && finalReduction === 1) {
    isTawheedCompatibleSelf = true;
  }

  // Compute Al-Shura and general Hameem properties if surahObj.letters includes 'حم'
  let shuraHameem = null;
  let shuraAsaq = null;
  if (surahObj.letters && surahObj.letters.includes('حم')) {
    shuraHameem = {
      divisor: 3,
      result: (jummal / 3),
      isInteger: (jummal % 3 === 0),
      statusLabel: (jummal % 3 === 0) ? 'متزن حم (مضاعف لـ 3) ✅' : 'كسر بنياني حم ❌',
      statusColor: (jummal % 3 === 0) ? 'bg-teal-50 text-teal-800 border-teal-200 font-bold' : 'bg-slate-50 text-slate-400 border-slate-200'
    };
  }
  if (surahId === 42) {
    shuraAsaq = {
      divisor: 5,
      result: (jummal / 5),
      isInteger: (jummal % 5 === 0),
      statusLabel: (jummal % 5 === 0) ? 'متزن عسق (مضاعف لـ 5) 🌟' : 'كسر بنياني عسق ❌',
      statusColor: (jummal % 5 === 0) ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold' : 'bg-slate-50 text-slate-400 border-slate-200'
    };
  }

  // --- NEW INTEGRATED COMPATIBILITY CALCULATIONS ---
  const isNoorani = Boolean(surahObj.letters && surahObj.letters !== '');
  const reducedFactor = isNoorani ? (R || reduceDigitalRoot(surahId)) : reduceDigitalRoot(surahId);
  
  // Formula: [حساب الجمل المختزل] × [رقم الآية + المعامل المختزل]
  const newColumnProduct = verseDigitalRoot * (verseNum + reducedFactor);
  const finalSingleDigit = reduceDigitalRoot(newColumnProduct);

  const isDominantNine = finalSingleDigit === 9;
  const isDigitalMirror = finalSingleDigit === reducedFactor;
  const verseNumReduced = reduceDigitalRoot(verseNum);
  const isVerseFingerprint = finalSingleDigit === verseNumReduced;

  const isOriginalMatch = finalSingleDigit === verseDigitalRoot;
  const densityReduction = reduceDigitalRoot(densityVal);
  const isDensityMatch = finalSingleDigit === densityReduction;

  // Noorani 29 Rank Match
  const nooraniRank = getNooraniRank(surahId);
  const nooraniRankDigitalRoot = nooraniRank ? reduceDigitalRoot(nooraniRank) : 0;
  const isNooraniRankMatch = nooraniRankDigitalRoot > 0 && finalSingleDigit === nooraniRankDigitalRoot;
  const surahIdDigitalRoot = reduceDigitalRoot(surahId);
  const isSurahIdMatch = finalSingleDigit === surahIdDigitalRoot;

  let compactStatus = 'غير محققة';
  let isCompactBasic = false;
  let isCompactDense = false;
  const compactReasons: string[] = [];

  if (finalSingleDigit === 9) {
    compactReasons.push('ذاتي سائد (9)');
  }
  if (isOriginalMatch) {
    compactReasons.push('اختزال أصلي');
  }
  if (isDensityMatch) {
    compactReasons.push('اختزال كثيفي');
  }
  if (isDigitalMirror) {
    compactReasons.push('مرآة رقمية');
  }
  if (isVerseFingerprint) {
    compactReasons.push('بصمة الآية');
  }
  if (isNooraniRankMatch) {
    compactReasons.push(`ترتيب نوراني (${nooraniRank})`);
  }
  if (isSurahIdMatch) {
    compactReasons.push(`رقم السورة (${surahId})`);
  }

  if (finalSingleDigit === 9 || isOriginalMatch || isNooraniRankMatch || isDigitalMirror || isVerseFingerprint) {
    compactStatus = '[✨ توافق مدمج محقق]';
    isCompactBasic = true;
  } else if (isDensityMatch) {
    compactStatus = '[✨ توافق مدمج كثيفي محقق]';
    isCompactDense = true;
  }

  const isIntegratedTawheed = isCompactBasic || isCompactDense || isDominantNine || isDigitalMirror || isVerseFingerprint || isNooraniRankMatch || isSurahIdMatch;

  const originalFactorValue = isNoorani ? (N || surahId) : surahId;
  const isDirectMatch = jummal === originalFactorValue;

  const cond1 = (N > 0 && jummal % N === 0) || (R > 0 && jummal % R === 0);
  const cond2 = (N > 0 && structuralVal % N === 0) || (R > 0 && structuralVal % R === 0);
  const cond3 = (N > 0 && densityVal % N === 0) || (R > 0 && densityVal % R === 0);
  const cond4 = (N > 0 && cumulativeVal % N === 0) || (R > 0 && cumulativeVal % R === 0);
  const cond5 = R > 0 && (verseDigitalRoot === R);
  const cond6 = R > 0 && ((verseNum % R === 0) || (verseNum === R));

  let score = 0;
  if (cond1) score++;
  if (cond2) score++;
  if (cond3) score++;
  if (cond4) score++;
  if (cond5) score++;
  if (cond6) score++;

  let statusLabel = '';
  let statusColor = '';
  if (score === 0) {
    statusLabel = 'غير متوافقة';
    statusColor = 'bg-rose-50 text-rose-700 border-rose-100';
  } else if (score >= 1 && score <= 2) {
    statusLabel = 'متوافقة بنيوياً';
    statusColor = 'bg-blue-50 text-blue-700 border-blue-100';
  } else if (score >= 3 && score <= 5) {
    statusLabel = 'متوافقة تماماً';
    statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-100';
  } else if (score === 6) {
    statusLabel = 'مفتاح بنياني مطلق 🌟';
    statusColor = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
  }

  return {
    jummal,
    wordCount,
    letterCount,
    score,
    structuralVal,
    densityVal,
    cumulativeVal,
    statusLabel,
    statusColor,
    conditions: [cond1, cond2, cond3, cond4, cond5, cond6],
    isTawheedCompatible: isTawheedCompatibleJoint || isTawheedCompatibleSelf,
    isTawheedCompatibleJoint,
    isTawheedCompatibleSelf,
    tawheedDensitySum,
    tawheedFirstStepReduction,
    finalReduction,
    shuraHameem,
    shuraAsaq,
    isNoorani,
    reducedFactor,
    jummalReduced,
    newColumnProduct,
    finalSingleDigit,
    singleFingerprint: finalSingleDigit,
    verseDigitalRoot,
    digitalReduction: verseDigitalRoot,
    densityReduction,
    isDominantNine,
    isDigitalMirror,
    verseNumReduced,
    isVerseFingerprint,
    isOriginalMatch,
    isDensityMatch,
    nooraniRank,
    nooraniRankDigitalRoot,
    isNooraniRankMatch,
    surahIdDigitalRoot,
    isSurahIdMatch,
    isCompactBasic,
    isCompactDense,
    compactStatus,
    compactReasons,
    isIntegratedTawheed,
    isDirectMatch,
    originalFactorValue
  };
}

/**
 * Evaluates whether a verse satisfies the strict Triple Match Elite criteria:
 * 1. Condition 1: High Compatibility (score 6/6 or 5/6)
 * 2. Condition 2: Surah / Self Fingerprint Verification (singleFingerprint matches verseDigitalRoot, verseNumReduced, surahIdDigitalRoot, or revelationOrderDigitalRoot)
 * 3. Condition 3: Noorani Coefficient Influence (isCoeffDivisible or matchesCoeffFingerprint)
 */
export function isTripleMatchElite(
  v: any,
  s: NooraniSurah,
  surahMeta?: { revelationOrder?: number }
): {
  isTripleMatch: boolean;
  cond1: boolean;
  cond2: boolean;
  cond3: boolean;
} {
  const comp = getCompatibilityDetails(v, s);
  const singleFingerprint = comp.finalSingleDigit;

  // 1. Condition 1: High Compatibility (6/6 OR 5/6)
  const cond1 = comp.score === 6 || comp.score === 5;

  // 2. Condition 2: Surah / Self Fingerprint Verification
  const verseDigitalRoot = comp.verseDigitalRoot;
  const verseNumReduced = comp.verseNumReduced;
  const surahIdDigitalRoot = reduceDigitalRoot(s.id);
  const revOrderDigitalRoot = surahMeta?.revelationOrder ? reduceDigitalRoot(surahMeta.revelationOrder) : 0;
  const nooraniRankDigitalRoot = comp.nooraniRankDigitalRoot || 0;

  const cond2 =
    singleFingerprint === verseDigitalRoot ||
    singleFingerprint === verseNumReduced ||
    singleFingerprint === surahIdDigitalRoot ||
    (revOrderDigitalRoot > 0 && singleFingerprint === revOrderDigitalRoot) ||
    (nooraniRankDigitalRoot > 0 && singleFingerprint === nooraniRankDigitalRoot);

  // 3. Condition 3: Noorani Coefficient Influence
  const isCoeffDivisible =
    comp.conditions[0] || // cond1: jummal % N === 0 or jummal % R === 0
    comp.isDirectMatch ||
    (s.keyValue > 0 && v.jummalValue % s.keyValue === 0) ||
    (comp.reducedFactor > 0 && v.jummalValue % comp.reducedFactor === 0);

  const matchesCoeffFingerprint =
    singleFingerprint === comp.reducedFactor ||
    (s.keyValue > 0 && singleFingerprint === reduceDigitalRoot(s.keyValue)) ||
    singleFingerprint === reduceDigitalRoot(s.id);

  const cond3 = isCoeffDivisible || matchesCoeffFingerprint;

  const isTripleMatch = cond1 && cond2 && cond3;

  return { isTripleMatch, cond1, cond2, cond3 };
}

export function getAchievedCompatibilities(v: any, s: NooraniSurah): string[] {
  const comp = getCompatibilityDetails(v, s);
  const labels = [
    "الميزان الرقمي الأكبر (الجمل)",
    "الميزان الهيكلي البنيوي (جمل + آية)",
    "ميزان الكثافة اللفظية والحرفية (كلمات + حروف)",
    "الميزان التراكمي الشامل",
    "ميزان الاختزال الذاتي الفردي (أس الآية)",
    "ميزان رقم الآية السنني"
  ];
  const achieved: string[] = [];
  comp.conditions.forEach((c, idx) => {
    if (c) {
      achieved.push(labels[idx]);
    }
  });
  if (comp.isTawheedCompatibleJoint) {
    achieved.push("التوافق التوحيدي البنيوي المشترك 🌟");
  }
  if (comp.isTawheedCompatibleSelf) {
    achieved.push("التوافق التوحيدي الذاتي 🌟");
  }
  return achieved;
}


