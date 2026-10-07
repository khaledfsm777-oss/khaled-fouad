import ExcelJS from 'exceljs';

export interface ExcelTableParams {
  sheetTitle?: string;
  headers: string[];
  rows: (string | number | boolean)[][];
  colWidths?: number[];
  rightToLeft?: boolean;
}

/**
 * Generate a professional, fully-styled native Excel workbook (.xlsx) as a Blob
 * with automated text wrapping (Wrap Text), balanced compact column widths,
 * dynamic row heights for long Quranic verses, distinct closing borders,
 * frozen headers, and a flexible horizontal scrollbar for laptop/desktop Excel navigation.
 */
export async function generateTableExcelBlob({
  sheetTitle = 'بيانات البنيان',
  headers,
  rows,
  colWidths,
  rightToLeft = true
}: ExcelTableParams): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'منظومة البنيان الرقمي للقرآن الكريم';
  wb.created = new Date();

  // Configure workbook views for optimal laptop/desktop window and scrollbar visibility
  wb.views = [
    {
      x: 0,
      y: 0,
      width: 26000,
      height: 15000,
      firstSheet: 0,
      activeTab: 0,
      visibility: 'visible'
    }
  ];

  // Clean sheet title (max 31 characters, no invalid chars)
  const cleanSheetName = (sheetTitle || 'بيانات البنيان')
    .replace(/[\\/?*[\]:]/g, '_')
    .slice(0, 31)
    .trim() || 'البنيان';

  // Freeze header row (ySplit: 1) to allow fluid, smooth horizontal scrollbar navigation on laptops
  const ws = wb.addWorksheet(cleanSheetName, {
    views: [
      {
        state: 'frozen',
        ySplit: 1,
        activeCell: 'A2',
        rightToLeft,
        showGridLines: true
      }
    ]
  });

  const totalCols = headers.length;
  const totalRows = rows.length;

  // Identify column roles
  const compactColIndices = new Set<number>();
  const ayahColIndices = new Set<number>();
  const compatColIndices = new Set<number>();
  const statusColIndices = new Set<number>();
  const equationColIndices = new Set<number>();

  headers.forEach((h, idx) => {
    const headerStr = (h || '').toString().trim();
    const lower = headerStr.toLowerCase();

    // 1. Serial number and Verse number (both compact at width 8)
    if (headerStr === 'م' || headerStr === 'رقم الآية' || headerStr === 'الرقم' || headerStr === '#') {
      compactColIndices.add(idx);
    } else if (
      lower.includes('آية') || 
      lower.includes('ايه') || 
      lower.includes('نص') || 
      lower.includes('verse')
    ) {
      ayahColIndices.add(idx);
    } else if (
      lower.includes('التوافقات الستة') ||
      lower.includes('التوافقات المحققة') ||
      lower.includes('توافقات')
    ) {
      compatColIndices.add(idx);
    } else if (
      lower.includes('التحقق') || 
      lower.includes('المدمج') || 
      lower.includes('حالة') ||
      lower.includes('ميزان')
    ) {
      statusColIndices.add(idx);
    } else if (
      lower.includes('معادلة')
    ) {
      equationColIndices.add(idx);
    }
  });

  // Calculate optimized, balanced column widths
  const computedWidths: number[] = headers.map((h, colIdx) => {
    const explicitW = colWidths && colWidths[colIdx] ? colWidths[colIdx] : 0;
    
    // Serial number and Verse number: compact width 8
    if (compactColIndices.has(colIdx)) {
      return explicitW ? explicitW : 8;
    }

    // Quranic Ayah text column: generous reading width (60 - 64)
    if (ayahColIndices.has(colIdx)) {
      return explicitW ? Math.max(explicitW, 60) : 62;
    }

    // Compatibilities column: balanced reading width (48 - 52)
    if (compatColIndices.has(colIdx)) {
      return explicitW ? explicitW : 50;
    }

    // Status & verification columns: compact (15 - 16) with wrap text
    if (statusColIndices.has(colIdx)) {
      return explicitW ? explicitW : 16;
    }

    // Equation column: compact (18 - 20)
    if (equationColIndices.has(colIdx)) {
      return explicitW ? explicitW : 20;
    }

    if (explicitW > 0) {
      return explicitW;
    }

    // Auto-compute based on content length
    let maxLen = (h || '').toString().length;
    const sampleLimit = Math.min(rows.length, 100);
    for (let r = 0; r < sampleLimit; r++) {
      const cellVal = rows[r]?.[colIdx];
      if (cellVal !== undefined && cellVal !== null) {
        const str = cellVal.toString();
        if (str.length > maxLen) {
          maxLen = str.length;
        }
      }
    }

    return Math.max(Math.min(maxLen + 3, 24), 11);
  });

  // Setup worksheet columns
  ws.columns = headers.map((h, i) => ({
    header: h,
    key: `col_${i}`,
    width: computedWidths[i]
  }));

  // Border Colors
  const borderColorOuter = 'FF064E3B'; // Solid dark emerald for table bounding frame
  const borderColorInner = 'FFCBD5E1'; // Soft clear slate-300 for gridlines

  // Style Header Row
  const headerRow = ws.getRow(1);
  headerRow.height = 32;
  headerRow.eachCell((cell, colNumber) => {
    const isFirstCol = colNumber === 1;
    const isLastCol = colNumber === totalCols;

    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF064E3B' } // Deep emerald #064E3B
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };

    // Header borders with solid outer closing boundaries
    cell.border = {
      top: { style: 'medium', color: { argb: borderColorOuter } },
      bottom: { style: 'medium', color: { argb: 'FFD97706' } }, // Amber dividing line
      right: isFirstCol 
        ? { style: 'medium', color: { argb: borderColorOuter } } 
        : { style: 'thin', color: { argb: 'FF042F2E' } },
      left: isLastCol 
        ? { style: 'medium', color: { argb: borderColorOuter } } // Closes table on far edge
        : { style: 'thin', color: { argb: 'FF042F2E' } }
    };
  });

  // Add Data Rows with Wrap Text, dynamic heights, and closed outer vertical borders
  rows.forEach((rowData, rowIdx) => {
    const row = ws.addRow(rowData);
    const isEven = rowIdx % 2 === 0;
    const isLastRow = rowIdx === totalRows - 1;

    let maxAyahCharCount = 0;
    let maxCompatCharCount = 0;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colIdx = colNumber - 1;
      const isFirstCol = colNumber === 1;
      const isLastCol = colNumber === totalCols;

      const isCompactCol = compactColIndices.has(colIdx);
      const isAyahCol = ayahColIndices.has(colIdx);
      const isCompatCol = compatColIndices.has(colIdx);
      const isStatusCol = statusColIndices.has(colIdx);
      const isEquationCol = equationColIndices.has(colIdx);

      const cellStr = cell.value !== undefined && cell.value !== null ? cell.value.toString() : '';

      if (isAyahCol) {
        if (cellStr.length > maxAyahCharCount) {
          maxAyahCharCount = cellStr.length;
        }

        // Wrap text for Quranic Verse cells
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'right',
          wrapText: true,
          indent: 1
        };
        cell.font = {
          name: 'Amiri',
          size: 12,
          bold: false,
          color: { argb: 'FF0F172A' }
        };
      } else if (isCompatCol) {
        if (cellStr.length > maxCompatCharCount) {
          maxCompatCharCount = cellStr.length;
        }

        // Full wrap text for Achieved Compatibilities column
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true
        };
        cell.font = {
          name: 'Calibri',
          size: 10,
          color: { argb: 'FF1E293B' }
        };
      } else if (isStatusCol || isEquationCol) {
        // Tight status & equation cells with wrap text for compact widths
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true
        };
        cell.font = {
          name: 'Calibri',
          size: 10.5,
          color: { argb: 'FF1E293B' }
        };
      } else {
        // Compact numbers & badges
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: false
        };
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: isCompactCol,
          color: { argb: 'FF1E293B' }
        };
      }

      // Zebra striping for pleasant readability
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' }
      };

      // Table cell borders: Inner grid + Solid outer closing lines
      cell.border = {
        top: { style: 'thin', color: { argb: borderColorInner } },
        bottom: isLastRow 
          ? { style: 'medium', color: { argb: borderColorOuter } } // Closes table bottom
          : { style: 'thin', color: { argb: borderColorInner } },
        right: isFirstCol 
          ? { style: 'medium', color: { argb: borderColorOuter } } // Right edge of table
          : { style: 'thin', color: { argb: borderColorInner } },
        left: isLastCol 
          ? { style: 'medium', color: { argb: borderColorOuter } } // LEFT CLOSING VERTICAL LINE
          : { style: 'thin', color: { argb: borderColorInner } }
      };
    });

    // Compute appropriate row height based on verse and compatibility length
    const effectiveContentWeight = Math.max(maxAyahCharCount, maxCompatCharCount * 1.5);

    if (effectiveContentWeight > 300) {
      row.height = 90;
    } else if (effectiveContentWeight > 200) {
      row.height = 70;
    } else if (effectiveContentWeight > 120) {
      row.height = 52;
    } else if (effectiveContentWeight > 60) {
      row.height = 40;
    } else {
      row.height = 28;
    }
  });

  // Generate binary Excel buffer
  const buffer = await wb.xlsx.writeBuffer();

  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
