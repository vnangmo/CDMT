import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { CDMTGlobalCalculationService } from './cdmtGlobalCalculation.service';
import { CDMTGlobalEnhancedService } from './cdmtGlobalEnhanced.service';

const prisma = new PrismaClient();

// ============================================================================
// REQ-GLOB-05: Enhanced Ministry Ceiling Calculation with Category Breakdown
// REQ-GLOB-06: CBMT-CDMT Global Iteration Support
// ============================================================================

interface CeilingByCategory {
  ministryId: string;
  ministryName: string;
  year: number;
  categories: {
    category: string;
    baseline: number;
    newMeasures: number;
    allocatedMargin: number;
    ceiling: number;
  }[];
  total: {
    baseline: number;
    newMeasures: number;
    allocatedMargin: number;
    ceiling: number;
  };
}

interface IterationState {
  id: string;
  scenarioId: string;
  cbmtDocumentId?: string;
  iterationNumber: number;
  status: 'IN_PROGRESS' | 'CONVERGED' | 'DIVERGED' | 'CANCELLED';
  cdmtGlobalTotals: {
    ceilingY1: number;
    ceilingY2: number;
    ceilingY3: number;
  };
  cbmtTotals?: {
    expenseY1: number;
    expenseY2: number;
    expenseY3: number;
  };
  gaps: {
    y1: number;
    y2: number;
    y3: number;
  };
  convergenceThreshold: number;
  isConverged: boolean;
  adjustmentsApplied: string[];
  createdAt: Date;
}

export class CDMTGlobalIterationService {
  // ============================================================================
  // REQ-GLOB-05: Ceiling Calculation by Category
  // ============================================================================

  /**
   * Calculate ministerial ceilings with category breakdown
   * Plafond = Tendanciel + Mesures nouvelles + Marge allouée
   */
  static async calculateCeilingsByCategory(
    scenarioId: string
  ): Promise<{
    ceilings: CeilingByCategory[];
    summary: {
      year: number;
      totalBaseline: number;
      totalNewMeasures: number;
      totalAllocatedMargin: number;
      totalCeiling: number;
    }[];
  }> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
      include: {
        trendConfig: true,
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Get trend projections if available
    const trendProjections = scenario.trendConfigId
      ? await prisma.trendProjection.findMany({
          where: { trendConfigId: scenario.trendConfigId },
          include: { economicNature: true },
        })
      : [];

    // Get policy measures
    const policyMeasures = await prisma.policyMeasure.findMany({
      where: { scenarioId },
    });

    // Get margin allocations
    const marginAllocations = await prisma.marginAllocation.findMany({
      where: { scenarioId },
    });

    const categories = ['PERSONNEL', 'GOODS_SERVICES', 'TRANSFERS', 'INVESTMENT', 'OTHER'];
    const years = [scenario.fiscalYear + 1, scenario.fiscalYear + 2, scenario.fiscalYear + 3];

    const ceilings: CeilingByCategory[] = [];

    for (const ministry of ministries) {
      for (const year of years) {
        const yearIndex = year - scenario.fiscalYear - 1; // 0, 1, 2

        const categoryData: CeilingByCategory['categories'] = [];

        for (const category of categories) {
          // Get baseline from trend projections
          const ministryProjections = trendProjections.filter(
            (p) => p.ministryId === ministry.id
          );

          // Map economic nature to category
          const categoryProjections = ministryProjections.filter((p) => {
            const code = p.economicNature?.code || '';
            if (category === 'PERSONNEL') return code.startsWith('1') || code.startsWith('2');
            if (category === 'GOODS_SERVICES') return code.startsWith('3') || code.startsWith('4');
            if (category === 'TRANSFERS') return code.startsWith('5') || code.startsWith('6');
            if (category === 'INVESTMENT') return code.startsWith('7') || code.startsWith('8');
            return category === 'OTHER';
          });

          let baseline = 0;
          for (const proj of categoryProjections) {
            if (yearIndex === 0) baseline += parseFloat(proj.projectedAmount1.toString());
            else if (yearIndex === 1) baseline += parseFloat(proj.projectedAmount2.toString());
            else if (yearIndex === 2) baseline += parseFloat(proj.projectedAmount3.toString());
          }

          // Get new measures for this category
          const categoryMeasures = policyMeasures.filter(
            (m) => m.ministryId === ministry.id && m.category === category
          );
          let newMeasures = 0;
          for (const m of categoryMeasures) {
            if (yearIndex === 0) newMeasures += parseFloat(m.amountY1.toString());
            else if (yearIndex === 1) newMeasures += parseFloat(m.amountY2.toString());
            else if (yearIndex === 2) newMeasures += parseFloat(m.amountY3.toString());
          }

          // Margin allocation is at ministry level, distribute proportionally
          const allocation = marginAllocations.find((a) => a.ministryId === ministry.id);
          let totalMargin = 0;
          if (allocation) {
            if (yearIndex === 0) totalMargin = parseFloat(allocation.allocatedY1.toString());
            else if (yearIndex === 1) totalMargin = parseFloat(allocation.allocatedY2.toString());
            else if (yearIndex === 2) totalMargin = parseFloat(allocation.allocatedY3.toString());
          }

          // Distribute margin based on baseline weight
          const ministryTotalBaseline = categories.reduce((sum, cat) => {
            const catProjs = ministryProjections.filter((p) => {
              const code = p.economicNature?.code || '';
              if (cat === 'PERSONNEL') return code.startsWith('1') || code.startsWith('2');
              if (cat === 'GOODS_SERVICES') return code.startsWith('3') || code.startsWith('4');
              if (cat === 'TRANSFERS') return code.startsWith('5') || code.startsWith('6');
              if (cat === 'INVESTMENT') return code.startsWith('7') || code.startsWith('8');
              return cat === 'OTHER';
            });
            let b = 0;
            for (const proj of catProjs) {
              if (yearIndex === 0) b += parseFloat(proj.projectedAmount1.toString());
              else if (yearIndex === 1) b += parseFloat(proj.projectedAmount2.toString());
              else if (yearIndex === 2) b += parseFloat(proj.projectedAmount3.toString());
            }
            return sum + b;
          }, 0);

          const marginWeight = ministryTotalBaseline > 0 ? baseline / ministryTotalBaseline : 0;
          const allocatedMargin = totalMargin * marginWeight;

          const ceiling = baseline + newMeasures + allocatedMargin;

          if (baseline > 0 || newMeasures > 0 || allocatedMargin > 0) {
            categoryData.push({
              category,
              baseline,
              newMeasures,
              allocatedMargin,
              ceiling,
            });
          }
        }

        if (categoryData.length > 0) {
          const total = {
            baseline: categoryData.reduce((sum, c) => sum + c.baseline, 0),
            newMeasures: categoryData.reduce((sum, c) => sum + c.newMeasures, 0),
            allocatedMargin: categoryData.reduce((sum, c) => sum + c.allocatedMargin, 0),
            ceiling: categoryData.reduce((sum, c) => sum + c.ceiling, 0),
          };

          ceilings.push({
            ministryId: ministry.id,
            ministryName: ministry.name,
            year,
            categories: categoryData,
            total,
          });
        }
      }
    }

    // Calculate summary by year
    const summary = years.map((year) => {
      const yearCeilings = ceilings.filter((c) => c.year === year);
      return {
        year,
        totalBaseline: yearCeilings.reduce((sum, c) => sum + c.total.baseline, 0),
        totalNewMeasures: yearCeilings.reduce((sum, c) => sum + c.total.newMeasures, 0),
        totalAllocatedMargin: yearCeilings.reduce((sum, c) => sum + c.total.allocatedMargin, 0),
        totalCeiling: yearCeilings.reduce((sum, c) => sum + c.total.ceiling, 0),
      };
    });

    return { ceilings, summary };
  }

  // ============================================================================
  // REQ-GLOB-06: CBMT-CDMT Global Iteration Support
  // ============================================================================

  /**
   * Initialize an iteration cycle between CDMT Global and CBMT
   */
  static async initializeIteration(
    scenarioId: string,
    cbmtDocumentId?: string,
    convergenceThreshold: number = 0.01 // 1% threshold
  ): Promise<IterationState> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
      include: {
        ministerialCeilings: true,
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    // Calculate CDMT Global totals
    const cdmtGlobalTotals = {
      ceilingY1: parseFloat(scenario.totalCeilingY1.toString()),
      ceilingY2: parseFloat(scenario.totalCeilingY2.toString()),
      ceilingY3: parseFloat(scenario.totalCeilingY3.toString()),
    };

    // Get CBMT totals if document is provided
    let cbmtTotals: IterationState['cbmtTotals'] | undefined;
    let cbmtDocument;

    if (cbmtDocumentId) {
      cbmtDocument = await prisma.cBMTDocument.findUnique({
        where: { id: cbmtDocumentId },
        include: {
          aggregates: true,
        },
      });

      if (cbmtDocument) {
        const expenseAggregates = cbmtDocument.aggregates.filter(
          (a: any) => a.aggregateType === 'EXPENSE'
        );

        cbmtTotals = {
          expenseY1: expenseAggregates.reduce(
            (sum: number, a: any) => sum + parseFloat(a.amount1?.toString() || '0'),
            0
          ),
          expenseY2: expenseAggregates.reduce(
            (sum: number, a: any) => sum + parseFloat(a.amount2?.toString() || '0'),
            0
          ),
          expenseY3: expenseAggregates.reduce(
            (sum: number, a: any) => sum + parseFloat(a.amount3?.toString() || '0'),
            0
          ),
        };
      }
    }

    // Calculate gaps
    const gaps = {
      y1: cbmtTotals ? cdmtGlobalTotals.ceilingY1 - cbmtTotals.expenseY1 : 0,
      y2: cbmtTotals ? cdmtGlobalTotals.ceilingY2 - cbmtTotals.expenseY2 : 0,
      y3: cbmtTotals ? cdmtGlobalTotals.ceilingY3 - cbmtTotals.expenseY3 : 0,
    };

    // Check convergence
    const isConverged = cbmtTotals
      ? Math.abs(gaps.y1 / cdmtGlobalTotals.ceilingY1) <= convergenceThreshold &&
        Math.abs(gaps.y2 / cdmtGlobalTotals.ceilingY2) <= convergenceThreshold &&
        Math.abs(gaps.y3 / cdmtGlobalTotals.ceilingY3) <= convergenceThreshold
      : false;

    const iterationState: IterationState = {
      id: `iter-${Date.now()}`,
      scenarioId,
      cbmtDocumentId,
      iterationNumber: 1,
      status: isConverged ? 'CONVERGED' : 'IN_PROGRESS',
      cdmtGlobalTotals,
      cbmtTotals,
      gaps,
      convergenceThreshold,
      isConverged,
      adjustmentsApplied: [],
      createdAt: new Date(),
    };

    return iterationState;
  }

  /**
   * Perform an iteration adjustment
   */
  static async performIterationAdjustment(
    scenarioId: string,
    cbmtDocumentId: string,
    adjustmentType: 'SYNC_CBMT_TO_CDMT' | 'ADJUST_CDMT_FROM_CBMT' | 'PROPORTIONAL_ADJUSTMENT'
  ): Promise<{
    previousState: IterationState;
    newState: IterationState;
    adjustmentsMade: string[];
  }> {
    // Get previous state
    const previousState = await this.initializeIteration(scenarioId, cbmtDocumentId);

    const adjustmentsMade: string[] = [];

    if (adjustmentType === 'SYNC_CBMT_TO_CDMT') {
      // Push CDMT Global ceilings to CBMT
      const scenario = await prisma.cDMTGlobalScenario.findUnique({
        where: { id: scenarioId },
        include: {
          ministerialCeilings: { include: { ministry: true } },
        },
      });

      if (!scenario) {
        throw new NotFoundError('Scénario non trouvé');
      }

      // Update CBMT aggregates
      for (const ceiling of scenario.ministerialCeilings) {
        const existingAggregate = await prisma.cBMTAggregate.findFirst({
          where: {
            cbmtDocumentId,
            categoryCode: `MIN-${ceiling.ministryId}`,
          },
        });

        if (existingAggregate) {
          await prisma.cBMTAggregate.update({
            where: { id: existingAggregate.id },
            data: {
              amount1: ceiling.ceiling,
              notes: `Synchronisé depuis CDMT Global - Itération ${previousState.iterationNumber + 1}`,
            },
          });
          adjustmentsMade.push(
            `Mis à jour agrégat CBMT pour ${ceiling.ministry.name}: ${parseFloat(ceiling.ceiling.toString()).toFixed(2)}`
          );
        }
      }
    } else if (adjustmentType === 'ADJUST_CDMT_FROM_CBMT') {
      // Pull constraints from CBMT back to CDMT Global
      const cbmtDocument = await prisma.cBMTDocument.findUnique({
        where: { id: cbmtDocumentId },
        include: { aggregates: true },
      });

      if (!cbmtDocument) {
        throw new NotFoundError('Document CBMT non trouvé');
      }

      // Identify discrepancies and suggest adjustments
      for (const aggregate of cbmtDocument.aggregates) {
        if ((aggregate as any).aggregateType !== 'EXPENSE') continue;

        const ministryId = (aggregate as any).categoryCode?.replace('MIN-', '');
        if (!ministryId) continue;

        const allocation = await prisma.marginAllocation.findFirst({
          where: { scenarioId, ministryId },
        });

        if (allocation) {
          const cbmtAmount = parseFloat((aggregate as any).amount1?.toString() || '0');
          const currentAllocation = parseFloat(allocation.allocatedY1.toString());

          if (Math.abs(cbmtAmount - currentAllocation) > 0.01) {
            // Adjust margin allocation based on CBMT constraint
            const adjustment = cbmtAmount - currentAllocation;

            await prisma.marginAllocation.update({
              where: { id: allocation.id },
              data: {
                allocatedY1: { increment: adjustment * 0.5 }, // Partial adjustment
                notes: `${allocation.notes || ''}\n[Ajustement itération: ${adjustment.toFixed(2)}]`,
              },
            });

            adjustmentsMade.push(
              `Ajusté allocation pour ministère ${ministryId}: +${(adjustment * 0.5).toFixed(2)}`
            );
          }
        }
      }

      // Recalculate ceilings
      await CDMTGlobalCalculationService.calculateMinisterialCeilings(scenarioId);
      adjustmentsMade.push('Recalcul des plafonds ministériels effectué');
    } else if (adjustmentType === 'PROPORTIONAL_ADJUSTMENT') {
      // Proportional adjustment to reduce gaps
      if (previousState.gaps.y1 !== 0) {
        const scenario = await prisma.cDMTGlobalScenario.findUnique({
          where: { id: scenarioId },
        });

        if (scenario) {
          const gapRatio = previousState.gaps.y1 / previousState.cdmtGlobalTotals.ceilingY1;

          // Adjust fiscal margin proportionally
          const newMarginY1 =
            parseFloat(scenario.fiscalMarginY1.toString()) * (1 - gapRatio * 0.5);

          await prisma.cDMTGlobalScenario.update({
            where: { id: scenarioId },
            data: {
              fiscalMarginY1: newMarginY1,
            },
          });

          adjustmentsMade.push(
            `Ajusté marge fiscale Y1 de ${gapRatio * 50}% pour réduire l'écart`
          );
        }
      }
    }

    // Get new state after adjustments
    const newState = await this.initializeIteration(scenarioId, cbmtDocumentId);
    newState.iterationNumber = previousState.iterationNumber + 1;
    newState.adjustmentsApplied = adjustmentsMade;

    if (newState.isConverged) {
      newState.status = 'CONVERGED';
    } else if (newState.iterationNumber > 10) {
      newState.status = 'DIVERGED';
    }

    return {
      previousState,
      newState,
      adjustmentsMade,
    };
  }

  /**
   * Get iteration history for a scenario
   */
  static async getIterationSummary(scenarioId: string): Promise<{
    scenario: {
      id: string;
      name: string;
      fiscalYear: number;
      status: string;
    };
    currentTotals: {
      ceilingY1: number;
      ceilingY2: number;
      ceilingY3: number;
      marginY1: number;
      marginY2: number;
      marginY3: number;
      allocatedY1: number;
      allocatedY2: number;
      allocatedY3: number;
    };
    recommendations: string[];
  }> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario non trouvé');
    }

    const recommendations: string[] = [];

    const marginY1 = parseFloat(scenario.fiscalMarginY1.toString());
    const allocatedY1 = parseFloat(scenario.totalAllocatedY1.toString());
    const ceilingY1 = parseFloat(scenario.totalCeilingY1.toString());

    // Generate recommendations
    if (allocatedY1 < marginY1 * 0.8) {
      recommendations.push(
        `Marge sous-utilisée: ${((marginY1 - allocatedY1) / marginY1 * 100).toFixed(1)}% de la marge disponible n'est pas allouée`
      );
    }

    if (allocatedY1 > marginY1) {
      recommendations.push(
        `ATTENTION: Dépassement de la marge fiscale de ${(allocatedY1 - marginY1).toFixed(2)}`
      );
    }

    // Check for CBMT consistency
    const cbmtDocuments = await prisma.cBMTDocument.findMany({
      where: {
        fiscalYear: scenario.fiscalYear,
        status: { in: ['DRAFT', 'IN_PROGRESS', 'VALIDATED'] },
      },
    });

    if (cbmtDocuments.length === 0) {
      recommendations.push('Aucun document CBMT correspondant trouvé. Créer un CBMT depuis ce scénario.');
    }

    return {
      scenario: {
        id: scenario.id,
        name: scenario.name,
        fiscalYear: scenario.fiscalYear,
        status: scenario.status,
      },
      currentTotals: {
        ceilingY1,
        ceilingY2: parseFloat(scenario.totalCeilingY2.toString()),
        ceilingY3: parseFloat(scenario.totalCeilingY3.toString()),
        marginY1,
        marginY2: parseFloat(scenario.fiscalMarginY2.toString()),
        marginY3: parseFloat(scenario.fiscalMarginY3.toString()),
        allocatedY1,
        allocatedY2: parseFloat(scenario.totalAllocatedY2.toString()),
        allocatedY3: parseFloat(scenario.totalAllocatedY3.toString()),
      },
      recommendations,
    };
  }

  /**
   * Validate convergence between CDMT Global and CBMT
   */
  static async validateConvergence(
    scenarioId: string,
    cbmtDocumentId: string,
    tolerance: number = 0.01
  ): Promise<{
    isConverged: boolean;
    toleranceUsed: number;
    detailedGaps: {
      ministryId: string;
      ministryName: string;
      cdmtCeiling: number;
      cbmtAggregate: number;
      gap: number;
      gapPercent: number;
      isWithinTolerance: boolean;
    }[];
    summary: {
      totalCdmt: number;
      totalCbmt: number;
      totalGap: number;
      gapPercent: number;
    };
  }> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
      include: {
        ministerialCeilings: { include: { ministry: true } },
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario non trouvé');
    }

    const cbmtDocument = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: { aggregates: true },
    });

    if (!cbmtDocument) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    const detailedGaps: {
      ministryId: string;
      ministryName: string;
      cdmtCeiling: number;
      cbmtAggregate: number;
      gap: number;
      gapPercent: number;
      isWithinTolerance: boolean;
    }[] = [];

    let totalCdmt = 0;
    let totalCbmt = 0;

    for (const ceiling of scenario.ministerialCeilings) {
      const cbmtAggregate = cbmtDocument.aggregates.find(
        (a: any) => a.categoryCode === `MIN-${ceiling.ministryId}`
      );

      const cdmtValue = parseFloat(ceiling.ceiling.toString());
      const cbmtValue = cbmtAggregate
        ? parseFloat((cbmtAggregate as any).amount1?.toString() || '0')
        : 0;

      totalCdmt += cdmtValue;
      totalCbmt += cbmtValue;

      const gap = cdmtValue - cbmtValue;
      const gapPercent = cdmtValue > 0 ? Math.abs(gap / cdmtValue) : 0;

      detailedGaps.push({
        ministryId: ceiling.ministryId,
        ministryName: ceiling.ministry.name,
        cdmtCeiling: cdmtValue,
        cbmtAggregate: cbmtValue,
        gap,
        gapPercent: gapPercent * 100,
        isWithinTolerance: gapPercent <= tolerance,
      });
    }

    const totalGap = totalCdmt - totalCbmt;
    const totalGapPercent = totalCdmt > 0 ? Math.abs(totalGap / totalCdmt) : 0;

    return {
      isConverged: detailedGaps.every((g) => g.isWithinTolerance),
      toleranceUsed: tolerance,
      detailedGaps,
      summary: {
        totalCdmt,
        totalCbmt,
        totalGap,
        gapPercent: totalGapPercent * 100,
      },
    };
  }
}
