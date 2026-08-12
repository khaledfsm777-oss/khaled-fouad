import { QuranVerse, part1 } from './quranParts/part1';
import { part2 } from './quranParts/part2';
import { part3 } from './quranParts/part3';
import { part4 } from './quranParts/part4';

export type { QuranVerse };

export const quranData: QuranVerse[] = [
  ...part1,
  ...part2,
  ...part3,
  ...part4
];

export default quranData;
