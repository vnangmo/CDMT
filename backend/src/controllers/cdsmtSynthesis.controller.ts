import { Request, Response, NextFunction } from 'express';
import { CDSMTSynthesisService } from '../services/cdsmtSynthesis.service';
import { BadRequestError } from '../middleware/errorHandler';

export const CDSMTSynthesisController = {
  /**
   * GET /api/v1/cdsmt-synthesis/ministry/:ministryId
   * Générer la synthèse CDSMT pour un ministère (Maquette CDSMT - Figure 10)
   */
  async getMinistrySDMT(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ministryId } = req.params;
      const { fiscalYear } = req.query;

      if (!fiscalYear) {
        throw new BadRequestError('fiscalYear est requis');
      }

      const synthesis = await CDSMTSynthesisService.generateMinistrySDMT(
        ministryId,
        parseInt(fiscalYear as string, 10)
      );

      res.status(200).json({
        status: 'success',
        message: 'Synthèse CDSMT générée avec succès',
        data: synthesis,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/cdsmt-synthesis/ministry/:ministryId/validate
   * Valider le CDSMT par rapport au plafond CDMT Global
   */
  async validateMinistrySDMT(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ministryId } = req.params;
      const { fiscalYear } = req.query;

      if (!fiscalYear) {
        throw new BadRequestError('fiscalYear est requis');
      }

      const validation = await CDSMTSynthesisService.validateAgainstCeiling(
        ministryId,
        parseInt(fiscalYear as string, 10)
      );

      res.status(200).json({
        status: 'success',
        message: validation.isValid
          ? 'CDSMT conforme au plafond CDMT Global'
          : 'CDSMT non conforme au plafond CDMT Global',
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/cdsmt-synthesis/national
   * Générer la synthèse nationale (tous les ministères)
   */
  async getNationalSynthesis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fiscalYear } = req.query;

      if (!fiscalYear) {
        throw new BadRequestError('fiscalYear est requis');
      }

      const synthesis = await CDSMTSynthesisService.generateNationalSynthesis(
        parseInt(fiscalYear as string, 10)
      );

      res.status(200).json({
        status: 'success',
        message: 'Synthèse nationale CDSMT générée avec succès',
        data: synthesis,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/cdsmt-synthesis/ministry/:ministryId/export
   * Exporter le CDSMT en format officiel (Excel)
   */
  async exportMinistrySDMT(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ministryId } = req.params;
      const { fiscalYear, format = 'json' } = req.query;

      if (!fiscalYear) {
        throw new BadRequestError('fiscalYear est requis');
      }

      const synthesis = await CDSMTSynthesisService.generateMinistrySDMT(
        ministryId,
        parseInt(fiscalYear as string, 10)
      );

      if (format === 'json') {
        res.status(200).json({
          status: 'success',
          message: 'Export CDSMT généré avec succès',
          data: synthesis,
        });
      } else {
        // Format CSV pour Excel
        const csvData = generateCSVExport(synthesis);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="CDSMT_${synthesis.ministryCode}_${fiscalYear}.csv"`
        );
        res.status(200).send('\uFEFF' + csvData); // BOM pour Excel UTF-8
      }
    } catch (error) {
      next(error);
    }
  },
};

/**
 * Générer l'export CSV au format Maquette CDSMT
 */
function generateCSVExport(synthesis: any): string {
  const lines: string[] = [];
  const fiscalYear = synthesis.fiscalYear;

  // En-tête du document
  lines.push(`MAQUETTE CDSMT - ${synthesis.ministryName}`);
  lines.push(`Année de préparation: ${fiscalYear}`);
  lines.push('');

  // En-têtes des colonnes
  const header = [
    'Code',
    'Libellé',
    'Niveau',
    `Tendanciel ${fiscalYear + 1}`,
    `Mesures Nouvelles ${fiscalYear + 1}`,
    `Prévisions ${fiscalYear + 1}`,
    `Tendanciel ${fiscalYear + 2}`,
    `Mesures Nouvelles ${fiscalYear + 2}`,
    `Prévisions ${fiscalYear + 2}`,
    `Tendanciel ${fiscalYear + 3}`,
    `Mesures Nouvelles ${fiscalYear + 3}`,
    `Prévisions ${fiscalYear + 3}`,
    'Total Tendanciel',
    'Total Mesures Nouvelles',
    'Total Prévisions',
  ];
  lines.push(header.join(';'));

  // Plafonds CDMT Global
  lines.push([
    '',
    'PLAFOND CDMT GLOBAL',
    '',
    synthesis.ceilingY1,
    '',
    synthesis.ceilingY1,
    synthesis.ceilingY2,
    '',
    synthesis.ceilingY2,
    synthesis.ceilingY3,
    '',
    synthesis.ceilingY3,
    '',
    '',
    synthesis.ceilingY1 + synthesis.ceilingY2 + synthesis.ceilingY3,
  ].join(';'));

  lines.push('');

  // Données par programme
  for (const program of synthesis.programs) {
    // Ligne programme
    lines.push([
      program.code,
      `"${program.label}"`,
      'PROGRAMME',
      program.tendancielY1,
      program.mesuresNouvellesY1,
      program.previsionsY1,
      program.tendancielY2,
      program.mesuresNouvellesY2,
      program.previsionsY2,
      program.tendancielY3,
      program.mesuresNouvellesY3,
      program.previsionsY3,
      program.totalTendanciel,
      program.totalMesuresNouvelles,
      program.totalPrevisions,
    ].join(';'));

    // Actions
    if (program.children) {
      for (const action of program.children) {
        lines.push([
          `  ${action.code}`,
          `"  ${action.label}"`,
          'ACTION',
          action.tendancielY1,
          action.mesuresNouvellesY1,
          action.previsionsY1,
          action.tendancielY2,
          action.mesuresNouvellesY2,
          action.previsionsY2,
          action.tendancielY3,
          action.mesuresNouvellesY3,
          action.previsionsY3,
          action.totalTendanciel,
          action.totalMesuresNouvelles,
          action.totalPrevisions,
        ].join(';'));

        // Activités
        if (action.children) {
          for (const activity of action.children) {
            lines.push([
              `    ${activity.code}`,
              `"    ${activity.label}"`,
              'ACTIVITE',
              activity.tendancielY1,
              activity.mesuresNouvellesY1,
              activity.previsionsY1,
              activity.tendancielY2,
              activity.mesuresNouvellesY2,
              activity.previsionsY2,
              activity.tendancielY3,
              activity.mesuresNouvellesY3,
              activity.previsionsY3,
              activity.totalTendanciel,
              activity.totalMesuresNouvelles,
              activity.totalPrevisions,
            ].join(';'));
          }
        }
      }
    }
  }

  lines.push('');

  // Totaux
  lines.push([
    '',
    'TOTAL MINISTÈRE',
    '',
    synthesis.totalTendancielY1,
    synthesis.totalMesuresNouvellesY1,
    synthesis.totalPrevisionsY1,
    synthesis.totalTendancielY2,
    synthesis.totalMesuresNouvellesY2,
    synthesis.totalPrevisionsY2,
    synthesis.totalTendancielY3,
    synthesis.totalMesuresNouvellesY3,
    synthesis.totalPrevisionsY3,
    synthesis.totalTendancielY1 + synthesis.totalTendancielY2 + synthesis.totalTendancielY3,
    synthesis.totalMesuresNouvellesY1 + synthesis.totalMesuresNouvellesY2 + synthesis.totalMesuresNouvellesY3,
    synthesis.totalPrevisionsY1 + synthesis.totalPrevisionsY2 + synthesis.totalPrevisionsY3,
  ].join(';'));

  // Écart avec plafond
  lines.push([
    '',
    'ÉCART AVEC PLAFOND',
    '',
    synthesis.gapY1,
    '',
    synthesis.gapY1,
    synthesis.gapY2,
    '',
    synthesis.gapY2,
    synthesis.gapY3,
    '',
    synthesis.gapY3,
    '',
    '',
    synthesis.gapY1 + synthesis.gapY2 + synthesis.gapY3,
  ].join(';'));

  lines.push('');
  lines.push('');

  // Récapitulatif par catégorie économique
  lines.push('RÉCAPITULATIF PAR CATÉGORIE ÉCONOMIQUE');
  lines.push('');

  const catHeader = [
    'Catégorie',
    `Tendanciel ${fiscalYear + 1}`,
    `Mesures Nouvelles ${fiscalYear + 1}`,
    `Prévisions ${fiscalYear + 1}`,
    `Tendanciel ${fiscalYear + 2}`,
    `Mesures Nouvelles ${fiscalYear + 2}`,
    `Prévisions ${fiscalYear + 2}`,
    `Tendanciel ${fiscalYear + 3}`,
    `Mesures Nouvelles ${fiscalYear + 3}`,
    `Prévisions ${fiscalYear + 3}`,
  ];
  lines.push(catHeader.join(';'));

  const categories = [
    { name: 'Personnel', data: synthesis.byEconomicCategory.personnel },
    { name: 'Biens et services', data: synthesis.byEconomicCategory.goodsServices },
    { name: 'Transferts', data: synthesis.byEconomicCategory.transfers },
    { name: 'Investissements internes', data: synthesis.byEconomicCategory.internalInvestment },
    { name: 'Investissements externes', data: synthesis.byEconomicCategory.externalInvestment },
  ];

  for (const cat of categories) {
    lines.push([
      cat.name,
      cat.data.tendanciel[0],
      cat.data.mesuresNouvelles[0],
      cat.data.previsions[0],
      cat.data.tendanciel[1],
      cat.data.mesuresNouvelles[1],
      cat.data.previsions[1],
      cat.data.tendanciel[2],
      cat.data.mesuresNouvelles[2],
      cat.data.previsions[2],
    ].join(';'));
  }

  return lines.join('\n');
}

export default CDSMTSynthesisController;
