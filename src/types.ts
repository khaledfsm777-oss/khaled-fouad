export interface WordAnalysis {
  word: string;
  cleanWord: string;
  jummalValue: number;
  letterCount: number;
}

export interface Verse {
  id: number;
  verseIndex: number; // sequential 1, 2, 3...
  verseNumber: string; // extracted identifier e.g. "1", "ب"
  rawText: string;     // uncleaned original portion
  text: string;        // diacritics removed or preserved depending on toggle
  cleanTextForCalculation: string; // thoroughly cleaned Arabic alphabetical letters only
  jummalValue: number;
  wordCount: number;
  letterCount: number;
  words: WordAnalysis[];
  surahId?: number;
  surahName?: string;
}

export interface AnalysisSummary {
  totalVerses: number;
  totalWords: number;
  totalLetters: number;
  totalJummal: number;
  mizan8Count: number; // verses matching mizan 8 structure
  mizan3Count: number; // verses matching mizan 3 structure
  mizan6Count: number; // verses matching mizan 6 structure
}
