import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Button from '../components/common/Button';
import sectoralTrendService from '../services/sectoralTrend.service';
import trendBudgetService from '../services/trendBudget.service';
import {
  ActionSummary,
  ActivitySummary,
  CeilingExceedancesResult,
  IntegratePIEPIPResult,
  SectoralCoherenceValidation,
} from '../types/sectoralTrend.types';
import { TrendBudgetConfig } from '../types/trendBudget.types';
import './SectoralTrendView.css';

const SectoralTrendView: React.FC = () => {
  const { trendConfigId } = useParams<{ trendConfigId: string }>();
  const [trendConfig, setTrendConfig] = useState<TrendBudgetConfig | null>(null);
  const [actionSummaries, setActionSummaries] = useState<ActionSummary[]>([]);
  const [activitySummaries, setActivitySummaries] = useState<ActivitySummary[]>([]);
  const [exceedances, setExceedances] = useState<CeilingExceedancesResult | null>(null);
  const [validation, setValidation] = useState<SectoralCoherenceValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'actions' | 'activities' | 'exceedances' | 'validation'>('actions');
  const [calculating, setCalculating] = useState(false);
  const [integrating, setIntegrating] = useState(false);

  useEffect(() => {
    if (trendConfigId) {
      loadData();
    }
  }, [trendConfigId]);

  const loadData = async () => {
    if (!trendConfigId) return;

    try {
      setLoading(true);
      const [configData, actionsData, activitiesData, exceedancesData, validationData] = await Promise.all([
        trendBudgetService.getTrendBudgetConfig(trendConfigId),
        sectoralTrendService.getSummaryByAction(trendConfigId),
        sectoralTrendService.getSummaryByActivity(trendConfigId),
        sectoralTrendService.checkCeilingExceedances(trendConfigId),
        sectoralTrendService.validateCoherence(trendConfigId),
      ]);

      setTrendConfig(configData);
      setActionSummaries(Array.isArray(actionsData) ? actionsData : []);
      setActivitySummaries(Array.isArray(activitiesData) ? activitiesData : []);
      setExceedances(exceedancesData);
      setValidation(validationData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!trendConfigId) return;

    setCalculating(true);
    try {
      await sectoralTrendService.calculateProjections(trendConfigId);
      await loadData();
      alert('Calcul des projections terminé avec succès');
    } catch (error) {
      console.error('Erreur lors du calcul:', error);
      alert('Erreur lors du calcul des projections');
    } finally {
      setCalculating(false);
    }
  };

  const handleIntegratePIEPIP = async () => {
    if (!trendConfigId || !trendConfig) return;

    setIntegrating(true);
    try {
      const result: IntegratePIEPIPResult = await sectoralTrendService.integratePIEPIPProjects(
        trendConfigId,
        trendConfig.baselineEndYear
      );
      await loadData();
      alert(`Intégration terminée: ${result.pieIntegrated} PIE + ${result.pipIntegrated} PIP = ${result.integrated} projets intégrés`);
    } catch (error) {
      console.error('Erreur lors de l\'intégration:', error);
      alert('Erreur lors de l\'intégration des projets PIE/PIP');
    } finally {
      setIntegrating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DJF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const actionColumns: Column<ActionSummary>[] = [
    {
      key: 'actionCode',
      header: 'Code Action',
      width: '12%',
    },
    {
      key: 'actionName',
      header: 'Nom Action',
      width: '23%',
    },
    {
      key: 'ministryName',
      header: 'Ministère',
      width: '20%',
    },
    {
      key: 'adjustedBaseline',
      header: 'Baseline Ajusté',
      width: '15%',
      render: (item) => formatCurrency(item.adjustedBaseline),
    },
    {
      key: 'projectedY1',
      header: 'Projection N+1',
      width: '15%',
      render: (item) => formatCurrency(item.projectedY1),
    },
    {
      key: 'projectedY2',
      header: 'Projection N+2',
      width: '15%',
      render: (item) => formatCurrency(item.projectedY2),
    },
  ];

  const activityColumns: Column<ActivitySummary>[] = [
    {
      key: 'activityCode',
      header: 'Code Activité',
      width: '10%',
    },
    {
      key: 'activityName',
      header: 'Nom Activité',
      width: '20%',
    },
    {
      key: 'actionName',
      header: 'Action',
      width: '18%',
    },
    {
      key: 'ministryName',
      header: 'Ministère',
      width: '17%',
    },
    {
      key: 'adjustedBaseline',
      header: 'Baseline',
      width: '12%',
      render: (item) => formatCurrency(item.adjustedBaseline),
    },
    {
      key: 'projectedY1',
      header: 'N+1',
      width: '11%',
      render: (item) => formatCurrency(item.projectedY1),
    },
    {
      key: 'projectedY2',
      header: 'N+2',
      width: '12%',
      render: (item) => formatCurrency(item.projectedY2),
    },
  ];

  return (
    <div className="sectoral-trend-view">
      <PageHeader
        title={`Tendances Sectorielles: ${trendConfig?.name || ''}`}
        subtitle={`Année de base: ${trendConfig?.baselineEndYear || ''}`}
        action={
          <div className="header-actions">
            <Button onClick={handleCalculate} variant="primary" disabled={calculating}>
              {calculating ? 'Calcul en cours...' : 'Calculer Projections'}
            </Button>
            <Button onClick={handleIntegratePIEPIP} variant="secondary" disabled={integrating}>
              {integrating ? 'Intégration...' : 'Intégrer PIE/PIP'}
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      {validation && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-label">Total Baseline</div>
            <div className="card-value">{formatCurrency(validation.summary.totalBaseline)}</div>
          </div>
          <div className="summary-card">
            <div className="card-label">Projection N+1</div>
            <div className="card-value">{formatCurrency(validation.summary.totalProjectedY1)}</div>
          </div>
          <div className="summary-card">
            <div className="card-label">Projection N+2</div>
            <div className="card-value">{formatCurrency(validation.summary.totalProjectedY2)}</div>
          </div>
          <div className="summary-card">
            <div className="card-label">Projection N+3</div>
            <div className="card-value">{formatCurrency(validation.summary.totalProjectedY3)}</div>
          </div>
        </div>
      )}

      {/* Validation Status */}
      {validation && (
        <div className={`validation-status ${validation.isCoherent ? 'coherent' : 'incoherent'}`}>
          <div className="status-icon">{validation.isCoherent ? '✓' : '⚠'}</div>
          <div className="status-text">
            {validation.isCoherent ? 'Cohérence validée' : 'Problèmes de cohérence détectés'}
          </div>
          <div className="status-details">
            {validation.passedValidations}/{validation.totalValidations} vérifications réussies
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          Résumé par Action ({actionSummaries.length})
        </button>
        <button
          className={`tab ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          Résumé par Activité ({activitySummaries.length})
        </button>
        <button
          className={`tab ${activeTab === 'exceedances' ? 'active' : ''}`}
          onClick={() => setActiveTab('exceedances')}
        >
          Dépassements de Plafond
          {exceedances && exceedances.hasExceedances && (
            <span className="badge-alert">{exceedances.totalExceedances}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'validation' ? 'active' : ''}`}
          onClick={() => setActiveTab('validation')}
        >
          Validation
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'actions' && (
          <DataTable
            columns={actionColumns}
            data={actionSummaries.map(item => ({ ...item, id: item.actionId }))}
            loading={loading}
          />
        )}

        {activeTab === 'activities' && (
          <DataTable
            columns={activityColumns}
            data={activitySummaries.map(item => ({ ...item, id: item.activityId }))}
            loading={loading}
          />
        )}

        {activeTab === 'exceedances' && exceedances && (
          <div className="exceedances-content">
            {!exceedances.hasExceedances ? (
              <div className="no-exceedances">
                <div className="success-icon">✓</div>
                <div className="success-message">Aucun dépassement de plafond détecté</div>
              </div>
            ) : (
              <div className="exceedances-list">
                <h3>Dépassements Détectés ({exceedances.totalExceedances})</h3>
                {exceedances.exceedances.map((exc, index) => (
                  <div key={index} className={`exceedance-item ${exc.severity.toLowerCase()}`}>
                    <div className="exceedance-header">
                      <span className="ministry-name">{exc.ministryName}</span>
                      <span className="year">Année N+{exc.year - (trendConfig?.baselineEndYear || 0)}</span>
                      <span className={`severity ${exc.severity.toLowerCase()}`}>{exc.severity}</span>
                    </div>
                    <div className="exceedance-details">
                      <div className="detail-item">
                        <span className="label">Projection:</span>
                        <span className="value">{formatCurrency(exc.projectedAmount)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Plafond:</span>
                        <span className="value">{formatCurrency(exc.ceiling)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Dépassement:</span>
                        <span className="value alert">{formatCurrency(exc.exceedance)} ({exc.exceedancePercentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'validation' && validation && (
          <div className="validation-content">
            <div className="validation-summary">
              <h3>Résumé de Validation</h3>
              <div className="validation-stats">
                <div className="stat">
                  <span className="stat-label">Total Projections:</span>
                  <span className="stat-value">{validation.summary.totalProjections}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Baseline Total:</span>
                  <span className="stat-value">{formatCurrency(validation.summary.totalBaseline)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Écart N+1:</span>
                  <span className="stat-value">{formatCurrency(validation.summary.gapY1)}</span>
                </div>
              </div>
            </div>

            <div className="validation-checks">
              <h3>Vérifications</h3>
              {validation.checks.map((check, index) => (
                <div key={index} className={`check-item ${check.passed ? 'passed' : 'failed'}`}>
                  <div className="check-icon">{check.passed ? '✓' : '✗'}</div>
                  <div className="check-content">
                    <div className="check-message">{check.message}</div>
                    {check.details && <div className="check-details">{check.details}</div>}
                  </div>
                  <div className={`check-severity ${check.severity.toLowerCase()}`}>{check.severity}</div>
                </div>
              ))}
            </div>

            {validation.warnings.length > 0 && (
              <div className="validation-warnings">
                <h3>Avertissements</h3>
                {validation.warnings.map((warning, index) => (
                  <div key={index} className="warning-item">⚠ {warning}</div>
                ))}
              </div>
            )}

            {validation.errors.length > 0 && (
              <div className="validation-errors">
                <h3>Erreurs</h3>
                {validation.errors.map((error, index) => (
                  <div key={index} className="error-item">✗ {error}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SectoralTrendView;
