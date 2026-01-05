import apiClient from './api.service';

// Types
export interface ExportColumn {
  key: string;
  label: string;
  width?: number;
  format?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
}

export interface ExportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith';
  value: any;
}

export interface ExportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface CustomExportOptions {
  entityType: string;
  columns?: string[];
  filters?: ExportFilter[];
  sort?: ExportSort[];
  format?: 'excel' | 'csv' | 'pdf';
  title?: string;
  includeHeaders?: boolean;
  fiscalYear?: number;
  ministryId?: string;
  status?: string;
}

class CustomExportService {
  /**
   * Get supported entity types
   */
  async getEntityTypes(): Promise<string[]> {
    const response = await apiClient.get('/export/entity-types');
    return response.data.data;
  }

  /**
   * Get available columns for an entity type
   */
  async getColumns(entityType: string): Promise<ExportColumn[]> {
    const response = await apiClient.get(`/export/columns/${entityType}`);
    return response.data.data;
  }

  /**
   * Generate custom export
   */
  async generateExport(options: CustomExportOptions): Promise<Blob> {
    const response = await apiClient.post('/export/generate', options, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Export sectoral measures
   */
  async exportSectoralMeasures(options: Omit<CustomExportOptions, 'entityType'>): Promise<Blob> {
    const response = await apiClient.post('/export/sectoral-measures', options, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Export action plans
   */
  async exportActionPlans(options: Omit<CustomExportOptions, 'entityType'>): Promise<Blob> {
    const response = await apiClient.post('/export/action-plans', options, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Export ministerial ceilings
   */
  async exportMinisterialCeilings(options: Omit<CustomExportOptions, 'entityType'>): Promise<Blob> {
    const response = await apiClient.post('/export/ministerial-ceilings', options, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Export CBMT documents
   */
  async exportCBMTDocuments(options: Omit<CustomExportOptions, 'entityType'>): Promise<Blob> {
    const response = await apiClient.post('/export/cbmt-documents', options, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Export CDMT scenarios
   */
  async exportCDMTScenarios(options: Omit<CustomExportOptions, 'entityType'>): Promise<Blob> {
    const response = await apiClient.post('/export/cdmt-scenarios', options, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Download blob as file
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generate and download export
   */
  async exportAndDownload(options: CustomExportOptions): Promise<void> {
    const blob = await this.generateExport(options);
    const format = options.format || 'excel';
    const extension = format === 'excel' ? 'xlsx' : format;
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${options.entityType}_export_${timestamp}.${extension}`;
    this.downloadFile(blob, filename);
  }
}

export default new CustomExportService();
