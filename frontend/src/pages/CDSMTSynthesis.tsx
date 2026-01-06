import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import CDSMTSynthesisService from '../services/cdsmtSynthesis.service';
import api from '../config/api';
import {
  MinistrySDMTSummary,
  CDSMTValidation,
  NationalSynthesis,
  ProgramNode,
} from '../types/cdsmtSynthesis.types';
import './CDSMTSynthesis.css';

interface Ministry {
  id: string;
  code: string;
  name: string;
}

const CDSMTSynthesis: React.FC = () => {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistry, setSelectedMinistry] = useState<string>('');
  const [fiscalYear, setFiscalYear] = useState<number>(new Date().getFullYear());
  const [synthesis, setSynthesis] = useState<MinistrySDMTSummary | null>(null);
  const [validation, setValidation] = useState<CDSMTValidation | null>(null);
  const [nationalSynthesis, setNationalSynthesis] = useState<NationalSynthesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ministry' | 'national'>('ministry');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMinistries();
  }, []);

  const loadMinistries = async () => {
    try {
      const response = await api.get('/ministries');
      if (response.data.status === 'success') {
        setMinistries(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des ministeres:', error);
    }
  };

  const loadMinistrySynthesis = useCallback(async () => {
    if (!selectedMinistry) return;

    setLoading(true);
    try {
      const [synthData, validData] = await Promise.all([
        CDSMTSynthesisService.getMinistrySDMT(selectedMinistry, fiscalYear),
        CDSMTSynthesisService.validateMinistrySDMT(selectedMinistry, fiscalYear),
      ]);
      setSynthesis(synthData);
      setValidation(validData);
    } catch (error) {
      console.error('Erreur lors du chargement de la synthese:', error);
      alert('Erreur lors du chargement de la synthese CDSMT');
    } finally {
      setLoading(false);
    }
  }, [selectedMinistry, fiscalYear]);

  const loadNationalSynthesis = useCallback(async () => {
    setLoading(true);
    try {
      const data = await CDSMTSynthesisService.getNationalSynthesis(fiscalYear);
      setNationalSynthesis(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la synthese nationale:', error);
      alert('Erreur lors du chargement de la synthese nationale');
    } finally {
      setLoading(false);
    }
  }, [fiscalYear]);

  const handleExportCSV = async () => {
    if (!selectedMinistry || !synthesis) return;

    try {
      const blob = await CDSMTSynthesisService.exportMinistrySDMT(
        selectedMinistry,
        fiscalYear,
        'csv'
      );
      CDSMTSynthesisService.downloadCSV(
        blob,
        `CDSMT_${synthesis.ministryCode}_${fiscalYear}.csv`
      );
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export CSV');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const toggleProgram = (programId: string) => {
    setExpandedPrograms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(programId)) {
        newSet.delete(programId);
      } else {
        newSet.add(programId);
      }
      return newSet;
    });
  };

  const toggleAction = (actionId: string) => {
    setExpandedActions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };

  const renderProgramRow = (program: ProgramNode) => {
    const isExpanded = expandedPrograms.has(program.code);
    return (
      <React.Fragment key={program.code}>
        <tr className="program-row" onClick={() => toggleProgram(program.code)}>
          <td className="level-program">
            <span className="expand-icon">{isExpanded ? '[-]' : '[+]'}</span>
            {program.code}
          </td>
          <td className="program-label">{program.label}</td>
          <td className="amount">{formatCurrency(program.tendancielY1)}</td>
          <td className="amount">{formatCurrency(program.mesuresNouvellesY1)}</td>
          <td className="amount highlight">{formatCurrency(program.previsionsY1)}</td>
          <td className="amount">{formatCurrency(program.tendancielY2)}</td>
          <td className="amount">{formatCurrency(program.mesuresNouvellesY2)}</td>
          <td className="amount highlight">{formatCurrency(program.previsionsY2)}</td>
          <td className="amount">{formatCurrency(program.tendancielY3)}</td>
          <td className="amount">{formatCurrency(program.mesuresNouvellesY3)}</td>
          <td className="amount highlight">{formatCurrency(program.previsionsY3)}</td>
          <td className="amount total">{formatCurrency(program.totalPrevisions)}</td>
        </tr>
        {isExpanded &&
          program.children?.map((action) => {
            const isActionExpanded = expandedActions.has(action.code);
            return (
              <React.Fragment key={action.code}>
                <tr className="action-row" onClick={() => toggleAction(action.code)}>
                  <td className="level-action">
                    <span className="expand-icon">{isActionExpanded ? '[-]' : '[+]'}</span>
                    {action.code}
                  </td>
                  <td className="action-label">{action.label}</td>
                  <td className="amount">{formatCurrency(action.tendancielY1)}</td>
                  <td className="amount">{formatCurrency(action.mesuresNouvellesY1)}</td>
                  <td className="amount">{formatCurrency(action.previsionsY1)}</td>
                  <td className="amount">{formatCurrency(action.tendancielY2)}</td>
                  <td className="amount">{formatCurrency(action.mesuresNouvellesY2)}</td>
                  <td className="amount">{formatCurrency(action.previsionsY2)}</td>
                  <td className="amount">{formatCurrency(action.tendancielY3)}</td>
                  <td className="amount">{formatCurrency(action.mesuresNouvellesY3)}</td>
                  <td className="amount">{formatCurrency(action.previsionsY3)}</td>
                  <td className="amount">{formatCurrency(action.totalPrevisions)}</td>
                </tr>
                {isActionExpanded &&
                  action.children?.map((activity) => (
                    <tr key={activity.code} className="activity-row">
                      <td className="level-activity">{activity.code}</td>
                      <td className="activity-label">{activity.label}</td>
                      <td className="amount">{formatCurrency(activity.tendancielY1)}</td>
                      <td className="amount">{formatCurrency(activity.mesuresNouvellesY1)}</td>
                      <td className="amount">{formatCurrency(activity.previsionsY1)}</td>
                      <td className="amount">{formatCurrency(activity.tendancielY2)}</td>
                      <td className="amount">{formatCurrency(activity.mesuresNouvellesY2)}</td>
                      <td className="amount">{formatCurrency(activity.previsionsY2)}</td>
                      <td className="amount">{formatCurrency(activity.tendancielY3)}</td>
                      <td className="amount">{formatCurrency(activity.mesuresNouvellesY3)}</td>
                      <td className="amount">{formatCurrency(activity.previsionsY3)}</td>
                      <td className="amount">{formatCurrency(activity.totalPrevisions)}</td>
                    </tr>
                  ))}
              </React.Fragment>
            );
          })}
      </React.Fragment>
    );
  };

  return (
    <div className="cdsmt-synthesis-page">
      <PageHeader
        title="Synthese CDSMT"
        subtitle="Maquette CDSMT - Figure 10 du Guide Methodologique"
        action={
          <div className="header-actions">
            {activeTab === 'ministry' && synthesis && (
              <Button onClick={handleExportCSV} variant="secondary">
                Exporter CSV
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'ministry' ? 'active' : ''}`}
          onClick={() => setActiveTab('ministry')}
        >
          Synthese Ministerielle
        </button>
        <button
          className={`tab ${activeTab === 'national' ? 'active' : ''}`}
          onClick={() => setActiveTab('national')}
        >
          Synthese Nationale
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Annee Fiscale:</label>
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(parseInt(e.target.value))}
          >
            {[2023, 2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {activeTab === 'ministry' && (
          <div className="filter-group">
            <label>Ministere:</label>
            <select
              value={selectedMinistry}
              onChange={(e) => setSelectedMinistry(e.target.value)}
            >
              <option value="">Selectionner un ministere</option>
              {ministries.map((ministry) => (
                <option key={ministry.id} value={ministry.id}>
                  {ministry.code} - {ministry.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button
          onClick={activeTab === 'ministry' ? loadMinistrySynthesis : loadNationalSynthesis}
          variant="primary"
          disabled={loading || (activeTab === 'ministry' && !selectedMinistry)}
        >
          {loading ? 'Chargement...' : 'Generer Synthese'}
        </Button>
      </div>

      {/* Ministry Synthesis Content */}
      {activeTab === 'ministry' && synthesis && (
        <div className="synthesis-content">
          {/* Header Info */}
          <div className="synthesis-header">
            <h2>MAQUETTE CDSMT - {synthesis.ministryName}</h2>
            <p>Annee de preparation: {synthesis.fiscalYear}</p>
          </div>

          {/* Validation Status */}
          {validation && (
            <div className={`validation-banner ${validation.isValid ? 'valid' : 'invalid'}`}>
              <span className="validation-icon">{validation.isValid ? '✓' : '!'}</span>
              <span className="validation-text">
                {validation.isValid
                  ? 'CDSMT conforme au plafond CDMT Global'
                  : 'CDSMT non conforme au plafond CDMT Global'}
              </span>
              {validation.warnings.length > 0 && (
                <span className="warning-count">{validation.warnings.length} avertissement(s)</span>
              )}
            </div>
          )}

          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card ceiling">
              <div className="card-title">Plafonds CDMT Global</div>
              <div className="card-values">
                <div className="year-value">
                  <span className="year">N+1</span>
                  <span className="value">{formatCurrency(synthesis.ceilingY1)} DJF</span>
                </div>
                <div className="year-value">
                  <span className="year">N+2</span>
                  <span className="value">{formatCurrency(synthesis.ceilingY2)} DJF</span>
                </div>
                <div className="year-value">
                  <span className="year">N+3</span>
                  <span className="value">{formatCurrency(synthesis.ceilingY3)} DJF</span>
                </div>
              </div>
            </div>

            <div className="summary-card previsions">
              <div className="card-title">Previsions CDSMT</div>
              <div className="card-values">
                <div className="year-value">
                  <span className="year">N+1</span>
                  <span className="value">{formatCurrency(synthesis.totalPrevisionsY1)} DJF</span>
                </div>
                <div className="year-value">
                  <span className="year">N+2</span>
                  <span className="value">{formatCurrency(synthesis.totalPrevisionsY2)} DJF</span>
                </div>
                <div className="year-value">
                  <span className="year">N+3</span>
                  <span className="value">{formatCurrency(synthesis.totalPrevisionsY3)} DJF</span>
                </div>
              </div>
            </div>

            <div className="summary-card gaps">
              <div className="card-title">Ecarts avec Plafonds</div>
              <div className="card-values">
                <div className={`year-value ${synthesis.gapY1 >= 0 ? 'positive' : 'negative'}`}>
                  <span className="year">N+1</span>
                  <span className="value">{formatCurrency(synthesis.gapY1)} DJF</span>
                </div>
                <div className={`year-value ${synthesis.gapY2 >= 0 ? 'positive' : 'negative'}`}>
                  <span className="year">N+2</span>
                  <span className="value">{formatCurrency(synthesis.gapY2)} DJF</span>
                </div>
                <div className={`year-value ${synthesis.gapY3 >= 0 ? 'positive' : 'negative'}`}>
                  <span className="year">N+3</span>
                  <span className="value">{formatCurrency(synthesis.gapY3)} DJF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Programmatic Structure Table */}
          <div className="table-section">
            <h3>Structure Programmatique</h3>
            <div className="table-wrapper">
              <table className="cdsmt-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Code</th>
                    <th rowSpan={2}>Libelle</th>
                    <th colSpan={3}>N+1 ({fiscalYear + 1})</th>
                    <th colSpan={3}>N+2 ({fiscalYear + 2})</th>
                    <th colSpan={3}>N+3 ({fiscalYear + 3})</th>
                    <th rowSpan={2}>Total</th>
                  </tr>
                  <tr>
                    <th>Tend.</th>
                    <th>M.N.</th>
                    <th>Prev.</th>
                    <th>Tend.</th>
                    <th>M.N.</th>
                    <th>Prev.</th>
                    <th>Tend.</th>
                    <th>M.N.</th>
                    <th>Prev.</th>
                  </tr>
                </thead>
                <tbody>
                  {synthesis.programs.map((program) => renderProgramRow(program))}
                  <tr className="total-row">
                    <td colSpan={2}>TOTAL MINISTERE</td>
                    <td className="amount">{formatCurrency(synthesis.totalTendancielY1)}</td>
                    <td className="amount">{formatCurrency(synthesis.totalMesuresNouvellesY1)}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.totalPrevisionsY1)}</td>
                    <td className="amount">{formatCurrency(synthesis.totalTendancielY2)}</td>
                    <td className="amount">{formatCurrency(synthesis.totalMesuresNouvellesY2)}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.totalPrevisionsY2)}</td>
                    <td className="amount">{formatCurrency(synthesis.totalTendancielY3)}</td>
                    <td className="amount">{formatCurrency(synthesis.totalMesuresNouvellesY3)}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.totalPrevisionsY3)}</td>
                    <td className="amount total">
                      {formatCurrency(
                        synthesis.totalPrevisionsY1 +
                          synthesis.totalPrevisionsY2 +
                          synthesis.totalPrevisionsY3
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Economic Category Breakdown */}
          <div className="table-section">
            <h3>Repartition par Categorie Economique</h3>
            <div className="table-wrapper">
              <table className="economic-table">
                <thead>
                  <tr>
                    <th>Categorie</th>
                    <th colSpan={3}>N+1</th>
                    <th colSpan={3}>N+2</th>
                    <th colSpan={3}>N+3</th>
                  </tr>
                  <tr>
                    <th></th>
                    <th>Tend.</th>
                    <th>M.N.</th>
                    <th>Prev.</th>
                    <th>Tend.</th>
                    <th>M.N.</th>
                    <th>Prev.</th>
                    <th>Tend.</th>
                    <th>M.N.</th>
                    <th>Prev.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Personnel</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.personnel.tendanciel[0])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.personnel.mesuresNouvelles[0])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.personnel.previsions[0])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.personnel.tendanciel[1])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.personnel.mesuresNouvelles[1])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.personnel.previsions[1])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.personnel.tendanciel[2])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.personnel.mesuresNouvelles[2])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.personnel.previsions[2])}</td>
                  </tr>
                  <tr>
                    <td>Biens et Services</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.goodsServices.tendanciel[0])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.goodsServices.mesuresNouvelles[0])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.goodsServices.previsions[0])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.goodsServices.tendanciel[1])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.goodsServices.mesuresNouvelles[1])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.goodsServices.previsions[1])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.goodsServices.tendanciel[2])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.goodsServices.mesuresNouvelles[2])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.goodsServices.previsions[2])}</td>
                  </tr>
                  <tr>
                    <td>Transferts</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.transfers.tendanciel[0])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.transfers.mesuresNouvelles[0])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.transfers.previsions[0])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.transfers.tendanciel[1])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.transfers.mesuresNouvelles[1])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.transfers.previsions[1])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.transfers.tendanciel[2])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.transfers.mesuresNouvelles[2])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.transfers.previsions[2])}</td>
                  </tr>
                  <tr>
                    <td>Investissements Internes</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.internalInvestment.tendanciel[0])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.internalInvestment.mesuresNouvelles[0])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.internalInvestment.previsions[0])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.internalInvestment.tendanciel[1])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.internalInvestment.mesuresNouvelles[1])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.internalInvestment.previsions[1])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.internalInvestment.tendanciel[2])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.internalInvestment.mesuresNouvelles[2])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.internalInvestment.previsions[2])}</td>
                  </tr>
                  <tr>
                    <td>Investissements Externes</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.externalInvestment.tendanciel[0])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.externalInvestment.mesuresNouvelles[0])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.externalInvestment.previsions[0])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.externalInvestment.tendanciel[1])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.externalInvestment.mesuresNouvelles[1])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.externalInvestment.previsions[1])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.externalInvestment.tendanciel[2])}</td>
                    <td className="amount">{formatCurrency(synthesis.byEconomicCategory.externalInvestment.mesuresNouvelles[2])}</td>
                    <td className="amount highlight">{formatCurrency(synthesis.byEconomicCategory.externalInvestment.previsions[2])}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* National Synthesis Content */}
      {activeTab === 'national' && nationalSynthesis && (
        <div className="synthesis-content">
          <div className="synthesis-header">
            <h2>SYNTHESE NATIONALE CDSMT</h2>
            <p>Annee de preparation: {nationalSynthesis.fiscalYear}</p>
            <p className="generated-at">
              Genere le: {new Date(nationalSynthesis.generatedAt).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {/* Conformity Stats */}
          <div className="conformity-stats">
            <div className={`conformity-card ${nationalSynthesis.conformityStats.conformityRate >= 80 ? 'good' : nationalSynthesis.conformityStats.conformityRate >= 50 ? 'warning' : 'bad'}`}>
              <div className="conformity-rate">
                {nationalSynthesis.conformityStats.conformityRate.toFixed(1)}%
              </div>
              <div className="conformity-label">Taux de Conformite</div>
              <div className="conformity-details">
                {nationalSynthesis.conformityStats.conformantMinistries} / {nationalSynthesis.conformityStats.totalMinistries} ministeres conformes
              </div>
            </div>
          </div>

          {/* National Totals */}
          <div className="summary-cards">
            <div className="summary-card ceiling">
              <div className="card-title">Total Plafonds</div>
              <div className="card-values">
                <div className="year-value">
                  <span className="year">N+1</span>
                  <span className="value">{formatCurrency(nationalSynthesis.totalCeilings.y1)} DJF</span>
                </div>
                <div className="year-value">
                  <span className="year">N+2</span>
                  <span className="value">{formatCurrency(nationalSynthesis.totalCeilings.y2)} DJF</span>
                </div>
                <div className="year-value">
                  <span className="year">N+3</span>
                  <span className="value">{formatCurrency(nationalSynthesis.totalCeilings.y3)} DJF</span>
                </div>
              </div>
            </div>

            <div className="summary-card previsions">
              <div className="card-title">Total Previsions</div>
              <div className="card-values">
                <div className="year-value">
                  <span className="year">N+1</span>
                  <span className="value">{formatCurrency(nationalSynthesis.totalPrevisions.y1)} DJF</span>
                </div>
                <div className="year-value">
                  <span className="year">N+2</span>
                  <span className="value">{formatCurrency(nationalSynthesis.totalPrevisions.y2)} DJF</span>
                </div>
                <div className="year-value">
                  <span className="year">N+3</span>
                  <span className="value">{formatCurrency(nationalSynthesis.totalPrevisions.y3)} DJF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ministries Table */}
          <div className="table-section">
            <h3>Resume par Ministere</h3>
            <div className="table-wrapper">
              <table className="national-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Ministere</th>
                    <th>Plafond N+1</th>
                    <th>Previsions N+1</th>
                    <th>Ecart N+1</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {nationalSynthesis.ministries.map((ministry) => (
                    <tr key={ministry.ministryId} className={ministry.isConformant ? 'conformant' : 'non-conformant'}>
                      <td>{ministry.ministryCode}</td>
                      <td>{ministry.ministryName}</td>
                      <td className="amount">{formatCurrency(ministry.ceilings.y1)}</td>
                      <td className="amount">{formatCurrency(ministry.previsions.y1)}</td>
                      <td className={`amount ${ministry.gaps.y1 >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(ministry.gaps.y1)}
                      </td>
                      <td>
                        <span className={`status-badge ${ministry.isConformant ? 'conformant' : 'non-conformant'}`}>
                          {ministry.isConformant ? 'Conforme' : 'Non conforme'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !synthesis && !nationalSynthesis && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">Aucune synthese chargee</div>
          <div className="empty-message">
            {activeTab === 'ministry'
              ? 'Selectionnez un ministere et cliquez sur "Generer Synthese"'
              : 'Cliquez sur "Generer Synthese" pour voir la synthese nationale'}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <div className="loading-text">Chargement en cours...</div>
        </div>
      )}
    </div>
  );
};

export default CDSMTSynthesis;
