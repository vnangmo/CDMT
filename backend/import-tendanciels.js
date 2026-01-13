/**
 * Script d'importation des tendanciels (hypothèses et projections) depuis le fichier Excel
 * Importe les données de la feuille "Tendanciel" avec les taux de croissance
 */

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

// Mapping des noms de ministères Excel vers les codes BD
const MINISTRY_MAPPING = {
  'Présidence': 'PRES',
  'Primature': 'PRIM',
  'Justice': 'MJ',
  'Intérieur': 'MI',
  'Défense': 'MD',
  'Affaires étrangères ': 'MAE',
  'Affaires étrangères': 'MAE',
  'Budget': 'MB',
  'Economie et finances': 'MEF',
  'Commerce': 'MC',
  'Equipement (infrastructures)': 'MEQI',
  'Education': 'MEN',
  'Décentralisation': 'MDEC',
  'Travail': 'MT',
  'Investissement': 'MINV',
  'Santé': 'MS',
  'Environnement': 'MENV',
  'Agriculture': 'MAGR',
  'Energie': 'MENER',
  'Jeunesse et culture': 'MJC',
  'Communication': 'MCOM',
  'Femme et Famille': 'MFF',
  'Affaires musulmanes': 'MAM',
  'Affaires sociales': 'MAS',
  'Enseignement supérieur': 'MESUP',
  'Ville et logement': 'MVL',
  'Commissariat au Plan': 'CGP',
  'Economie Numérique et de L\'innovation': 'MENI',
  'Secrétariat d\'Etat chargé des Sports': 'SES',
  'Pouvoirs publics': 'PP',
  'Collectivités régionales': 'CR',
  'Collectivités locales': 'CL',
  'Dépenses centralisées': 'DC'
};

// Mapping des natures économiques (correspondant aux codes BD)
const NATURE_MAPPING = {
  'Salaires': 'SAL',
  'Matériels': 'MAT',
  'Transferts': 'TRF',
  'Dons affectés aux dépenses courantes': 'DAC',
  'Investissements Intérieurs': 'INV',
  'Dons Projets': 'DPR',
  'Emprunts Projets': 'EPR',
  'Intérêts': 'INT',
  'Amortissements': 'AMO',
  'Apurement arriérés intérieurs': 'AAI'
};

async function importTendanciels() {
  console.log('=== IMPORTATION DES TENDANCIELS ===\n');

  try {
    // 1. Charger le fichier Excel
    const excelPath = path.join(__dirname, '..', '20250614_Modele-Plafonds-Djibout_vfDB-2026-2028-LFI2025.xlsm');
    console.log(`Lecture du fichier: ${excelPath}`);

    const workbook = XLSX.readFile(excelPath);

    // 2. Lire les deux feuilles
    const tendancielSheet = workbook.Sheets['Tendanciel'];
    const hypothesesSheet = workbook.Sheets['Hypothèses croiss tendanciel'];

    if (!tendancielSheet) {
      throw new Error('Feuille "Tendanciel" non trouvée');
    }

    const tendancielData = XLSX.utils.sheet_to_json(tendancielSheet, { header: 1 });
    const hypothesesData = hypothesesSheet ? XLSX.utils.sheet_to_json(hypothesesSheet, { header: 1 }) : [];

    console.log(`Lignes Tendanciel: ${tendancielData.length}`);
    console.log(`Lignes Hypothèses: ${hypothesesData.length}`);

    // 3. Récupérer les référentiels de la BD
    const ministries = await prisma.ministry.findMany();
    const economicNatures = await prisma.economicNature.findMany();

    const ministryByCode = {};
    ministries.forEach(m => { ministryByCode[m.code] = m; });

    const natureByCode = {};
    economicNatures.forEach(n => { natureByCode[n.code] = n; });

    console.log(`Ministères dans BD: ${ministries.length}`);
    console.log(`Natures économiques dans BD: ${economicNatures.length}`);

    // 4. Trouver la configuration tendancielle existante
    let trendConfig = await prisma.trendBudgetConfig.findFirst({
      where: { fiscalYear: 2025 }
    });

    if (!trendConfig) {
      trendConfig = await prisma.trendBudgetConfig.create({
        data: {
          configCode: `TREND-IMPORT-${Date.now()}`,
          name: 'Configuration Tendancielle 2025 - Import Excel',
          fiscalYear: 2025,
          baselineStartYear: 2023,
          baselineEndYear: 2025,
          globalGrowthRate: 3.0,
          projectionYears: 3,
          excludeTemporary: true,
          baselineCalculationMethod: 'BUDGET_N_ONLY',
          status: 'DRAFT'
        }
      });
      console.log(`Nouvelle configuration tendancielle créée: ${trendConfig.id}`);
    } else {
      console.log(`Configuration tendancielle existante: ${trendConfig.id}`);
    }

    // 5. Supprimer les anciennes projections pour cette config
    const deleted = await prisma.trendProjection.deleteMany({
      where: { trendConfigId: trendConfig.id }
    });
    console.log(`Projections précédentes supprimées: ${deleted.count}`);

    // 6. Parser les données tendancielles
    // Structure Excel (conformément au fichier):
    // Colonnes: 0=Label, 1=2023, 2=2024, 3=2025(Base N), 4=2026(N+1), 5=2027(N+2), 6=2028(N+3)
    // Chaque ministère a un bloc avec:
    // - Ligne titre (nom ministère, années)
    // - Lignes par nature (nom nature, montants par année)
    // - Ligne Total
    // - Lignes vides

    let currentMinistry = null;
    let imported = 0;
    const errors = [];

    // Parser aussi les hypothèses pour obtenir les taux de croissance
    // Les taux dans Excel sont en format décimal (0.186 = 18.6%)
    const growthRates = {};
    let currentHypMinistry = null;

    for (let i = 0; i < hypothesesData.length; i++) {
      const row = hypothesesData[i];
      if (!row || row.length === 0) continue;

      const label = String(row[0] || '').trim();

      // Détecter un nouveau ministère
      const ministryCode = MINISTRY_MAPPING[label];
      if (ministryCode) {
        currentHypMinistry = ministryCode;
        continue;
      }

      // Détecter une nature économique
      const natureCode = NATURE_MAPPING[label];
      if (natureCode && currentHypMinistry) {
        const key = `${currentHypMinistry}_${natureCode}`;
        // Les taux Excel sont en décimal (0.186 = 18.6%), convertir en pourcentage
        growthRates[key] = {
          rate1: (parseFloat(row[1]) || 0) * 100,  // 0.186 → 18.6
          rate2: (parseFloat(row[2]) || 0) * 100,
          rate3: (parseFloat(row[3]) || 0) * 100
        };
      }
    }

    console.log(`Hypothèses de croissance chargées: ${Object.keys(growthRates).length}`);

    // Parser les données tendancielles
    for (let i = 0; i < tendancielData.length; i++) {
      const row = tendancielData[i];
      if (!row || row.length === 0) continue;

      const label = String(row[0] || '').trim();

      // Détecter un nouveau ministère
      const ministryCode = MINISTRY_MAPPING[label];
      if (ministryCode) {
        currentMinistry = ministryByCode[ministryCode];
        if (!currentMinistry) {
          errors.push(`Ministère non trouvé: ${ministryCode} (${label})`);
        }
        continue;
      }

      // Ignorer les lignes "Total" et "Années" (récapitulatifs)
      if (label.toLowerCase() === 'total' || label.toLowerCase() === 'années') {
        continue;
      }

      // Détecter une nature économique avec des données
      const natureCode = NATURE_MAPPING[label];
      if (natureCode && currentMinistry) {
        const nature = natureByCode[natureCode];
        if (!nature) {
          errors.push(`Nature non trouvée: ${natureCode}`);
          continue;
        }

        // Structure Excel correcte:
        // Colonnes: 0=label, 1=2023, 2=2024, 3=2025(Base N), 4=2026(N+1), 5=2027(N+2), 6=2028(N+3)
        const baseAmount = parseFloat(row[3]) || 0;  // 2025 = Base N
        const proj2026 = parseFloat(row[4]) || 0;    // N+1
        const proj2027 = parseFloat(row[5]) || 0;    // N+2
        const proj2028 = parseFloat(row[6]) || 0;    // N+3

        // Ignorer les lignes récapitulatives (Base = 0 mais projections > 0)
        // Ce sont les totaux généraux par nature en fin de fichier
        if (baseAmount === 0 && (proj2026 > 0 || proj2027 > 0 || proj2028 > 0)) {
          continue;
        }

        // Ignorer si tout est à 0
        if (baseAmount === 0 && proj2026 === 0 && proj2027 === 0 && proj2028 === 0) {
          continue;
        }

        // Récupérer les taux de croissance depuis les hypothèses (déjà convertis en %)
        const ratesKey = `${currentMinistry.code}_${natureCode}`;
        const rates = growthRates[ratesKey] || { rate1: 0, rate2: 0, rate3: 0 };

        try {
          await prisma.trendProjection.create({
            data: {
              trendConfigId: trendConfig.id,
              ministryId: currentMinistry.id,
              economicNatureId: nature.id,
              baseAmount: baseAmount,
              historicalYearsUsed: [2023, 2024, 2025],
              temporaryExcluded: false,
              exceptionalExcluded: false,
              projectionYear1: 2026,        // Années corrigées
              projectedAmount1: proj2026,
              growthRate1: rates.rate1,     // Déjà en pourcentage
              projectionYear2: 2027,
              projectedAmount2: proj2027,
              growthRate2: rates.rate2,
              projectionYear3: 2028,
              projectedAmount3: proj2028,
              growthRate3: rates.rate3,
              isPriorityMinistry: currentMinistry.isPriority || false,
              calculationMethod: 'EXCEL_IMPORT',
              lastCalculatedAt: new Date(),
              notes: `Import depuis Excel - ${currentMinistry.code}/${natureCode}`
            }
          });
          imported++;
        } catch (err) {
          if (err.code === 'P2002') {
            // Mise à jour si doublon
            await prisma.trendProjection.updateMany({
              where: {
                trendConfigId: trendConfig.id,
                ministryId: currentMinistry.id,
                economicNatureId: nature.id
              },
              data: {
                baseAmount: baseAmount,
                projectedAmount1: proj2026,
                growthRate1: rates.rate1,
                projectedAmount2: proj2027,
                growthRate2: rates.rate2,
                projectedAmount3: proj2028,
                growthRate3: rates.rate3,
                lastCalculatedAt: new Date()
              }
            });
            imported++;
          } else {
            errors.push(`Erreur insertion: ${err.message}`);
          }
        }
      }
    }

    // 7. Résumé
    console.log('\n=== RÉSUMÉ DE L\'IMPORTATION ===');
    console.log(`Projections importées: ${imported}`);

    if (errors.length > 0) {
      console.log(`\nErreurs (${errors.length}):`);
      const uniqueErrors = [...new Set(errors)];
      uniqueErrors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
    }

    // 8. Vérifier les données importées
    const projections = await prisma.trendProjection.findMany({
      where: { trendConfigId: trendConfig.id },
      include: { ministry: true, economicNature: true }
    });

    console.log(`\n=== PROJECTIONS PAR MINISTÈRE (Top 10) ===`);
    const byMinistry = {};
    projections.forEach(p => {
      const name = p.ministry.code;
      if (!byMinistry[name]) byMinistry[name] = { count: 0, base: 0, total2026: 0, total2027: 0, total2028: 0 };
      byMinistry[name].count++;
      byMinistry[name].base += parseFloat(p.baseAmount) || 0;
      byMinistry[name].total2026 += parseFloat(p.projectedAmount1) || 0;
      byMinistry[name].total2027 += parseFloat(p.projectedAmount2) || 0;
      byMinistry[name].total2028 += parseFloat(p.projectedAmount3) || 0;
    });

    Object.entries(byMinistry)
      .sort((a, b) => b[1].total2026 - a[1].total2026)
      .slice(0, 10)
      .forEach(([code, data]) => {
        console.log(`${code}: ${data.count} lignes, Base2025: ${(data.base / 1e9).toFixed(2)} Mds, 2026: ${(data.total2026 / 1e9).toFixed(2)} Mds, 2027: ${(data.total2027 / 1e9).toFixed(2)} Mds, 2028: ${(data.total2028 / 1e9).toFixed(2)} Mds`);
      });

    // Totaux globaux
    const totals = projections.reduce((acc, p) => {
      acc.base += parseFloat(p.baseAmount) || 0;
      acc.total2026 += parseFloat(p.projectedAmount1) || 0;
      acc.total2027 += parseFloat(p.projectedAmount2) || 0;
      acc.total2028 += parseFloat(p.projectedAmount3) || 0;
      return acc;
    }, { base: 0, total2026: 0, total2027: 0, total2028: 0 });

    console.log(`\n=== TOTAUX GLOBAUX ===`);
    console.log(`Base 2025 (N): ${(totals.base / 1e9).toFixed(2)} Mds DJF`);
    console.log(`2026 (N+1): ${(totals.total2026 / 1e9).toFixed(2)} Mds DJF`);
    console.log(`2027 (N+2): ${(totals.total2027 / 1e9).toFixed(2)} Mds DJF`);
    console.log(`2028 (N+3): ${(totals.total2028 / 1e9).toFixed(2)} Mds DJF`);

    console.log('\n=== IMPORTATION TERMINÉE ===');

  } catch (error) {
    console.error('Erreur lors de l\'importation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter l'importation
importTendanciels();
