import { Request, Response, NextFunction } from 'express';
import { CustomExportService, ExportFilter, ExportSort } from '../services/customExport.service';

export class CustomExportController {
  /**
   * Get available entity types for export
   * GET /api/v1/export/entity-types
   */
  static async getEntityTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entityTypes = CustomExportService.getSupportedEntityTypes();

      res.status(200).json({
        status: 'success',
        data: entityTypes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available columns for an entity type
   * GET /api/v1/export/columns/:entityType
   */
  static async getColumns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType } = req.params;
      const columns = CustomExportService.getAvailableColumns(entityType);

      res.status(200).json({
        status: 'success',
        data: columns,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate custom export
   * POST /api/v1/export/generate
   */
  static async generateExport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        entityType,
        columns = [],
        filters = [],
        sort = [],
        format = 'excel',
        title,
        includeHeaders = true,
        fiscalYear,
        ministryId,
      } = req.body;

      // Validate required fields
      if (!entityType) {
        res.status(400).json({
          status: 'error',
          message: 'Le type d\'entité est requis',
        });
        return;
      }

      // Parse filters and sort
      const parsedFilters: ExportFilter[] = filters.map((f: any) => ({
        field: f.field,
        operator: f.operator || 'eq',
        value: f.value,
      }));

      const parsedSort: ExportSort[] = sort.map((s: any) => ({
        field: s.field,
        direction: s.direction || 'asc',
      }));

      const result = await CustomExportService.export({
        entityType,
        columns,
        filters: parsedFilters,
        sort: parsedSort,
        format,
        title,
        includeHeaders,
        fiscalYear,
        ministryId,
      });

      // Set response headers
      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.buffer.length);

      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export sectoral measures with custom columns
   * POST /api/v1/export/sectoral-measures
   */
  static async exportSectoralMeasures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        columns = [],
        filters = [],
        sort = [],
        format = 'excel',
        fiscalYear,
        ministryId,
        status,
      } = req.body;

      // Build filters
      const exportFilters: ExportFilter[] = [...filters];

      if (status) {
        exportFilters.push({ field: 'status', operator: 'eq', value: status });
      }

      const result = await CustomExportService.export({
        entityType: 'SectoralMeasure',
        columns,
        filters: exportFilters,
        sort,
        format,
        title: 'Export Mesures Sectorielles',
        includeHeaders: true,
        fiscalYear,
        ministryId,
      });

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export action plans with custom columns
   * POST /api/v1/export/action-plans
   */
  static async exportActionPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        columns = [],
        filters = [],
        sort = [],
        format = 'excel',
        fiscalYear,
        ministryId,
        status,
      } = req.body;

      const exportFilters: ExportFilter[] = [...filters];

      if (status) {
        exportFilters.push({ field: 'status', operator: 'eq', value: status });
      }

      const result = await CustomExportService.export({
        entityType: 'ActionPlan',
        columns,
        filters: exportFilters,
        sort,
        format,
        title: 'Export Plans d\'Action',
        includeHeaders: true,
        fiscalYear,
        ministryId,
      });

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export ministerial ceilings with custom columns
   * POST /api/v1/export/ministerial-ceilings
   */
  static async exportMinisterialCeilings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        columns = [],
        filters = [],
        sort = [],
        format = 'excel',
        fiscalYear,
        ministryId,
      } = req.body;

      const result = await CustomExportService.export({
        entityType: 'MinisterialCeiling',
        columns,
        filters,
        sort,
        format,
        title: 'Export Plafonds Ministériels',
        includeHeaders: true,
        fiscalYear,
        ministryId,
      });

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export CBMT documents with custom columns
   * POST /api/v1/export/cbmt-documents
   */
  static async exportCBMTDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        columns = [],
        filters = [],
        sort = [],
        format = 'excel',
        fiscalYear,
      } = req.body;

      const result = await CustomExportService.export({
        entityType: 'CBMTDocument',
        columns,
        filters,
        sort,
        format,
        title: 'Export Documents CBMT',
        includeHeaders: true,
        fiscalYear,
      });

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export CDMT scenarios with custom columns
   * POST /api/v1/export/cdmt-scenarios
   */
  static async exportCDMTScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        columns = [],
        filters = [],
        sort = [],
        format = 'excel',
        fiscalYear,
      } = req.body;

      const result = await CustomExportService.export({
        entityType: 'CDMTGlobalScenario',
        columns,
        filters,
        sort,
        format,
        title: 'Export Scénarios CDMT Global',
        includeHeaders: true,
        fiscalYear,
      });

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default CustomExportController;
