import * as XLSX from 'xlsx';

export class ExcelUtils {
  /**
   * Create a styled header row for Excel
   */
  static createHeaderRow(headers: string[]): any[] {
    return headers.map(header => ({
      v: header,
      t: 's',
      s: {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '3B82F6' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      }
    }));
  }

  /**
   * Format a value as currency (FDJ)
   */
  static formatCurrency(value: number | null | undefined, currency: string = 'FDJ'): any {
    if (value === null || value === undefined) {
      return {
        v: 0,
        t: 'n',
        z: `#,##0" ${currency}"`,
        s: { numFmt: `#,##0" ${currency}"`, alignment: { horizontal: 'right' } }
      };
    }

    return {
      v: value,
      t: 'n',
      z: `#,##0" ${currency}"`,
      s: { numFmt: `#,##0" ${currency}"`, alignment: { horizontal: 'right' } }
    };
  }

  /**
   * Format a value as percentage
   */
  static formatPercentage(value: number | null | undefined): any {
    if (value === null || value === undefined) {
      return {
        v: 0,
        t: 'n',
        z: '0.00%',
        s: { numFmt: '0.00%', alignment: { horizontal: 'right' } }
      };
    }

    return {
      v: value / 100, // Excel expects decimal for percentage
      t: 'n',
      z: '0.00%',
      s: { numFmt: '0.00%', alignment: { horizontal: 'right' } }
    };
  }

  /**
   * Format a date value
   */
  static formatDate(date: Date | string | null | undefined): any {
    if (!date) {
      return {
        v: '',
        t: 's'
      };
    }

    const d = typeof date === 'string' ? new Date(date) : date;

    return {
      v: d,
      t: 'd',
      z: 'dd/mm/yyyy',
      s: { numFmt: 'dd/mm/yyyy', alignment: { horizontal: 'center' } }
    };
  }

  /**
   * Format a datetime value
   */
  static formatDateTime(date: Date | string | null | undefined): any {
    if (!date) {
      return {
        v: '',
        t: 's'
      };
    }

    const d = typeof date === 'string' ? new Date(date) : date;

    return {
      v: d,
      t: 'd',
      z: 'dd/mm/yyyy hh:mm',
      s: { numFmt: 'dd/mm/yyyy hh:mm', alignment: { horizontal: 'center' } }
    };
  }

  /**
   * Auto-size columns based on content
   */
  static autoSizeColumns(worksheet: XLSX.WorkSheet, minWidth: number = 10, maxWidth: number = 50): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const colWidths: number[] = [];

    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = minWidth;

      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];

        if (cell && cell.v) {
          const cellValue = cell.v.toString();
          const cellLength = cellValue.length;

          if (cellLength > maxWidth) {
            maxWidth = Math.min(cellLength, maxWidth);
          }
        }
      }

      colWidths.push(Math.min(maxWidth + 2, maxWidth));
    }

    worksheet['!cols'] = colWidths.map(w => ({ wch: w }));
  }

  /**
   * Create a summary sheet from key-value pairs
   */
  static createSummarySheet(data: Record<string, any>, title?: string): XLSX.WorkSheet {
    const aoa: any[][] = [];

    if (title) {
      aoa.push([title]);
      aoa.push([]);
    }

    Object.entries(data).forEach(([key, value]) => {
      aoa.push([key, value]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Style first column (keys) as bold
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: 0 });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true },
          alignment: { horizontal: 'left' }
        };
      }
    }

    this.autoSizeColumns(ws);
    return ws;
  }

  /**
   * Create a workbook with default settings
   */
  static createWorkbook(): XLSX.WorkBook {
    return XLSX.utils.book_new();
  }

  /**
   * Add a worksheet to a workbook
   */
  static addWorksheet(workbook: XLSX.WorkBook, worksheet: XLSX.WorkSheet, sheetName: string): void {
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  /**
   * Convert workbook to buffer
   */
  static workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Create a table with headers and data rows
   */
  static createTable(
    headers: string[],
    rows: any[][],
    options?: {
      title?: string;
      titleStyle?: any;
      headerStyle?: any;
      dataStyle?: any;
      autoSize?: boolean;
    }
  ): XLSX.WorkSheet {
    const aoa: any[][] = [];

    // Add title if provided
    if (options?.title) {
      aoa.push([options.title]);
      aoa.push([]);
    }

    // Add headers
    aoa.push(headers);

    // Add data rows
    rows.forEach(row => aoa.push(row));

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Apply styling
    const titleOffset = options?.title ? 2 : 0;
    const headerRow = titleOffset;
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Style title
    if (options?.title) {
      const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (ws[titleCell]) {
        ws[titleCell].s = options.titleStyle || {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: 'left' }
        };
      }
    }

    // Style headers
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({ r: headerRow, c: C });
      if (ws[headerCell]) {
        ws[headerCell].s = options?.headerStyle || {
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
          fill: { fgColor: { rgb: '3B82F6' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    }

    // Auto-size columns if enabled
    if (options?.autoSize !== false) {
      this.autoSizeColumns(ws);
    }

    return ws;
  }

  /**
   * Create a budget breakdown sheet (Y1, Y2, Y3)
   */
  static createBudgetBreakdownSheet(
    budgetY1: number,
    budgetY2: number,
    budgetY3: number,
    currency: string = 'FDJ'
  ): XLSX.WorkSheet {
    const total = budgetY1 + budgetY2 + budgetY3;

    const aoa: any[][] = [
      ['Répartition Budgétaire'],
      [],
      ['Année', 'Montant', 'Pourcentage']
    ];

    // Y1
    aoa.push([
      'Année 1',
      budgetY1,
      (budgetY1 / total) * 100
    ]);

    // Y2
    aoa.push([
      'Année 2',
      budgetY2,
      (budgetY2 / total) * 100
    ]);

    // Y3
    aoa.push([
      'Année 3',
      budgetY3,
      (budgetY3 / total) * 100
    ]);

    // Total
    aoa.push([
      'Total',
      total,
      100
    ]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Style title
    ws['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'left' }
    };

    // Style headers (row 3)
    ['A3', 'B3', 'C3'].forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
          fill: { fgColor: { rgb: '3B82F6' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    });

    // Format amounts (column B, rows 4-7)
    ['B4', 'B5', 'B6', 'B7'].forEach(cell => {
      if (ws[cell]) {
        ws[cell].z = `#,##0" ${currency}"`;
        ws[cell].s = { numFmt: `#,##0" ${currency}"`, alignment: { horizontal: 'right' } };
      }
    });

    // Format percentages (column C, rows 4-7)
    ['C4', 'C5', 'C6', 'C7'].forEach(cell => {
      if (ws[cell]) {
        ws[cell].v = ws[cell].v / 100; // Convert to decimal for Excel
        ws[cell].z = '0.00%';
        ws[cell].s = { numFmt: '0.00%', alignment: { horizontal: 'right' } };
      }
    });

    // Bold total row (row 7)
    ['A7', 'B7', 'C7'].forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          ...ws[cell].s,
          font: { bold: true }
        };
      }
    });

    this.autoSizeColumns(ws);

    return ws;
  }

  /**
   * Create a timeline/chronogram sheet
   */
  static createTimelineSheet(
    activities: Array<{
      code: string;
      title: string;
      startDate: Date;
      endDate: Date;
    }>,
    fiscalYear: number
  ): XLSX.WorkSheet {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    const aoa: any[][] = [
      ['Chronogramme'],
      [],
      ['Activité', ...months]
    ];

    activities.forEach(activity => {
      const row: any[] = [activity.title];

      const startMonth = activity.startDate.getMonth();
      const endMonth = activity.endDate.getMonth();

      months.forEach((_, monthIndex) => {
        if (monthIndex >= startMonth && monthIndex <= endMonth) {
          row.push('███'); // Block indicator
        } else {
          row.push('');
        }
      });

      aoa.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Style title
    ws['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'left' }
    };

    // Style headers
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = XLSX.utils.encode_cell({ r: 2, c: C });
      if (ws[headerCell]) {
        ws[headerCell].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
          fill: { fgColor: { rgb: '3B82F6' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    }

    // Center align activity blocks
    for (let R = 3; R <= range.e.r; ++R) {
      for (let C = 1; C <= range.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cell]) {
          ws[cell].s = {
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: ws[cell].v === '███' ? { fgColor: { rgb: '3B82F6' } } : undefined
          };
        }
      }
    }

    this.autoSizeColumns(ws);

    return ws;
  }

  /**
   * Apply alternating row colors to a worksheet
   */
  static applyAlternatingRowColors(
    worksheet: XLSX.WorkSheet,
    startRow: number,
    color1: string = 'FFFFFF',
    color2: string = 'F3F4F6'
  ): void {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    for (let R = startRow; R <= range.e.r; ++R) {
      const color = (R - startRow) % 2 === 0 ? color1 : color2;

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];

        if (cell) {
          cell.s = {
            ...cell.s,
            fill: { fgColor: { rgb: color } }
          };
        }
      }
    }
  }

  /**
   * Format amount for display (simple string)
   */
  static formatAmount(amount: number | null | undefined, currency: string = 'FDJ'): string {
    if (amount === null || amount === undefined) return `0 ${currency}`;

    return `${amount.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })} ${currency}`;
  }

  /**
   * Format percentage for display (simple string)
   */
  static formatPercentageString(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0%';

    return `${value.toFixed(2)}%`;
  }

  /**
   * Format date for display (simple string)
   */
  static formatDateString(date: Date | string | null | undefined): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}
