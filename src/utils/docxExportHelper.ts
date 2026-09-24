import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  PageOrientation,
} from 'docx';

interface SurahExportMeta {
  id: number;
  name: string;
  letters?: string;
  keyValue?: number;
  digitalRoot?: number;
  orderInQuran?: number;
  revelationOrder?: number;
  revelationPlace?: string;
  juzStartEnd?: string;
  hizbStartEnd?: string;
}

interface TableRowData {
  index: number;
  verseNumber: string | number;
  text: string;
  jummalValue: number;
  coeffLabel: string;
  quotientStr: string;
  isExact: boolean;
  statusLabel: string;
  singleDigit: number;
  equationText?: string;
  isCompactMatch?: boolean;
  jummalReduction: number;
  wordCount: number;
  wordsReduction: number;
  letterCount: number;
  lettersReduction: number;
  sum: number;
  sumReduction: number;
  achieved: string;
}

interface NooraniWordMatch {
  word: string;
  matchedLetters: string[];
  wordJummal: number;
  lettersJummal: number;
  verseNumber: string | number;
  isExact: boolean;
  quotientStr: string;
}

const FONT_NAME = 'Arial';

/**
 * Creates a standard styled cell with RTL support and clean borders
 */
function createStyledCell(options: {
  text: string;
  bold?: boolean;
  size?: number; // half-points (e.g. 18 = 9pt, 20 = 10pt, 22 = 11pt, 24 = 12pt)
  color?: string;
  bgColor?: string;
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  widthPercent?: number;
}): TableCell {
  const {
    text,
    bold = false,
    size = 18,
    color = '1E293B',
    bgColor,
    align = AlignmentType.CENTER,
  } = options;

  return new TableCell({
    shading: bgColor
      ? {
          type: ShadingType.CLEAR,
          fill: bgColor.replace('#', ''),
          color: 'auto',
        }
      : undefined,
    margins: {
      top: convertInchesToTwip(0.06),
      bottom: convertInchesToTwip(0.06),
      left: convertInchesToTwip(0.08),
      right: convertInchesToTwip(0.08),
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    },
    children: [
      new Paragraph({
        alignment: align,
        bidirectional: true,
        children: [
          new TextRun({
            text: text || '',
            bold,
            size,
            color: color.replace('#', ''),
            font: FONT_NAME,
            rightToLeft: true,
          }),
        ],
      }),
    ],
  });
}

/**
 * Converts markdown text into structured DOCX Paragraphs
 */
function markdownToDocxParagraphs(md: string): Paragraph[] {
  if (!md) return [];
  const lines = md.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      // Empty line -> small spacer
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [],
        })
      );
      continue;
    }

    if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { before: 200, after: 100 },
          children: [
            new TextRun({
              text: line.replace(/^###\s+/, ''),
              bold: true,
              size: 24, // 12pt
              color: 'B45309',
              font: FONT_NAME,
              rightToLeft: true,
            }),
          ],
        })
      );
    } else if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { before: 260, after: 140 },
          children: [
            new TextRun({
              text: line.replace(/^##\s+/, ''),
              bold: true,
              size: 28, // 14pt
              color: '0F172A',
              font: FONT_NAME,
              rightToLeft: true,
            }),
          ],
        })
      );
    } else if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          bidirectional: true,
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 160 },
          children: [
            new TextRun({
              text: line.replace(/^#\s+/, ''),
              bold: true,
              size: 32, // 16pt
              color: '0F172A',
              font: FONT_NAME,
              rightToLeft: true,
            }),
          ],
        })
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const cleanBullet = line.replace(/^[-*]\s+/, '');
      paragraphs.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          bullet: { level: 0 },
          spacing: { after: 80 },
          children: parseInlineDocxFormatting(cleanBullet, 20),
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { after: 140 },
          children: parseInlineDocxFormatting(line, 22),
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Parses bold markdown markers **text** inside paragraph lines
 */
function parseInlineDocxFormatting(text: string, defaultSize = 22): TextRun[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  const runs: TextRun[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          size: defaultSize,
          color: '0F172A',
          font: FONT_NAME,
          rightToLeft: true,
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          bold: false,
          size: defaultSize,
          color: '334155',
          font: FONT_NAME,
          rightToLeft: true,
        })
      );
    }
  }

  return runs;
}

/**
 * Generates a native, compliant, high-quality .docx file for the Main Output Table
 */
export async function generateTableDocxBlob(options: {
  surahMeta: SurahExportMeta;
  isNoorani: boolean;
  totalWords: number;
  totalLetters: number;
  totalJummal: number;
  rows: TableRowData[];
}): Promise<Blob> {
  const { surahMeta, isNoorani, totalWords, totalLetters, totalJummal, rows } = options;

  const headerTitles = [
    'م',
    'الآية',
    'النص القرآني الكريـم',
    'الجُمَّل',
    'المعامل',
    'القسمة',
    'الموازنة',
    'البصمة الأحادية',
    'اختزال الجمل',
    'الكلمات',
    'الحروف',
    'المجموع',
    'التوافقات المحققة',
  ];

  // Table header row
  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: headerTitles.map((title) =>
      createStyledCell({
        text: title,
        bold: true,
        size: 19,
        color: 'FFFFFF',
        bgColor: '0F172A',
        align: AlignmentType.CENTER,
      })
    ),
  });

  // Table data rows
  const tableDataRows = rows.map((r, idx) => {
    const isEven = idx % 2 === 0;
    const rowBg = r.isExact ? 'D1FAE5' : isEven ? 'F8FAFC' : 'FFFFFF';
    const statusText = r.isExact ? 'متوافقة ✅' : 'غير متوافقة ❌';
    const statusColor = r.isExact ? '065F46' : '64748B';

    return new TableRow({
      children: [
        createStyledCell({ text: String(r.index), size: 17, bgColor: rowBg }),
        createStyledCell({ text: String(r.verseNumber), bold: true, size: 18, bgColor: rowBg }),
        createStyledCell({
          text: `( ${r.text} )`,
          bold: true,
          size: 19,
          color: '0F172A',
          bgColor: r.isExact ? 'ECFDF5' : 'FAF8F5',
          align: AlignmentType.RIGHT,
        }),
        createStyledCell({ text: String(r.jummalValue), bold: true, size: 18, color: '0F172A', bgColor: rowBg }),
        createStyledCell({ text: r.coeffLabel, size: 17, bgColor: rowBg }),
        createStyledCell({ text: r.quotientStr, bold: true, size: 17, color: '0F172A', bgColor: rowBg }),
        createStyledCell({ text: statusText, bold: true, size: 17, color: statusColor, bgColor: rowBg }),
        createStyledCell({ text: String(r.singleDigit), bold: true, size: 18, color: 'B45309', bgColor: rowBg }),
        createStyledCell({ text: String(r.jummalReduction), bold: true, size: 18, bgColor: rowBg }),
        createStyledCell({ text: String(r.wordCount), size: 17, bgColor: rowBg }),
        createStyledCell({ text: String(r.letterCount), size: 17, bgColor: rowBg }),
        createStyledCell({ text: String(r.sum), bold: true, size: 18, bgColor: rowBg }),
        createStyledCell({ text: r.achieved || 'لا يوجد', size: 16, color: '475569', bgColor: rowBg, align: AlignmentType.RIGHT }),
      ],
    });
  });

  const mainTable = new Table({
    alignment: AlignmentType.CENTER,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeaderRow, ...tableDataRows],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
            },
          },
        },
        children: [
          // Title Banner
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 80 },
            children: [
              new TextRun({
                text: '« بِرْنَامَج البُنْيَان لِلْقُرْآنِ الكَرِيمِ »',
                bold: true,
                size: 32, // 16pt
                color: '0F172A',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `تقرير المخرجات وجداول البنيان الاستقصائية لآيات سورة: ${surahMeta.name}`,
                bold: true,
                size: 24, // 12pt
                color: 'B45309',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),

          // Metadata Card
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `• بيانات السورة: سورة ${surahMeta.name} (ترتيب المصحف: ${surahMeta.orderInQuran || surahMeta.id} | ترتيب النزول: ${surahMeta.revelationOrder || '-'})`,
                bold: true,
                size: 20,
                color: '334155',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: isNoorani
                  ? `• المفتاح النوراني النشط: "${surahMeta.letters}" (القيمة الحسابية: ${surahMeta.keyValue} | معامل الاختزال: ${surahMeta.digitalRoot})`
                  : `• المنهجية: السور غير النورانية (معامل السورة: ${surahMeta.id})`,
                size: 20,
                color: '334155',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `• إجمالي الآيات المدروسة: ${rows.length} آية | إجمالي الكلمات: ${totalWords} كلمة | إجمالي الحروف: ${totalLetters} حرف | إجمالي حساب الجمل: ${totalJummal}`,
                bold: true,
                size: 20,
                color: '047857',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),

          // Table
          mainTable,

          // Footer
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.CENTER,
            spacing: { before: 240 },
            children: [
              new TextRun({
                text: `«منظومة البنيان للقرآن الكريم» • تم إعداد الدراسة الاستقصائية وتوليد ملف Word (.docx) الأصلي بنجاح • تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}`,
                size: 16,
                color: '94A3B8',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Generates a native, compliant, high-quality .docx file for the Comprehensive Academic Report
 */
export async function generateComprehensiveReportDocxBlob(options: {
  surahMeta: SurahExportMeta;
  isNoorani: boolean;
  totalWords: number;
  totalLetters: number;
  totalJummal: number;
  combinedAnalysisMarkdown: string;
  rows: TableRowData[];
  nooraniMatches?: NooraniWordMatch[];
}): Promise<Blob> {
  const {
    surahMeta,
    isNoorani,
    totalWords,
    totalLetters,
    totalJummal,
    combinedAnalysisMarkdown,
    rows,
    nooraniMatches = [],
  } = options;

  // Header Titles
  const headerTitles = isNoorani
    ? ['م', 'الآية', 'الآية الكريمة', 'حساب الجمل', 'المعامل', 'القسمة', 'الموازنة', 'الاختزال', 'الكلمات', 'الحروف', 'المجموع']
    : ['م', 'الآية', 'الآية الكريمة', 'حساب الجمل', 'الاختزال الرقمي', 'الكلمات', 'الحروف', 'المجموع'];

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: headerTitles.map((title) =>
      createStyledCell({
        text: title,
        bold: true,
        size: 19,
        color: 'FFFFFF',
        bgColor: '0F172A',
        align: AlignmentType.CENTER,
      })
    ),
  });

  const tableDataRows = rows.map((r, idx) => {
    const isEven = idx % 2 === 0;
    const rowBg = r.isExact ? 'D1FAE5' : isEven ? 'F8FAFC' : 'FFFFFF';
    const statusText = r.isExact ? 'متوافقة ✅' : 'غير متوافقة ❌';
    const statusColor = r.isExact ? '065F46' : '64748B';

    if (isNoorani) {
      return new TableRow({
        children: [
          createStyledCell({ text: String(r.index), size: 17, bgColor: rowBg }),
          createStyledCell({ text: String(r.verseNumber), bold: true, size: 18, bgColor: rowBg }),
          createStyledCell({ text: `( ${r.text} )`, bold: true, size: 19, color: '0F172A', bgColor: r.isExact ? 'ECFDF5' : 'FAF8F5', align: AlignmentType.RIGHT }),
          createStyledCell({ text: String(r.jummalValue), bold: true, size: 18, color: '0F172A', bgColor: rowBg }),
          createStyledCell({ text: r.coeffLabel, size: 17, bgColor: rowBg }),
          createStyledCell({ text: r.quotientStr, bold: true, size: 17, color: '0F172A', bgColor: rowBg }),
          createStyledCell({ text: statusText, bold: true, size: 17, color: statusColor, bgColor: rowBg }),
          createStyledCell({ text: String(r.jummalReduction), bold: true, size: 18, bgColor: rowBg }),
          createStyledCell({ text: String(r.wordCount), size: 17, bgColor: rowBg }),
          createStyledCell({ text: String(r.letterCount), size: 17, bgColor: rowBg }),
          createStyledCell({ text: String(r.sum), bold: true, size: 18, bgColor: rowBg }),
        ],
      });
    } else {
      return new TableRow({
        children: [
          createStyledCell({ text: String(r.index), size: 17, bgColor: rowBg }),
          createStyledCell({ text: String(r.verseNumber), bold: true, size: 18, bgColor: rowBg }),
          createStyledCell({ text: `( ${r.text} )`, bold: true, size: 19, color: '0F172A', bgColor: rowBg, align: AlignmentType.RIGHT }),
          createStyledCell({ text: String(r.jummalValue), bold: true, size: 18, color: '0F172A', bgColor: rowBg }),
          createStyledCell({ text: String(r.jummalReduction), bold: true, size: 18, bgColor: rowBg }),
          createStyledCell({ text: String(r.wordCount), size: 17, bgColor: rowBg }),
          createStyledCell({ text: String(r.letterCount), size: 17, bgColor: rowBg }),
          createStyledCell({ text: String(r.sum), bold: true, size: 18, bgColor: rowBg }),
        ],
      });
    }
  });

  const detailedTable = new Table({
    alignment: AlignmentType.CENTER,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeaderRow, ...tableDataRows],
  });

  // Noorani Word Matches Table & Section
  let nooraniSectionElements: Paragraph[] = [];
  let nooraniTable: Table | null = null;

  if (isNoorani) {
    nooraniSectionElements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        spacing: { before: 300, after: 120 },
        children: [
          new TextRun({
            text: `القسم الثالث: الكلمات المتوافقة الشاملة لكافة الحروف النورانية الافتتاحية (${surahMeta.letters || ''})`,
            bold: true,
            size: 26,
            color: '064E3B',
            font: FONT_NAME,
            rightToLeft: true,
          }),
        ],
      })
    );

    if (nooraniMatches.length > 0) {
      nooraniSectionElements.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { after: 140 },
          children: [
            new TextRun({
              text: `يتضمن هذا القسم رصد وحصر الكلمات القرآنية الكريمة الواردة في الآيات المدروسة والتي تجمع في بنيتها اللفظية `,
              size: 22,
              color: '334155',
              font: FONT_NAME,
              rightToLeft: true,
            }),
            new TextRun({
              text: `كافة الحروف النورانية الافتتاحية للسورة الكريمة (مثل: "${surahMeta.letters || ''}") كاملةً `,
              bold: true,
              size: 22,
              color: '0F172A',
              font: FONT_NAME,
              rightToLeft: true,
            }),
            new TextRun({
              text: `مع تحقيق `,
              size: 22,
              color: '334155',
              font: FONT_NAME,
              rightToLeft: true,
            }),
            new TextRun({
              text: `التوافق الرياضي التام (القسمة الصرفة على معامل الاختزال ${surahMeta.digitalRoot || ''}) `,
              bold: true,
              size: 22,
              color: '047857',
              font: FONT_NAME,
              rightToLeft: true,
            }),
            new TextRun({
              text: `دون باقٍ، مما يبرز الإعجاز البنائي والتناغم المعجز بين حروف الفواتح وألفاظ التنزيل الحكيم:`,
              size: 22,
              color: '334155',
              font: FONT_NAME,
              rightToLeft: true,
            }),
          ],
        })
      );

      const nooraniHeaders = [
        'م',
        'الآية',
        'الكلمة المتوافقة',
        'جمل الكلمة',
        'الحروف النورانية الكاملة',
        'جمل الحروف النورانية',
        'التحقيق (القسمة الصرفة)',
        'الدلالة والربط الميزاني',
      ];

      const nooraniHeaderRow = new TableRow({
        tableHeader: true,
        children: nooraniHeaders.map((title) =>
          createStyledCell({
            text: title,
            bold: true,
            size: 19,
            color: 'FFFFFF',
            bgColor: '064E3B',
            align: AlignmentType.CENTER,
          })
        ),
      });

      const nooraniRows = nooraniMatches.map((m, idx) => {
        const rowBg = idx % 2 === 0 ? 'F0FDF4' : 'FFFFFF';
        return new TableRow({
          children: [
            createStyledCell({ text: String(idx + 1), size: 17, bgColor: rowBg }),
            createStyledCell({ text: String(m.verseNumber), bold: true, size: 18, bgColor: rowBg }),
            createStyledCell({ text: `"${m.word}"`, bold: true, size: 19, color: 'B45309', bgColor: 'FEF3C7' }),
            createStyledCell({ text: String(m.wordJummal), bold: true, size: 18, bgColor: rowBg }),
            createStyledCell({ text: m.matchedLetters.join(' - '), bold: true, size: 19, color: '0F172A', bgColor: rowBg }),
            createStyledCell({ text: String(m.lettersJummal), bold: true, size: 18, color: '047857', bgColor: rowBg }),
            createStyledCell({ text: `✅ متوافقة (${m.quotientStr})`, bold: true, size: 17, color: '047857', bgColor: rowBg }),
            createStyledCell({ text: 'تشتمل على كافة الحروف الافتتاحية ومحققة لميزان القسمة الصرفة التامة بالسورة.', size: 16, color: '334155', bgColor: rowBg, align: AlignmentType.RIGHT }),
          ],
        });
      });

      nooraniTable = new Table({
        alignment: AlignmentType.CENTER,
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [nooraniHeaderRow, ...nooraniRows],
      });
    } else {
      nooraniSectionElements.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          spacing: { after: 140 },
          children: [
            new TextRun({
              text: `• بيان الفحص الميزاني: لم يتم رصد كلمات في نطاق الآيات المدروسة حالياً تجمع بين اشتمالها على كافة الحروف النورانية الافتتاحية ("${surahMeta.letters || ''}") بالتمام مع تحقيق التوافق الرياضي الصرف بالقسمة الخالية من الكسور على معامل الاختزال (${surahMeta.digitalRoot || ''}).`,
              size: 20,
              color: '64748B',
              font: FONT_NAME,
              rightToLeft: true,
            }),
          ],
        })
      );
    }
  }

  // Section 1 Paragraphs from Markdown
  const analysisParagraphs = markdownToDocxParagraphs(combinedAnalysisMarkdown);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(0.6),
              left: convertInchesToTwip(0.6),
              right: convertInchesToTwip(0.6),
            },
          },
        },
        children: [
          // Banner
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: '« تَقْرِيرُ البُنْيَان الشَّامِل لِلْقُرْآنِ الكَرِيمِ »',
                bold: true,
                size: 34, // 17pt
                color: '0F172A',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `مخرجات دراسة وحساب موازين سورة: ${surahMeta.name}`,
                bold: true,
                size: 24, // 12pt
                color: 'B45309',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),

          // Metadata Info
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `🏛️ سياق وبيانات السورة: سورة ${surahMeta.name} (ترتيب المصحف: ${surahMeta.orderInQuran || surahMeta.id} | ترتيب النزول: ${surahMeta.revelationOrder || '-'} | الأجزاء: ${surahMeta.juzStartEnd || '-'})`,
                bold: true,
                size: 20,
                color: '1E293B',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `📊 إحصائيات الآيات المستخرجة: ${rows.length} آية | إجمالي الكلمات: ${totalWords} كلمة | إجمالي الحروف: ${totalLetters} حرف | إجمالي حساب الجمل: ${totalJummal}`,
                bold: true,
                size: 20,
                color: '047857',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),

          // Section: Academic and Numerical Study Report
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 200, after: 140 },
            children: [
              new TextRun({
                text: 'الدراسة الاستقصائية والتحليل البياني والعددي الأكاديمي',
                bold: true,
                size: 26,
                color: '0F172A',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),
          ...analysisParagraphs,

          // Footer
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.CENTER,
            spacing: { before: 300 },
            children: [
              new TextRun({
                text: `«منظومة البنيان للقرآن الكريم» • تم إعداد التقرير الأكاديمي وتوليد ملف Word (.docx) الأصلي بنجاح • تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}`,
                size: 16,
                color: '94A3B8',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Generates a specialized native Word (.docx) table for Extracted Noorani Words
 */
export async function generateNooraniWordsDocxBlob(options: {
  surahTitle: string;
  openingLetters: string;
  digitalRoot: number;
  words: Array<{
    index: number;
    surahName: string;
    verseNumber: number | string;
    word: string;
    matchedLetters: string[];
    wordJummal: number;
    lettersJummal: number;
    quotientStr: string;
    isExact: boolean;
    verseSnippet?: string;
  }>;
}): Promise<Blob> {
  const { surahTitle, openingLetters, digitalRoot, words } = options;

  const headerTitles = ['م', 'السورة', 'الآية', 'الكلمة القرآنية', 'الحروف النورانية', 'جمل الكلمة', 'جمل الحروف', 'القسمة / المعامل', 'المطابقة'];

  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: headerTitles.map((title) =>
      createStyledCell({
        text: title,
        bold: true,
        size: 19,
        color: 'FFFFFF',
        bgColor: '064E3B',
        align: AlignmentType.CENTER,
      })
    ),
  });

  const tableDataRows = words.map((w, idx) => {
    const isEven = idx % 2 === 0;
    const rowBg = w.isExact ? 'D1FAE5' : isEven ? 'F8FAFC' : 'FFFFFF';
    const statusText = w.isExact ? 'متوافقة ✅' : 'كسر ❌';
    const statusColor = w.isExact ? '065F46' : '64748B';

    return new TableRow({
      children: [
        createStyledCell({ text: String(w.index || idx + 1), size: 17, bgColor: rowBg }),
        createStyledCell({ text: w.surahName, bold: true, size: 18, bgColor: rowBg }),
        createStyledCell({ text: String(w.verseNumber), bold: true, size: 18, bgColor: rowBg }),
        createStyledCell({ text: w.word, bold: true, size: 20, color: '064E3B', bgColor: rowBg }),
        createStyledCell({ text: w.matchedLetters.join(' - '), bold: true, size: 18, color: '047857', bgColor: rowBg }),
        createStyledCell({ text: String(w.wordJummal), bold: true, size: 18, bgColor: rowBg }),
        createStyledCell({ text: String(w.lettersJummal), size: 17, bgColor: rowBg }),
        createStyledCell({ text: w.quotientStr, bold: true, size: 17, color: '0F172A', bgColor: rowBg }),
        createStyledCell({ text: statusText, bold: true, size: 17, color: statusColor, bgColor: rowBg }),
      ],
    });
  });

  const wordsTable = new Table({
    alignment: AlignmentType.CENTER,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeaderRow, ...tableDataRows],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            bidirectional: true,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `مستكشف الكلمات النورانية - منظومة البنيان`,
                bold: true,
                size: 32,
                color: '064E3B',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `جدول استخراج الكلمات المشتملة على الحروف النورانية الافتتاحية (${openingLetters}) • ${surahTitle} (المعامل: ${digitalRoot}) • إجمالي الكلمات المستخرجة: ${words.length}`,
                size: 20,
                bold: true,
                color: '334155',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),
          wordsTable,
          new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.CENTER,
            spacing: { before: 240 },
            children: [
              new TextRun({
                text: `«منظومة البنيان للقرآن الكريم» • تم تصدير جدول الكلمات النورانية بنجاح • تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`,
                size: 16,
                color: '94A3B8',
                font: FONT_NAME,
                rightToLeft: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
