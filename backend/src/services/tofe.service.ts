import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateTOFEDocumentData {
  macroFrameworkId: string;
  fiscalYear: number;
  documentCode: string;
  title: string;
  description?: string;
  currency?: string;
  unit?: string;
  notes?: string;
  createdBy?: string;
}

interface UpdateTOFEDocumentData {
  documentCode?: string;
  title?: string;
  description?: string;
  currency?: string;
  unit?: string;
  notes?: string;
  status?: string;
}

interface CreateTOFELineData {
  tofeDocumentId: string;
  section: string;
  lineCode: string;
  lineLabel: string;
  lineLevel?: number;
  parentLineId?: string;
  orderIndex: number;
  baseYear: number;
  baseAmount?: Decimal;
  projectionYear1: number;
  amount1?: Decimal;
  projectionYear2: number;
  amount2?: Decimal;
  projectionYear3?: number;
  amount3?: Decimal;
  isCalculated?: boolean;
  isBold?: boolean;
  accountCode?: string;
  gfsCode?: string;
  formula?: string;
  notes?: string;
}

export class TOFEService {
  /**
   * Obtenir tous les documents TOFE
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
      prisma.tOFEDocument.findMany({
        where,
        skip,
        take: limit,
        include: {
          macroFramework: true,
          lines: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.tOFEDocument.count({ where }),
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
   * Obtenir un document TOFE par ID
   */
  static async getById(id: string) {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id },
      include: {
        macroFramework: true,
        lines: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    return document;
  }

  /**
   * Obtenir un document TOFE par cadre macro et année fiscale
   */
  static async getByMacroFrameworkAndYear(macroFrameworkId: string, fiscalYear: number) {
    const document = await prisma.tOFEDocument.findUnique({
      where: {
        macroFrameworkId_fiscalYear: {
          macroFrameworkId,
          fiscalYear,
        },
      },
      include: {
        macroFramework: true,
        lines: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    return document;
  }

  /**
   * Créer un document TOFE
   */
  static async create(data: CreateTOFEDocumentData) {
    // Vérifier que le cadre macro existe
    const macroFramework = await prisma.macroFramework.findUnique({
      where: { id: data.macroFrameworkId },
    });

    if (!macroFramework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    // Vérifier l'unicité
    const existing = await prisma.tOFEDocument.findUnique({
      where: {
        macroFrameworkId_fiscalYear: {
          macroFrameworkId: data.macroFrameworkId,
          fiscalYear: data.fiscalYear,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Un document TOFE existe déjà pour ce cadre macro et cette année fiscale');
    }

    const document = await prisma.tOFEDocument.create({
      data: {
        macroFrameworkId: data.macroFrameworkId,
        fiscalYear: data.fiscalYear,
        documentCode: data.documentCode,
        title: data.title,
        description: data.description,
        currency: data.currency || 'DJF',
        unit: data.unit || 'MILLION',
        notes: data.notes,
        createdBy: data.createdBy,
        status: 'DRAFT',
      },
      include: {
        macroFramework: true,
      },
    });

    return document;
  }

  /**
   * Générer automatiquement un document TOFE à partir d'un cadre macro
   */
  static async generateFromMacroFramework(macroFrameworkId: string, userId?: string) {
    // Récupérer le cadre macro avec toutes les projections (optimized with select)
    const macroFramework = await prisma.macroFramework.findUnique({
      where: { id: macroFrameworkId },
      select: {
        id: true,
        year: true,
        budgetYear: true,
        gdpGrowthRate: true,
        inflationRate: true,
        revenueProjections: {
          where: { isActive: true },
          select: {
            id: true,
            categoryCode: true,
            categoryName: true,
            revenueType: true,
            baseAmount: true,
            projectedAmount1: true,
            projectedAmount2: true,
            projectedAmount3: true,
            projectionYear1: true,
            projectionYear2: true,
            projectionYear3: true,
          },
          orderBy: { categoryCode: 'asc' },
        },
        expenseProjections: {
          where: { isActive: true },
          select: {
            id: true,
            categoryCode: true,
            categoryName: true,
            ministryId: true,
            baseAmount: true,
            projectedAmount1: true,
            projectedAmount2: true,
            projectedAmount3: true,
            projectionYear1: true,
            projectionYear2: true,
            projectionYear3: true,
            ministry: {
              select: {
                id: true,
                code: true,
                name: true
              }
            },
          },
          orderBy: { categoryCode: 'asc' },
        },
      },
    });

    if (!macroFramework) {
      throw new NotFoundError('Cadre macroéconomique non trouvé');
    }

    // Vérifier si un TOFE existe déjà
    const existing = await this.getByMacroFrameworkAndYear(
      macroFrameworkId,
      macroFramework.budgetYear
    );

    if (existing) {
      throw new ConflictError('Un document TOFE existe déjà pour ce cadre macro');
    }

    // Créer le document TOFE
    const documentCode = `TOFE-${macroFramework.budgetYear}`;
    const title = `TOFE Prévisionnel ${macroFramework.budgetYear}-${macroFramework.budgetYear + 2}`;

    const document = await this.create({
      macroFrameworkId,
      fiscalYear: macroFramework.budgetYear,
      documentCode,
      title,
      description: `TOFE généré automatiquement à partir du cadre macroéconomique`,
      createdBy: userId,
    });

    // Générer les lignes TOFE selon la structure GFS 2014
    await this.generateTOFELines(document.id, macroFramework);

    // Retourner le document complet avec les lignes
    return this.getById(document.id);
  }

  /**
   * Générer les lignes TOFE selon la structure GFS 2014
   */
  private static async generateTOFELines(tofeDocumentId: string, macroFramework: any) {
    const baseYear = macroFramework.year;
    const year1 = macroFramework.budgetYear;
    const year2 = year1 + 1;
    const year3 = year1 + 2;

    const lines: CreateTOFELineData[] = [];
    let orderIndex = 0;

    // === SECTION 1: RECETTES ===
    const revenueSection = {
      tofeDocumentId,
      section: 'REVENUE',
      lineCode: '1',
      lineLabel: 'RECETTES TOTALES',
      lineLevel: 0,
      orderIndex: orderIndex++,
      baseYear,
      baseAmount: new Decimal(0),
      projectionYear1: year1,
      amount1: new Decimal(0),
      projectionYear2: year2,
      amount2: new Decimal(0),
      projectionYear3: year3,
      amount3: new Decimal(0),
      isCalculated: true,
      isBold: true,
      gfsCode: '1',
    };
    lines.push(revenueSection);

    // 1.1 Recettes fiscales
    let taxRevenueBase = new Decimal(0);
    let taxRevenue1 = new Decimal(0);
    let taxRevenue2 = new Decimal(0);
    let taxRevenue3 = new Decimal(0);

    const taxRevenues = macroFramework.revenueProjections.filter((r: any) => r.revenueType === 'TAX');

    if (taxRevenues.length > 0) {
      lines.push({
        tofeDocumentId,
        section: 'REVENUE',
        lineCode: '1.1',
        lineLabel: 'Recettes fiscales',
        lineLevel: 1,
        orderIndex: orderIndex++,
        baseYear,
        baseAmount: new Decimal(0),
        projectionYear1: year1,
        amount1: new Decimal(0),
        projectionYear2: year2,
        amount2: new Decimal(0),
        projectionYear3: year3,
        amount3: new Decimal(0),
        isCalculated: true,
        isBold: true,
        gfsCode: '11',
      });

      taxRevenues.forEach((rev: any, idx: number) => {
        const base = new Decimal(rev.baseAmount);
        const amt1 = new Decimal(rev.projectedAmount1);
        const amt2 = new Decimal(rev.projectedAmount2);
        const amt3 = rev.projectedAmount3 ? new Decimal(rev.projectedAmount3) : new Decimal(0);

        taxRevenueBase = taxRevenueBase.add(base);
        taxRevenue1 = taxRevenue1.add(amt1);
        taxRevenue2 = taxRevenue2.add(amt2);
        taxRevenue3 = taxRevenue3.add(amt3);

        lines.push({
          tofeDocumentId,
          section: 'REVENUE',
          lineCode: `1.1.${idx + 1}`,
          lineLabel: rev.categoryName,
          lineLevel: 2,
          orderIndex: orderIndex++,
          baseYear,
          baseAmount: base,
          projectionYear1: year1,
          amount1: amt1,
          projectionYear2: year2,
          amount2: amt2,
          projectionYear3: year3,
          amount3: amt3,
          isCalculated: false,
          isBold: false,
          gfsCode: `111${idx + 1}`,
          accountCode: rev.categoryCode,
        });
      });
    }

    // 1.2 Autres recettes (non-fiscales, dons, etc.)
    const otherRevenues = macroFramework.revenueProjections.filter((r: any) => r.revenueType !== 'TAX');

    if (otherRevenues.length > 0) {
      let otherRevenueBase = new Decimal(0);
      let otherRevenue1 = new Decimal(0);
      let otherRevenue2 = new Decimal(0);
      let otherRevenue3 = new Decimal(0);

      lines.push({
        tofeDocumentId,
        section: 'REVENUE',
        lineCode: '1.2',
        lineLabel: 'Autres recettes',
        lineLevel: 1,
        orderIndex: orderIndex++,
        baseYear,
        baseAmount: new Decimal(0),
        projectionYear1: year1,
        amount1: new Decimal(0),
        projectionYear2: year2,
        amount2: new Decimal(0),
        projectionYear3: year3,
        amount3: new Decimal(0),
        isCalculated: true,
        isBold: true,
        gfsCode: '12',
      });

      otherRevenues.forEach((rev: any, idx: number) => {
        const base = new Decimal(rev.baseAmount);
        const amt1 = new Decimal(rev.projectedAmount1);
        const amt2 = new Decimal(rev.projectedAmount2);
        const amt3 = rev.projectedAmount3 ? new Decimal(rev.projectedAmount3) : new Decimal(0);

        otherRevenueBase = otherRevenueBase.add(base);
        otherRevenue1 = otherRevenue1.add(amt1);
        otherRevenue2 = otherRevenue2.add(amt2);
        otherRevenue3 = otherRevenue3.add(amt3);

        taxRevenueBase = taxRevenueBase.add(base);
        taxRevenue1 = taxRevenue1.add(amt1);
        taxRevenue2 = taxRevenue2.add(amt2);
        taxRevenue3 = taxRevenue3.add(amt3);

        lines.push({
          tofeDocumentId,
          section: 'REVENUE',
          lineCode: `1.2.${idx + 1}`,
          lineLabel: rev.categoryName,
          lineLevel: 2,
          orderIndex: orderIndex++,
          baseYear,
          baseAmount: base,
          projectionYear1: year1,
          amount1: amt1,
          projectionYear2: year2,
          amount2: amt2,
          projectionYear3: year3,
          amount3: amt3,
          isCalculated: false,
          isBold: false,
          gfsCode: `12${idx + 1}`,
          accountCode: rev.categoryCode,
        });
      });
    }

    // === SECTION 2: DÉPENSES ===
    const expenseSection = {
      tofeDocumentId,
      section: 'EXPENSE',
      lineCode: '2',
      lineLabel: 'DÉPENSES TOTALES',
      lineLevel: 0,
      orderIndex: orderIndex++,
      baseYear,
      baseAmount: new Decimal(0),
      projectionYear1: year1,
      amount1: new Decimal(0),
      projectionYear2: year2,
      amount2: new Decimal(0),
      projectionYear3: year3,
      amount3: new Decimal(0),
      isCalculated: true,
      isBold: true,
      gfsCode: '2',
    };
    lines.push(expenseSection);

    // Accumulateurs pour le total des dépenses
    let totalExpenseBase = new Decimal(0);
    let totalExpense1 = new Decimal(0);
    let totalExpense2 = new Decimal(0);
    let totalExpense3 = new Decimal(0);

    // Accumulateurs pour les intérêts de la dette (solde primaire)
    let interestBase = new Decimal(0);
    let interest1 = new Decimal(0);
    let interest2 = new Decimal(0);
    let interest3 = new Decimal(0);

    // Structure des catégories de dépenses selon GFS 2014
    const expenseCategories = [
      { type: 'PERSONNEL', code: '2.1', label: 'Dépenses de personnel', gfs: '21' },
      { type: 'GOODS_SERVICES', code: '2.2', label: 'Biens et services', gfs: '22' },
      { type: 'DEBT_INTEREST', code: '2.3', label: 'Intérêts de la dette', gfs: '24', isInterest: true },
      { type: 'TRANSFERS', code: '2.4', label: 'Transferts et subventions', gfs: '25' },
      { type: 'SUBSIDIES', code: '2.5', label: 'Subventions', gfs: '26' },
      { type: 'INVESTMENT', code: '2.6', label: 'Investissements', gfs: '31' },
      { type: 'DEBT_SERVICE', code: '2.7', label: 'Remboursement du principal de la dette', gfs: '33' },
      { type: 'OTHER', code: '2.8', label: 'Autres dépenses', gfs: '28' },
    ];

    let categoryIndex = 1;
    for (const category of expenseCategories) {
      const categoryExpenses = macroFramework.expenseProjections.filter(
        (e: any) => e.expenseType === category.type || (category.isInterest && e.isInterest)
      );

      if (categoryExpenses.length > 0) {
        let categoryBase = new Decimal(0);
        let category1 = new Decimal(0);
        let category2 = new Decimal(0);
        let category3 = new Decimal(0);

        lines.push({
          tofeDocumentId,
          section: 'EXPENSE',
          lineCode: category.code,
          lineLabel: category.label,
          lineLevel: 1,
          orderIndex: orderIndex++,
          baseYear,
          baseAmount: new Decimal(0),
          projectionYear1: year1,
          amount1: new Decimal(0),
          projectionYear2: year2,
          amount2: new Decimal(0),
          projectionYear3: year3,
          amount3: new Decimal(0),
          isCalculated: true,
          isBold: true,
          gfsCode: category.gfs,
        });

        categoryExpenses.forEach((exp: any, idx: number) => {
          const base = new Decimal(exp.baseAmount);
          const amt1 = new Decimal(exp.projectedAmount1);
          const amt2 = new Decimal(exp.projectedAmount2);
          const amt3 = exp.projectedAmount3 ? new Decimal(exp.projectedAmount3) : new Decimal(0);

          categoryBase = categoryBase.add(base);
          category1 = category1.add(amt1);
          category2 = category2.add(amt2);
          category3 = category3.add(amt3);

          // Accumuler les intérêts pour le solde primaire
          if (category.isInterest || exp.isInterest || exp.expenseType === 'DEBT_INTEREST') {
            interestBase = interestBase.add(base);
            interest1 = interest1.add(amt1);
            interest2 = interest2.add(amt2);
            interest3 = interest3.add(amt3);
          }

          const label = exp.ministry ? `${exp.categoryName} - ${exp.ministry.name}` : exp.categoryName;

          lines.push({
            tofeDocumentId,
            section: 'EXPENSE',
            lineCode: `${category.code}.${idx + 1}`,
            lineLabel: label,
            lineLevel: 2,
            orderIndex: orderIndex++,
            baseYear,
            baseAmount: base,
            projectionYear1: year1,
            amount1: amt1,
            projectionYear2: year2,
            amount2: amt2,
            projectionYear3: year3,
            amount3: amt3,
            isCalculated: false,
            isBold: false,
            gfsCode: `${category.gfs}${idx + 1}`,
            accountCode: exp.categoryCode,
          });
        });

        // Ajouter aux totaux des dépenses
        totalExpenseBase = totalExpenseBase.add(categoryBase);
        totalExpense1 = totalExpense1.add(category1);
        totalExpense2 = totalExpense2.add(category2);
        totalExpense3 = totalExpense3.add(category3);

        categoryIndex++;
      }
    }

    // === SECTION 3: SOLDES BUDGÉTAIRES ===
    const totalRevenueBase = taxRevenueBase;
    const totalRevenue1 = taxRevenue1;
    const totalRevenue2 = taxRevenue2;
    const totalRevenue3 = taxRevenue3;

    // 3. Solde budgétaire global (Recettes - Dépenses)
    const balanceBase = totalRevenueBase.sub(totalExpenseBase);
    const balance1 = totalRevenue1.sub(totalExpense1);
    const balance2 = totalRevenue2.sub(totalExpense2);
    const balance3 = totalRevenue3.sub(totalExpense3);

    lines.push({
      tofeDocumentId,
      section: 'BALANCE',
      lineCode: '3',
      lineLabel: 'SOLDE GLOBAL (1 - 2)',
      lineLevel: 0,
      orderIndex: orderIndex++,
      baseYear,
      baseAmount: balanceBase,
      projectionYear1: year1,
      amount1: balance1,
      projectionYear2: year2,
      amount2: balance2,
      projectionYear3: year3,
      amount3: balance3,
      isCalculated: true,
      isBold: true,
      gfsCode: 'NOB',
      formula: '1 - 2',
    });

    // 4. Solde primaire (Recettes - Dépenses hors intérêts)
    const primaryBalanceBase = totalRevenueBase.sub(totalExpenseBase.sub(interestBase));
    const primaryBalance1 = totalRevenue1.sub(totalExpense1.sub(interest1));
    const primaryBalance2 = totalRevenue2.sub(totalExpense2.sub(interest2));
    const primaryBalance3 = totalRevenue3.sub(totalExpense3.sub(interest3));

    lines.push({
      tofeDocumentId,
      section: 'BALANCE',
      lineCode: '4',
      lineLabel: 'SOLDE PRIMAIRE (hors intérêts)',
      lineLevel: 0,
      orderIndex: orderIndex++,
      baseYear,
      baseAmount: primaryBalanceBase,
      projectionYear1: year1,
      amount1: primaryBalance1,
      projectionYear2: year2,
      amount2: primaryBalance2,
      projectionYear3: year3,
      amount3: primaryBalance3,
      isCalculated: true,
      isBold: true,
      gfsCode: 'NPB',
      formula: '1 - (2 - intérêts)',
      notes: 'Solde primaire = Recettes totales - (Dépenses totales - Charges d\'intérêts)',
    });

    // 5. Ligne mémo: Charges d'intérêts (pour référence)
    lines.push({
      tofeDocumentId,
      section: 'BALANCE',
      lineCode: '5',
      lineLabel: 'Pour mémoire: Charges d\'intérêts',
      lineLevel: 1,
      orderIndex: orderIndex++,
      baseYear,
      baseAmount: interestBase,
      projectionYear1: year1,
      amount1: interest1,
      projectionYear2: year2,
      amount2: interest2,
      projectionYear3: year3,
      amount3: interest3,
      isCalculated: true,
      isBold: false,
      gfsCode: '24',
      notes: 'Montant des intérêts utilisé pour le calcul du solde primaire',
    });

    // Créer toutes les lignes en une seule transaction
    await prisma.tOFELine.createMany({
      data: lines,
    });

    // Mettre à jour les montants calculés
    await this.recalculateAllLines(tofeDocumentId);
  }

  /**
   * Recalculer toutes les lignes calculées d'un document TOFE
   */
  static async recalculateAllLines(tofeDocumentId: string) {
    const lines = await prisma.tOFELine.findMany({
      where: { tofeDocumentId },
      orderBy: { orderIndex: 'asc' },
    });

    // Calculer les totaux pour chaque section
    for (const line of lines) {
      if (line.isCalculated) {
        const childLines = lines.filter(l => l.parentLineId === line.id || l.lineCode.startsWith(`${line.lineCode}.`));

        if (childLines.length > 0) {
          let baseSum = new Decimal(0);
          let amt1Sum = new Decimal(0);
          let amt2Sum = new Decimal(0);
          let amt3Sum = new Decimal(0);

          for (const child of childLines) {
            if (!child.isCalculated) {
              baseSum = baseSum.add(child.baseAmount);
              amt1Sum = amt1Sum.add(child.amount1);
              amt2Sum = amt2Sum.add(child.amount2);
              amt3Sum = amt3Sum.add(child.amount3 || 0);
            }
          }

          await prisma.tOFELine.update({
            where: { id: line.id },
            data: {
              baseAmount: baseSum,
              amount1: amt1Sum,
              amount2: amt2Sum,
              amount3: amt3Sum,
            },
          });
        }
      }
    }

    // Recalculer le solde budgétaire
    const revenueLine = lines.find(l => l.lineCode === '1');
    const expenseLine = lines.find(l => l.lineCode === '2');
    const balanceLine = lines.find(l => l.lineCode === '3');

    if (revenueLine && expenseLine && balanceLine) {
      await prisma.tOFELine.update({
        where: { id: balanceLine.id },
        data: {
          baseAmount: new Decimal(revenueLine.baseAmount).sub(expenseLine.baseAmount),
          amount1: new Decimal(revenueLine.amount1).sub(expenseLine.amount1),
          amount2: new Decimal(revenueLine.amount2).sub(expenseLine.amount2),
          amount3: new Decimal(revenueLine.amount3 || 0).sub(expenseLine.amount3 || 0),
        },
      });
    }
  }

  /**
   * Mettre à jour un document TOFE
   */
  static async update(id: string, data: UpdateTOFEDocumentData) {
    const existing = await prisma.tOFEDocument.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    const document = await prisma.tOFEDocument.update({
      where: { id },
      data,
      include: {
        macroFramework: true,
        lines: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    return document;
  }

  /**
   * Valider un document TOFE
   */
  static async validate(id: string, userId: string) {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    if (document.status !== 'DRAFT') {
      throw new BadRequestError('Seuls les documents en brouillon peuvent être validés');
    }

    return this.update(id, {
      status: 'VALIDATED',
      // validatedBy: userId,
      // validatedAt: new Date(),
    });
  }

  /**
   * Approuver un document TOFE
   */
  static async approve(id: string, userId: string) {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    if (document.status !== 'VALIDATED') {
      throw new BadRequestError('Seuls les documents validés peuvent être approuvés');
    }

    return this.update(id, {
      status: 'APPROVED',
      // approvedBy: userId,
      // approvedAt: new Date(),
    });
  }

  /**
   * Supprimer un document TOFE
   */
  static async delete(id: string) {
    const existing = await prisma.tOFEDocument.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    if (existing.status === 'APPROVED') {
      throw new BadRequestError('Les documents approuvés ne peuvent pas être supprimés');
    }

    await prisma.tOFEDocument.delete({
      where: { id },
    });

    return { message: 'Document TOFE supprimé avec succès' };
  }

  /**
   * Obtenir les lignes d'un document TOFE
   */
  static async getLines(tofeDocumentId: string) {
    const lines = await prisma.tOFELine.findMany({
      where: { tofeDocumentId },
      orderBy: { orderIndex: 'asc' },
    });

    return lines;
  }

  /**
   * Créer une ligne TOFE
   */
  static async createLine(data: CreateTOFELineData) {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id: data.tofeDocumentId },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    const line = await prisma.tOFELine.create({
      data,
    });

    // Recalculer les totaux
    await this.recalculateAllLines(data.tofeDocumentId);

    return line;
  }

  /**
   * Mettre à jour une ligne TOFE
   */
  static async updateLine(id: string, data: Partial<CreateTOFELineData>) {
    const existing = await prisma.tOFELine.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Ligne TOFE non trouvée');
    }

    const line = await prisma.tOFELine.update({
      where: { id },
      data,
    });

    // Recalculer les totaux
    await this.recalculateAllLines(existing.tofeDocumentId);

    return line;
  }

  /**
   * Supprimer une ligne TOFE
   */
  static async deleteLine(id: string) {
    const existing = await prisma.tOFELine.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Ligne TOFE non trouvée');
    }

    await prisma.tOFELine.delete({
      where: { id },
    });

    // Recalculer les totaux
    await this.recalculateAllLines(existing.tofeDocumentId);

    return { message: 'Ligne TOFE supprimée avec succès' };
  }
}

export default TOFEService;
