const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../src/utils/quranData.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('Loaded verses count:', data.length);

const partsDir = path.join(__dirname, '../src/utils/quranParts');
if (!fs.existsSync(partsDir)) {
  fs.mkdirSync(partsDir, { recursive: true });
}

const p1 = data.filter(v => v.surahId >= 1 && v.surahId <= 20);
const p2 = data.filter(v => v.surahId >= 21 && v.surahId <= 50);
const p3 = data.filter(v => v.surahId >= 51 && v.surahId <= 80);
const p4 = data.filter(v => v.surahId >= 81 && v.surahId <= 114);

const header = `export interface QuranVerse {
  id: number;
  surahId: number;
  surahName: string;
  verseNumber: number;
  text: string;
}\n\n`;

fs.writeFileSync(path.join(partsDir, 'part1.ts'), header + 'export const part1: QuranVerse[] = ' + JSON.stringify(p1, null, 2) + ';\n', 'utf8');
fs.writeFileSync(path.join(partsDir, 'part2.ts'), header + 'export const part2: QuranVerse[] = ' + JSON.stringify(p2, null, 2) + ';\n', 'utf8');
fs.writeFileSync(path.join(partsDir, 'part3.ts'), header + 'export const part3: QuranVerse[] = ' + JSON.stringify(p3, null, 2) + ';\n', 'utf8');
fs.writeFileSync(path.join(partsDir, 'part4.ts'), header + 'export const part4: QuranVerse[] = ' + JSON.stringify(p4, null, 2) + ';\n', 'utf8');

const mainTsContent = `import { QuranVerse, part1 } from './quranParts/part1';
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
`;

fs.writeFileSync(path.join(__dirname, '../src/utils/quranData.ts'), mainTsContent, 'utf8');

console.log('Successfully created modular parts!');
console.log('Part 1:', p1.length);
console.log('Part 2:', p2.length);
console.log('Part 3:', p3.length);
console.log('Part 4:', p4.length);
