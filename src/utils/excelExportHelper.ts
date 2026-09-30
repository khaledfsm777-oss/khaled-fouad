import * as XLSX from 'xlsx';

export interface ExcelTableParams {
  sheetTitle?: string;
  headers: string[];
  rows: (string | number | boolean)[][];
  colWidths?: number[];
  rightToLeft?: boolean;
}

/**
 * Generate a native, binary Excel workbook (.xlsx) as a Blob
 * with preconfigured column widths, right-to-left layout, and proper cell types.
 */
export function generateTableExcelBlob({
  sheetTitle = 'بيانات البنيان',
  headers,
  rows,
  colWidths,
  rightToLeft = true
}: ExcelTableParams): Blob {
  // 1. Create a new workbook
  const wb = XLSX.utils.book_new();

  // 2. Prepare worksheet data: Header row + Data rows
  const aoaData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoaData);

  // 3. Configure column widths (wch = character width)
  if (colWidths && colWidths.length > 0) {
    ws['!cols'] = colWidths.map(w => ({ wch: Math.max(w, 10) }));
  } else {
    // Auto-compute sensible column widths based on headers and first 100 rows
    const autoCols = headers.map((h, colIdx) => {
      let maxLen = (h || '').toString().length;
      const sampleLimit = Math.min(rows.length, 100);
      for (let r = 0; r < sampleLimit; r++) {
        const cell = rows[r]?.[colIdx];
        if (cell !== undefined && cell !== null) {
          const str = cell.toString();
          if (str.length > maxLen) {
            maxLen = str.length;
          }
        }
      }
      return { wch: Math.min(Math.max(maxLen + 4, 10), 65) };
    });
    ws['!cols'] = autoCols;
  }

  // 4. Set Right-to-Left orientation for Arabic language support
  if (rightToLeft) {
    ws['!views'] = [{ rightToLeft: true }];
    if (!wb.Workbook) wb.Workbook = {};
    wb.Workbook.Views = [{ RTL: true }];
  }

  // 5. Append sheet to workbook (sanitize sheet name to 31 chars max as per Excel spec)
  const cleanSheetName = (sheetTitle || 'ورقة 1')
    .replace(/[\\/?*[\]:]/g, '_')
    .slice(0, 31)
    .trim() || 'البنيان';

  XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

  // 6. Generate binary array buffer in official OpenXML .xlsx format
  const excelBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
    compression: true
  });

  // 7. Return standard OpenXML SpreadsheetML Blob
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
