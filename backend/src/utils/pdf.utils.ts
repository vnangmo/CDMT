import PDFDocument from 'pdfkit';

// Type alias for PDFDocument instance
type PDFDocumentType = InstanceType<typeof PDFDocument>;

export class PDFUtils {
  /**
   * Add header with logo and title to PDF document
   */
  static addHeader(doc: PDFDocumentType, title: string, code: string, subtitle?: string): void {
    const pageWidth = doc.page.width;
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Title
    doc.fontSize(20)
      .font('Helvetica-Bold')
      .text(title, marginLeft, 50, {
        width: contentWidth,
        align: 'center'
      });

    // Code
    doc.fontSize(12)
      .font('Helvetica')
      .text(`Code: ${code}`, marginLeft, 80, {
        width: contentWidth,
        align: 'center'
      });

    // Subtitle (if provided)
    if (subtitle) {
      doc.fontSize(10)
        .text(subtitle, marginLeft, 100, {
          width: contentWidth,
          align: 'center'
        });
    }

    // Generation date
    doc.fontSize(10)
      .font('Helvetica')
      .text(
        `Généré le: ${new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        marginLeft,
        subtitle ? 120 : 100,
        {
          width: contentWidth,
          align: 'center'
        }
      );

    doc.moveDown(2);
  }

  /**
   * Add footer with page numbers to PDF document
   */
  static addFooter(doc: PDFDocumentType, pageNumber: number, totalPages: number): void {
    const pageHeight = doc.page.height;
    const marginBottom = doc.page.margins.bottom;
    const footerY = pageHeight - marginBottom + 10;

    doc.fontSize(8)
      .font('Helvetica')
      .text(
        `Page ${pageNumber} sur ${totalPages}`,
        0,
        footerY,
        {
          align: 'center',
          width: doc.page.width
        }
      );
  }

  /**
   * Add a table to the PDF document
   */
  static addTable(
    doc: PDFDocumentType,
    headers: string[],
    rows: string[][],
    y: number,
    options?: {
      colWidths?: number[];
      headerBackground?: string;
      headerTextColor?: string;
      rowHeight?: number;
      fontSize?: number;
      headerFontSize?: number;
      alternateRowColor?: boolean;
    }
  ): number {
    const opts = {
      rowHeight: options?.rowHeight || 20,
      fontSize: options?.fontSize || 9,
      headerFontSize: options?.headerFontSize || 10,
      headerBackground: options?.headerBackground || '#3b82f6',
      headerTextColor: options?.headerTextColor || '#ffffff',
      alternateRowColor: options?.alternateRowColor !== false,
      ...options
    };

    const marginLeft = doc.page.margins.left;
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidths = opts.colWidths || headers.map(() => contentWidth / headers.length);

    let currentY = y;

    // Draw header row background
    doc.save();
    doc.fillColor(opts.headerBackground);
    doc.rect(marginLeft, currentY, contentWidth, opts.rowHeight).fill();
    doc.restore();

    // Draw header text
    doc.fontSize(opts.headerFontSize)
      .font('Helvetica-Bold')
      .fillColor(opts.headerTextColor);

    let x = marginLeft;
    headers.forEach((header, i) => {
      doc.text(header, x + 2, currentY + 5, {
        width: colWidths[i] - 4,
        align: 'center'
      });
      x += colWidths[i];
    });

    currentY += opts.rowHeight;

    // Draw data rows
    doc.fontSize(opts.fontSize)
      .font('Helvetica')
      .fillColor('#000000');

    rows.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (currentY > doc.page.height - doc.page.margins.bottom - opts.rowHeight) {
        doc.addPage();
        currentY = doc.page.margins.top;

        // Redraw headers on new page
        doc.save();
        doc.fillColor(opts.headerBackground);
        doc.rect(marginLeft, currentY, contentWidth, opts.rowHeight).fill();
        doc.restore();

        doc.fontSize(opts.headerFontSize)
          .font('Helvetica-Bold')
          .fillColor(opts.headerTextColor);

        x = marginLeft;
        headers.forEach((header, i) => {
          doc.text(header, x + 2, currentY + 5, {
            width: colWidths[i] - 4,
            align: 'center'
          });
          x += colWidths[i];
        });

        currentY += opts.rowHeight;

        doc.fontSize(opts.fontSize)
          .font('Helvetica')
          .fillColor('#000000');
      }

      // Alternate row background color
      if (opts.alternateRowColor && rowIndex % 2 === 1) {
        doc.save();
        doc.fillColor('#f3f4f6');
        doc.rect(marginLeft, currentY, contentWidth, opts.rowHeight).fill();
        doc.restore();
        doc.fillColor('#000000');
      }

      // Draw cell content
      x = marginLeft;
      row.forEach((cell, colIndex) => {
        const align = (colIndex === 0 || colIndex === 1) ? 'left' : 'right';
        doc.text(cell, x + 2, currentY + 5, {
          width: colWidths[colIndex] - 4,
          align
        });
        x += colWidths[colIndex];
      });

      currentY += opts.rowHeight;
    });

    return currentY;
  }

  /**
   * Add a bar chart to the PDF document
   */
  static addBarChart(
    doc: PDFDocumentType,
    data: { label: string; value: number }[],
    y: number,
    options?: {
      maxBarWidth?: number;
      barHeight?: number;
      barColor?: string;
      showValues?: boolean;
    }
  ): number {
    const opts = {
      maxBarWidth: options?.maxBarWidth || 300,
      barHeight: options?.barHeight || 20,
      barColor: options?.barColor || '#3b82f6',
      showValues: options?.showValues !== false
    };

    const maxValue = Math.max(...data.map(d => d.value));
    const marginLeft = doc.page.margins.left;
    const barStartX = marginLeft + 150; // Space for labels
    let currentY = y;

    data.forEach((item, i) => {
      // Check if we need a new page
      if (currentY > doc.page.height - doc.page.margins.bottom - opts.barHeight - 10) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }

      const barWidth = (item.value / maxValue) * opts.maxBarWidth;

      // Label
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(item.label, marginLeft, currentY, {
          width: 140,
          align: 'left'
        });

      // Bar
      doc.save();
      doc.fillColor(opts.barColor);
      doc.rect(barStartX, currentY, barWidth, opts.barHeight).fill();
      doc.restore();

      // Value
      if (opts.showValues) {
        doc.fillColor('#000000')
          .text(
            item.value.toLocaleString('fr-FR'),
            barStartX + barWidth + 10,
            currentY + 5
          );
      }

      currentY += opts.barHeight + 5;
    });

    return currentY;
  }

  /**
   * Add a pie chart to the PDF document
   */
  static addPieChart(
    doc: PDFDocumentType,
    data: { label: string; value: number; color?: string }[],
    x: number,
    y: number,
    options?: {
      radius?: number;
      showLegend?: boolean;
      showPercentages?: boolean;
    }
  ): number {
    const opts = {
      radius: options?.radius || 80,
      showLegend: options?.showLegend !== false,
      showPercentages: options?.showPercentages !== false
    };

    const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    const total = data.reduce((sum, d) => sum + d.value, 0);

    let startAngle = 0;

    // Draw pie slices
    data.forEach((item, i) => {
      const angle = (item.value / total) * 2 * Math.PI;
      const color = item.color || defaultColors[i % defaultColors.length];

      doc.save();
      doc.fillColor(color);

      // Draw slice
      if (angle >= 2 * Math.PI - 0.001) {
        // Full circle
        doc.circle(x, y, opts.radius).fill();
      } else {
        // Pie slice
        doc.moveTo(x, y);
        (doc as any).arc(x, y, opts.radius, startAngle, startAngle + angle);
        doc.lineTo(x, y);
        doc.fill();
      }

      doc.restore();

      startAngle += angle;
    });

    // Draw legend
    if (opts.showLegend) {
      const legendX = x + opts.radius + 30;
      let legendY = y - opts.radius;

      data.forEach((item, i) => {
        const color = item.color || defaultColors[i % defaultColors.length];
        const percentage = ((item.value / total) * 100).toFixed(1);

        // Color box
        doc.save();
        doc.fillColor(color);
        doc.rect(legendX, legendY, 12, 12).fill();
        doc.restore();

        // Label
        doc.fontSize(9)
          .fillColor('#000000')
          .font('Helvetica');

        const label = opts.showPercentages
          ? `${item.label} (${percentage}%)`
          : item.label;

        doc.text(label, legendX + 18, legendY);

        legendY += 20;
      });

      return Math.max(y + opts.radius, legendY);
    }

    return y + opts.radius;
  }

  /**
   * Add a section header to the PDF document
   */
  static addSectionHeader(
    doc: PDFDocumentType,
    title: string,
    y: number,
    options?: {
      fontSize?: number;
      backgroundColor?: string;
      textColor?: string;
      marginBottom?: number;
    }
  ): number {
    const opts = {
      fontSize: options?.fontSize || 14,
      backgroundColor: options?.backgroundColor || '#f3f4f6',
      textColor: options?.textColor || '#111827',
      marginBottom: options?.marginBottom || 10
    };

    const marginLeft = doc.page.margins.left;
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const height = opts.fontSize + 10;

    // Background
    doc.save();
    doc.fillColor(opts.backgroundColor);
    doc.rect(marginLeft, y, contentWidth, height).fill();
    doc.restore();

    // Text
    doc.fontSize(opts.fontSize)
      .font('Helvetica-Bold')
      .fillColor(opts.textColor)
      .text(title, marginLeft + 10, y + 5, {
        width: contentWidth - 20
      });

    return y + height + opts.marginBottom;
  }

  /**
   * Add a key-value pair to the PDF document
   */
  static addKeyValue(
    doc: PDFDocumentType,
    key: string,
    value: string,
    y: number,
    options?: {
      keyWidth?: number;
      fontSize?: number;
      keyBold?: boolean;
    }
  ): number {
    const opts = {
      keyWidth: options?.keyWidth || 150,
      fontSize: options?.fontSize || 10,
      keyBold: options?.keyBold !== false
    };

    const marginLeft = doc.page.margins.left;

    doc.fontSize(opts.fontSize);

    // Key
    if (opts.keyBold) {
      doc.font('Helvetica-Bold');
    } else {
      doc.font('Helvetica');
    }

    doc.fillColor('#6b7280')
      .text(key + ':', marginLeft, y, {
        width: opts.keyWidth,
        continued: false
      });

    // Value
    doc.font('Helvetica')
      .fillColor('#000000')
      .text(value, marginLeft + opts.keyWidth, y);

    return y + opts.fontSize + 5;
  }

  /**
   * Format amount for display (FDJ currency)
   */
  static formatAmount(amount: number | null | undefined, currency: string = 'FDJ'): string {
    if (amount === null || amount === undefined) return '0 ' + currency;

    return amount.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) + ' ' + currency;
  }

  /**
   * Format percentage for display
   */
  static formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined) return '0%';

    return value.toFixed(1) + '%';
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Check if a new page is needed
   */
  static needsNewPage(doc: PDFDocumentType, currentY: number, requiredSpace: number): boolean {
    return currentY + requiredSpace > doc.page.height - doc.page.margins.bottom;
  }

  /**
   * Add a new page if needed
   */
  static addPageIfNeeded(doc: PDFDocumentType, currentY: number, requiredSpace: number): number {
    if (this.needsNewPage(doc, currentY, requiredSpace)) {
      doc.addPage();
      return doc.page.margins.top;
    }
    return currentY;
  }
}
