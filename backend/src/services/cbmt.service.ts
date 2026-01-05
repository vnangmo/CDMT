import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateCBMTDocumentData {
  macroFrameworkId: string;
  fiscalYear: number;
  documentCode: string;
  title: string;
  description?: string;
  scenarioName?: string;
  totalRevenueCeiling: Decimal;
  totalExpenseCeiling: Decimal;
  fiscalDeficitCeiling?: Decimal;
  debtCeiling?: Decimal;
  currency?: string;
  unit?: string;
  notes?: string;
  createdBy?: string;
}

interface UpdateCBMTDocumentData {
  documentCode?: string;
  title?: string;
  description?: string;
  scenarioName?: string;
  totalRevenueCeiling?: Decimal;
  totalExpenseCeiling?: Decimal;
  fiscalDeficitCeiling?: Decimal;
  debtCeiling?: Decimal;
  currency?: string;
  unit?: string;
  notes?: string;
  status?: string;
  validatedBy?: string;
  validatedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

interface CreateCBMTAggregateData {
  cbmtDocumentId: string;
  aggregateType: string;
  economicNatureId?: string;
  categoryCode: string;
  categoryName: string;
  baseYear: number;
  baseAmount?: Decimal;
  year1: number;
  amount1?: Decimal;
  ceiling1?: Decimal;
  year2: number;
  amount2?: Decimal;
  ceiling2?: Decimal;
  year3: number;
  amount3?: Decimal;
  ceiling3?: Decimal;
  calculationMethod?: string;
  notes?: string;
}

interface CreateCBMTReserveData {
  cbmtDocumentId: string;
  reserveType: string;
  name: string;
  description?: string;
  year1: number;
  amount1?: Decimal;
  year2: number;
  amount2?: Decimal;
  year3: number;
  amount3?: Decimal;
  calculationBasis?: string;
  notes?: string;
}

export class CBMTService {
  /**
   * Obtenir tous les documents CBMT
   */
  static async getAll(filters?: {
    macroFrameworkId?: string;
    fiscalYear?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      macroFrameworkId,
      fiscalYear,
      status,
      page = 1,
      limit = 50,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (macroFrameworkId) {
      where.macroFrameworkId = macroFrameworkId;
    }

    if (fiscalYear) {
      where.fiscalYear = fiscalYear;
    }

    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      prisma.cBMTDocument.findMany({
        where,
        skip,
        take: limit,
        include: {
          macroFramework: true,
          aggregates: {
            orderBy: {
              categoryCode: 'asc',
            },
          },
          reserves: true,
          analyses: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.cBMTDocument.count({ where }),
    ]);

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir un document CBMT par ID
   */
  static async getById(id: string) {
    const document = await prisma.cBMTDocument.findUnique({
      where: { id },
      include: {
        macroFramework: true,
        aggregates: {
          orderBy: {
            categoryCode: 'asc',
          },
        },
        reserves: true,
        analyses: {
          orderBy: {
            analysisType: 'asc',
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    return document;
  }

  /**
   * Obtenir un document CBMT par cadre macro et année fiscale
   */
  static async getByMacroFrameworkAndYear(macroFrameworkId: string, fiscalYear: number) {
    const document = await prisma.cBMTDocument.findFirst({
      where: {
        macroFrameworkId,
        fiscalYear,
      },
      include: {
        macroFramework: true,
        aggregates: {
          orderBy: {
            categoryCode: 'asc',
          },
        },
        reserves: true,
        analyses: {
          orderBy: {
            analysisType: 'asc',
          },
        },
      },
    });

    return document;
  }

  /**
   * Créer un nouveau document CBMT
   */
  static async create(data: CreateCBMTDocumentData) {
    // Vérifier l'existence du cadre macroéconomique
    const macroFramework = await prisma.macroFramework.findUnique({
      where: { id: data.macroFrameworkId },
    });

    if (!macroFramework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    // Vérifier l'unicité (macroFrameworkId, fiscalYear)
    const existing = await this.getByMacroFrameworkAndYear(
      data.macroFrameworkId,
      data.fiscalYear
    );

    if (existing) {
      throw new ConflictError(
        `Un document CBMT existe déjà pour ce cadre macroéconomique et cette année fiscale`
      );
    }

    const document = await prisma.cBMTDocument.create({
      data: {
        ...data,
      },
      include: {
        macroFramework: true,
        aggregates: true,
        reserves: true,
        analyses: true,
      },
    });

    return document;
  }

  /**
   * Mettre à jour un document CBMT
   */
  static async update(id: string, data: UpdateCBMTDocumentData) {
    const existing = await this.getById(id);

    // Validation des transitions de statut
    if (data.status && existing.status !== data.status) {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ['VALIDATED'],
        VALIDATED: ['APPROVED'],
        APPROVED: [],
      };

      const allowedStatuses = validTransitions[existing.status] || [];
      if (!allowedStatuses.includes(data.status)) {
        throw new BadRequestError(
          `Transition de statut invalide: ${existing.status} → ${data.status}`
        );
      }
    }

    const document = await prisma.cBMTDocument.update({
      where: { id },
      data,
      include: {
        macroFramework: true,
        aggregates: true,
        reserves: true,
        analyses: true,
      },
    });

    return document;
  }

  /**
   * Supprimer un document CBMT
   */
  static async delete(id: string) {
    await this.getById(id);

    await prisma.cBMTDocument.delete({
      where: { id },
    });

    return { message: 'Document CBMT supprimé avec succès' };
  }

  /**
   * Valider un document CBMT (DRAFT → VALIDATED)
   */
  static async validate(id: string, userId: string) {
    const document = await this.getById(id);

    if (document.status !== 'DRAFT') {
      throw new BadRequestError('Seuls les documents en statut DRAFT peuvent être validés');
    }

    return this.update(id, {
      status: 'VALIDATED',
      validatedBy: userId,
      validatedAt: new Date(),
    });
  }

  /**
   * Approuver un document CBMT (VALIDATED → APPROVED)
   */
  static async approve(id: string, userId: string) {
    const document = await this.getById(id);

    if (document.status !== 'VALIDATED') {
      throw new BadRequestError('Seuls les documents en statut VALIDATED peuvent être approuvés');
    }

    return this.update(id, {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date(),
    });
  }

  /**
   * Générer automatiquement un CBMT depuis un TOFE
   */
  static async generateFromTOFE(macroFrameworkId: string, userId?: string) {
    // Récupérer le cadre macroéconomique
    const macroFramework = await prisma.macroFramework.findUnique({
      where: { id: macroFrameworkId },
      include: {
        revenueProjections: true,
        expenseProjections: true,
      },
    });

    if (!macroFramework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    // Récupérer le TOFE associé
    const tofeDocument = await prisma.tOFEDocument.findFirst({
      where: {
        macroFrameworkId,
        fiscalYear: macroFramework.budgetYear,
      },
      include: {
        lines: true,
      },
    });

    if (!tofeDocument) {
      throw new NotFoundError(
        'Aucun document TOFE trouvé. Veuillez générer le TOFE d\'abord.'
      );
    }

    // Vérifier si un CBMT existe déjà
    const existingCBMT = await this.getByMacroFrameworkAndYear(
      macroFrameworkId,
      macroFramework.budgetYear
    );

    if (existingCBMT) {
      throw new ConflictError('Un document CBMT existe déjà pour ce cadre macroéconomique');
    }

    // Calculer les plafonds globaux depuis le TOFE
    const totalRevenueLine = tofeDocument.lines.find(
      (line) => line.section === 'REVENUE' && line.lineCode === '1'
    );
    const totalExpenseLine = tofeDocument.lines.find(
      (line) => line.section === 'EXPENSE' && line.lineCode === '2'
    );
    const fiscalBalanceLine = tofeDocument.lines.find(
      (line) => line.section === 'BALANCE' && line.lineCode === '3.1'
    );

    if (!totalRevenueLine || !totalExpenseLine) {
      throw new BadRequestError('Données TOFE incomplètes pour générer le CBMT');
    }

    // Créer le document CBMT
    const cbmtDocument = await prisma.cBMTDocument.create({
      data: {
        macroFrameworkId,
        fiscalYear: macroFramework.budgetYear,
        documentCode: `CBMT-${macroFramework.budgetYear}`,
        title: `CBMT ${macroFramework.budgetYear}-${macroFramework.budgetYear + 2}`,
        description: `Cadre Budgétaire à Moyen Terme généré automatiquement depuis le TOFE`,
        scenarioName: 'Scénario de base',
        scenarioType: 'BASE',
        totalRevenueCeiling: totalRevenueLine.amount1,
        totalExpenseCeiling: totalExpenseLine.amount1,
        fiscalDeficitCeiling: fiscalBalanceLine?.amount1 || new Decimal(0),
        currency: tofeDocument.currency,
        unit: tofeDocument.unit,
        status: 'DRAFT',
        createdBy: userId,
      },
      include: {
        macroFramework: true,
        aggregates: true,
        reserves: true,
        analyses: true,
      },
    });

    // Générer les agrégats de recettes par nature économique
    await this.generateRevenueAggregates(cbmtDocument.id, tofeDocument.lines);

    // Générer les agrégats de dépenses par nature économique
    await this.generateExpenseAggregates(cbmtDocument.id, tofeDocument.lines);

    // Générer les réserves budgétaires (2% des dépenses totales)
    await this.generateReserves(cbmtDocument.id, totalExpenseLine);

    // Recharger le document avec toutes les relations
    return this.getById(cbmtDocument.id);
  }

  /**
   * Générer les agrégats de recettes par nature économique
   */
  private static async generateRevenueAggregates(cbmtDocumentId: string, tofeLines: any[]) {
    // Extraire les lignes de recettes de niveau 1 du TOFE
    const revenueLines = tofeLines.filter(
      (line) => line.section === 'REVENUE' && line.lineLevel === 1
    );

    const aggregates = revenueLines.map((line) => ({
      cbmtDocumentId,
      aggregateType: 'REVENUE',
      categoryCode: line.lineCode,
      categoryName: line.lineLabel,
      baseYear: line.baseYear,
      baseAmount: line.baseAmount,
      year1: line.projectionYear1,
      amount1: line.amount1,
      ceiling1: line.amount1, // Plafond = projection initiale
      gap1: new Decimal(0),
      year2: line.projectionYear2,
      amount2: line.amount2,
      ceiling2: line.amount2,
      gap2: new Decimal(0),
      year3: line.projectionYear3 || line.projectionYear2 + 1,
      amount3: line.amount3 || line.amount2,
      ceiling3: line.amount3 || line.amount2,
      gap3: new Decimal(0),
      calculationMethod: 'AUTO',
    }));

    await prisma.cBMTAggregate.createMany({
      data: aggregates,
    });
  }

  /**
   * Générer les agrégats de dépenses par nature économique
   */
  private static async generateExpenseAggregates(cbmtDocumentId: string, tofeLines: any[]) {
    // Extraire les lignes de dépenses de niveau 1 du TOFE
    const expenseLines = tofeLines.filter(
      (line) => line.section === 'EXPENSE' && line.lineLevel === 1
    );

    const aggregates = expenseLines.map((line) => ({
      cbmtDocumentId,
      aggregateType: 'EXPENSE',
      categoryCode: line.lineCode,
      categoryName: line.lineLabel,
      baseYear: line.baseYear,
      baseAmount: line.baseAmount,
      year1: line.projectionYear1,
      amount1: line.amount1,
      ceiling1: line.amount1,
      gap1: new Decimal(0),
      year2: line.projectionYear2,
      amount2: line.amount2,
      ceiling2: line.amount2,
      gap2: new Decimal(0),
      year3: line.projectionYear3 || line.projectionYear2 + 1,
      amount3: line.amount3 || line.amount2,
      ceiling3: line.amount3 || line.amount2,
      gap3: new Decimal(0),
      calculationMethod: 'AUTO',
    }));

    await prisma.cBMTAggregate.createMany({
      data: aggregates,
    });
  }

  /**
   * Générer les réserves budgétaires
   */
  private static async generateReserves(cbmtDocumentId: string, totalExpenseLine: any) {
    const contingencyRate = 0.02; // 2% des dépenses totales

    await prisma.cBMTReserve.create({
      data: {
        cbmtDocumentId,
        reserveType: 'CONTINGENCY',
        name: 'Réserve pour imprévus',
        description: '2% des dépenses totales pour faire face aux imprévus budgétaires',
        year1: totalExpenseLine.projectionYear1,
        amount1: new Decimal(totalExpenseLine.amount1.toNumber() * contingencyRate),
        allocated1: new Decimal(0),
        available1: new Decimal(totalExpenseLine.amount1.toNumber() * contingencyRate),
        year2: totalExpenseLine.projectionYear2,
        amount2: new Decimal(totalExpenseLine.amount2.toNumber() * contingencyRate),
        allocated2: new Decimal(0),
        available2: new Decimal(totalExpenseLine.amount2.toNumber() * contingencyRate),
        year3: totalExpenseLine.projectionYear3 || totalExpenseLine.projectionYear2 + 1,
        amount3: new Decimal(
          (totalExpenseLine.amount3 || totalExpenseLine.amount2).toNumber() * contingencyRate
        ),
        allocated3: new Decimal(0),
        available3: new Decimal(
          (totalExpenseLine.amount3 || totalExpenseLine.amount2).toNumber() * contingencyRate
        ),
        calculationBasis: '2% des dépenses totales',
      },
    });
  }

  /**
   * Obtenir les agrégats d'un document CBMT
   */
  static async getAggregates(cbmtDocumentId: string, filters?: {
    aggregateType?: string;
    economicNatureId?: string;
  }) {
    await this.getById(cbmtDocumentId);

    const where: any = { cbmtDocumentId };

    if (filters?.aggregateType) {
      where.aggregateType = filters.aggregateType;
    }

    if (filters?.economicNatureId) {
      where.economicNatureId = filters.economicNatureId;
    }

    return prisma.cBMTAggregate.findMany({
      where,
      orderBy: {
        categoryCode: 'asc',
      },
    });
  }

  /**
   * Créer un agrégat CBMT
   */
  static async createAggregate(data: CreateCBMTAggregateData) {
    await this.getById(data.cbmtDocumentId);

    return prisma.cBMTAggregate.create({
      data,
    });
  }

  /**
   * Mettre à jour un agrégat CBMT
   */
  static async updateAggregate(id: string, data: Partial<CreateCBMTAggregateData>) {
    return prisma.cBMTAggregate.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer un agrégat CBMT
   */
  static async deleteAggregate(id: string) {
    await prisma.cBMTAggregate.delete({
      where: { id },
    });

    return { message: 'Agrégat CBMT supprimé avec succès' };
  }

  /**
   * Obtenir les réserves d'un document CBMT
   */
  static async getReserves(cbmtDocumentId: string) {
    await this.getById(cbmtDocumentId);

    return prisma.cBMTReserve.findMany({
      where: { cbmtDocumentId },
      orderBy: {
        reserveType: 'asc',
      },
    });
  }

  /**
   * Créer une réserve CBMT
   */
  static async createReserve(data: CreateCBMTReserveData) {
    await this.getById(data.cbmtDocumentId);

    return prisma.cBMTReserve.create({
      data,
    });
  }

  /**
   * Mettre à jour une réserve CBMT
   */
  static async updateReserve(id: string, data: Partial<CreateCBMTReserveData>) {
    return prisma.cBMTReserve.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer une réserve CBMT
   */
  static async deleteReserve(id: string) {
    await prisma.cBMTReserve.delete({
      where: { id },
    });

    return { message: 'Réserve CBMT supprimée avec succès' };
  }
}

export default CBMTService;
