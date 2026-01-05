import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import DataTable, { Column } from '../components/common/DataTable';
import trendBudgetService from '../services/trendBudget.service';
import {
  TrendBudgetConfig,
  HistoricalBudget,
  TrendProjection,
  TrendSummaryByMinistry,
  TrendSummaryByPriority,
} from '../types/trendBudget.types';
import './TrendBudgetDetail.css';

const TrendBudgetDetail: React.FC = () => {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();

  const [config, setConfig] = useState<TrendBudgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('configuration');

  // Historical budgets
  const [historicals, setHistoricals] = useState<HistoricalBudget[]>([]);
  const [historicalsLoading, setHistoricalsLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Projections
  const [projections, setProjections] = useState<TrendProjection[]>([]);
  const [projectionsLoading, setProjectionsLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Summaries
  const [summaryMinistry, setSummaryMinistry] = useState<TrendSummaryByMinistry[]>([]);
  const [summaryPriority, setSummaryPriority] = useState<TrendSummaryByPriority[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(false);

  useEffect(() => {
    if (configId) {
      loadConfig();
    }
  }, [configId]);

  useEffect(() => {
    if (configId && config) {
      if (activeTab === 'historicals') {
        loadHistoricals();
      } else if (activeTab === 'projections') {
        loadProjections();
      } else if (activeTab === 'summaries') {
        loadSummaries();
      }
    }
  }, [activeTab, configId, config]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await trendBudgetService.getTrendBudgetConfig(configId!);
      setConfig(data);
    } catch (error: any) {
      console.error('Error loading config:', error);
      alert(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/trend-budgets');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricals = async () => {
    try {
      setHistoricalsLoading(true);
      const result = await trendBudgetService.getHistoricalBudgets(configId!, { limit: 100 });
      setHistoricals(result.data);
    } catch (error: any) {
      console.error('Error loading historicals:', error);
    } finally {
      setHistoricalsLoading(false);
    }
  };

  const loadProjections = async () => {
    try {
      setProjectionsLoading(true);
      const result = await trendBudgetService.getTrendProjections(configId!, { limit: 100 });
      setProjections(result.data);
    } catch (error: any) {
      console.error('Error loading projections:', error);
    } finally {
      setProjectionsLoading(false);
    }
  };

  const loadSummaries = async () => {
    try {
      setSummariesLoading(true);
      const [ministry, priority] = await Promise.all([
        trendBudgetService.getSummaryByMinistry(configId!),
        trendBudgetService.getSummaryByPriority(configId!),
      ]);
      setSummaryMinistry(ministry);
      setSummaryPriority(priority);
    } catch (error: any) {
      console.error('Error loading summaries:', error);
    } finally {
      setSummariesLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!window.confirm('Valider cette configuration ?')) return;
    try {
      await trendBudgetService.validateTrendBudgetConfig(configId!);
      alert('Configuration validée avec succès');
      await loadConfig();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Approuver cette configuration ?')) return;
    try {
      await trendBudgetService.approveTrendBudgetConfig(configId!);
      alert('Configuration approuvée avec succès');
      await loadConfig();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'approbation');
    }
  };

  const handleFileUpload = async (fileType: 'excel' | 'csv') => {
    if (!uploadFile) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);
      const result =
        fileType === 'excel'
          ? await trendBudgetService.importExcel(configId!, uploadFile)
          : await trendBudgetService.importCSV(configId!, uploadFile);

      alert(`Import réussi: ${result.imported} ligne(s) importée(s)`);
      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors);
        alert(`${result.errors.length} erreur(s) lors de l'import (voir console)`);
      }
      setUploadFile(null);
      await loadHistoricals();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'import');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await trendBudgetService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template_budgets_historiques.xlsx';
      link.click();
    } catch (error: any) {
      alert('Erreur lors du téléchargement du template');
    }
  };

  const handleCalculateProjections = async () => {
    if (!window.confirm('Calculer toutes les projections ? Cela peut prendre du temps.')) return;
    try {
      setCalculating(true);
      const result = await trendBudgetService.calculateProjections(configId!);
      alert(`${result.calculated} projection(s) calculée(s)`);
      if (result.errors.length > 0) {
        console.error('Calculation errors:', result.errors);
        alert(`${result.errors.length} erreur(s) (voir console)`);
      }
      await loadProjections();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors du calcul');
    } finally {
      setCalculating(false);
    }
  };

  const handleToggleTemporary = async (id: string) => {
    try {
      await trendBudgetService.toggleTemporary(id);
      await loadHistoricals();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors du basculement');
    }
  };

  const handleExport = async (type: 'excel' | 'csv' | 'pdf') => {
    try {
      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'excel':
          blob = await trendBudgetService.exportExcel(configId!);
          filename = `trend_budget_${configId}.xlsx`;
          break;
        case 'csv':
          blob = await trendBudgetService.exportCSV(configId!);
          filename = `trend_budget_${configId}.csv`;
          break;
        case 'pdf':
          blob = await trendBudgetService.exportPDF(configId!);
          filename = `trend_budget_summary_${configId}.pdf`;
          break;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    } catch (error: any) {
      alert('Erreur lors de l\'export');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!config) {
    return <div className="error">Configuration non trouvée</div>;
  }

  // Columns for historical budgets
  const historicalColumns: Column<HistoricalBudget>[] = [
    {
      key: 'ministry',
      header: 'Ministère',
      render: (h) => h.ministry?.name || '-',
    },
    {
      key: 'program',
      header: 'Programme',
      render: (h) => h.program?.name || '-',
    },
    {
      key: 'fiscalYear',
      header: 'Année',
      render: (h) => h.fiscalYear,
    },
    {
      key: 'budgetAmount',
      header: 'Montant budgété',
      render: (h) => h.budgetAmount.toLocaleString(),
    },
    {
      key: 'isTemporary',
      header: 'Temporaire',
      render: (h) => (
        <span className={`badge ${h.isTemporary ? 'badge-warning' : 'badge-success'}`}>
          {h.isTemporary ? 'Oui' : 'Non'}
        </span>
      ),
    },
  ];

  // Columns for projections
  const projectionColumns: Column<TrendProjection>[] = [
    {
      key: 'ministry',
      header: 'Ministère',
      render: (p) => (
        <div>
          {p.ministry?.name || '-'}
          {p.isPriorityMinistry && <span className="priority-badge">Prioritaire</span>}
        </div>
      ),
    },
    {
      key: 'program',
      header: 'Programme',
      render: (p) => p.program?.name || '-',
    },
    {
      key: 'baseAmount',
      header: 'Base',
      render: (p) => p.baseAmount.toLocaleString(),
    },
    {
      key: 'n1',
      header: `N+1 (${config.fiscalYear + 1})`,
      render: (p) => p.projectedAmount1.toLocaleString(),
    },
    {
      key: 'n2',
      header: `N+2 (${config.fiscalYear + 2})`,
      render: (p) => p.projectedAmount2.toLocaleString(),
    },
    {
      key: 'n3',
      header: `N+3 (${config.fiscalYear + 3})`,
      render: (p) => p.projectedAmount3.toLocaleString(),
    },
    {
      key: 'method',
      header: 'Méthode',
      render: (p) => <span className="method-badge">{p.calculationMethod}</span>,
    },
  ];

  return (
    <div className="trend-budget-detail-page">
      <PageHeader
        title={config.name}
        subtitle={`${config.configCode} - ${config.status}`}
        action={
          <div style={{ display: 'flex', gap: '12px' }}>
            {config.status === 'DRAFT' && (
              <Button variant="primary" onClick={handleValidate}>
                Valider
              </Button>
            )}
            {config.status === 'VALIDATED' && (
              <Button variant="primary" onClick={handleApprove}>
                Approuver
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/trend-budgets')}>
              Retour
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'configuration' ? 'active' : ''}`}
          onClick={() => setActiveTab('configuration')}
        >
          Configuration
        </button>
        <button
          className={`tab ${activeTab === 'historicals' ? 'active' : ''}`}
          onClick={() => setActiveTab('historicals')}
        >
          Données Historiques ({config._count?.historicalBudgets || 0})
        </button>
        <button
          className={`tab ${activeTab === 'projections' ? 'active' : ''}`}
          onClick={() => setActiveTab('projections')}
        >
          Projections ({config._count?.trendProjections || 0})
        </button>
        <button
          className={`tab ${activeTab === 'summaries' ? 'active' : ''}`}
          onClick={() => setActiveTab('summaries')}
        >
          Résumés
        </button>
        <button
          className={`tab ${activeTab === 'exports' ? 'active' : ''}`}
          onClick={() => setActiveTab('exports')}
        >
          Exports
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Configuration Tab */}
        {activeTab === 'configuration' && (
          <div className="config-section">
            <div className="info-grid">
              <div className="info-item">
                <label>Code</label>
                <div>{config.configCode}</div>
              </div>
              <div className="info-item">
                <label>Nom</label>
                <div>{config.name}</div>
              </div>
              <div className="info-item">
                <label>Année fiscale</label>
                <div>{config.fiscalYear}</div>
              </div>
              <div className="info-item">
                <label>Période de référence</label>
                <div>
                  {config.baselineStartYear} - {config.baselineEndYear}
                </div>
              </div>
              <div className="info-item">
                <label>Taux de croissance global</label>
                <div>{config.globalGrowthRate}%</div>
              </div>
              <div className="info-item">
                <label>Années de projection</label>
                <div>{config.projectionYears}</div>
              </div>
              <div className="info-item">
                <label>Exclure temporaires</label>
                <div>{config.excludeTemporary ? 'Oui' : 'Non'}</div>
              </div>
              <div className="info-item">
                <label>Statut</label>
                <div>
                  <span className={`status-badge status-${config.status.toLowerCase()}`}>
                    {config.status}
                  </span>
                </div>
              </div>
            </div>
            {config.description && (
              <div className="info-item full-width">
                <label>Description</label>
                <div>{config.description}</div>
              </div>
            )}
          </div>
        )}

        {/* Historical Budgets Tab */}
        {activeTab === 'historicals' && (
          <div className="historicals-section">
            <div className="import-section">
              <h3>Import de données</h3>
              <div className="import-controls">
                <button className="btn-secondary" onClick={handleDownloadTemplate}>
                  Télécharger Template
                </button>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                <button
                  className="btn-primary"
                  onClick={() => handleFileUpload('excel')}
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? 'Import...' : 'Importer Excel'}
                </button>
                <button
                  className="btn-primary"
                  onClick={() => handleFileUpload('csv')}
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? 'Import...' : 'Importer CSV'}
                </button>
              </div>
            </div>

            <DataTable
              columns={historicalColumns}
              data={historicals}
              loading={historicalsLoading}
              emptyMessage="Aucune donnée historique"
              customActions={(h: HistoricalBudget) => (
                <button className="btn-toggle" onClick={() => handleToggleTemporary(h.id)}>
                  Toggle Temp.
                </button>
              )}
            />
          </div>
        )}

        {/* Projections Tab */}
        {activeTab === 'projections' && (
          <div className="projections-section">
            <div className="projections-header">
              <Button variant="primary" onClick={handleCalculateProjections} disabled={calculating}>
                {calculating ? 'Calcul en cours...' : 'Calculer toutes les projections'}
              </Button>
            </div>

            <DataTable
              columns={projectionColumns}
              data={projections}
              loading={projectionsLoading}
              emptyMessage="Aucune projection. Cliquez sur 'Calculer' pour générer les projections."
            />
          </div>
        )}

        {/* Summaries Tab */}
        {activeTab === 'summaries' && (
          <div className="summaries-section">
            {summariesLoading ? (
              <div className="loading">Chargement...</div>
            ) : (
              <>
                <div className="summary-cards">
                  {summaryPriority.map((s) => (
                    <div key={s.isPriority ? 'priority' : 'non-priority'} className="summary-card">
                      <h3>{s.isPriority ? 'Ministères Prioritaires' : 'Ministères Non-Prioritaires'}</h3>
                      <div className="summary-stats">
                        <div className="stat">
                          <label>Nombre de ministères</label>
                          <div>{s.ministryCount}</div>
                        </div>
                        <div className="stat">
                          <label>Base</label>
                          <div>{s.totalBase?.toLocaleString()}</div>
                        </div>
                        <div className="stat">
                          <label>N+1</label>
                          <div>{s.totalN1?.toLocaleString()}</div>
                        </div>
                        <div className="stat">
                          <label>N+2</label>
                          <div>{s.totalN2?.toLocaleString()}</div>
                        </div>
                        <div className="stat">
                          <label>N+3</label>
                          <div>{s.totalN3?.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <h3>Résumé par Ministère</h3>
                <div className="ministry-summary-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Ministère</th>
                        <th>Prioritaire</th>
                        <th>Base</th>
                        <th>N+1</th>
                        <th>N+2</th>
                        <th>N+3</th>
                        <th>Projections</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryMinistry.map((s) => (
                        <tr key={s.ministryId}>
                          <td>{s.ministryName}</td>
                          <td>
                            {s.isPriority && <span className="priority-badge">Oui</span>}
                          </td>
                          <td>{s.totalBase?.toLocaleString()}</td>
                          <td>{s.totalN1?.toLocaleString()}</td>
                          <td>{s.totalN2?.toLocaleString()}</td>
                          <td>{s.totalN3?.toLocaleString()}</td>
                          <td>{s.projectionCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Exports Tab */}
        {activeTab === 'exports' && (
          <div className="exports-section">
            <h3>Téléchargements</h3>
            <div className="export-buttons">
              <button className="export-btn" onClick={() => handleExport('excel')}>
                <span className="icon">📊</span>
                <div>
                  <h4>Export Excel</h4>
                  <p>Toutes les données (config, historiques, projections, résumés)</p>
                </div>
              </button>
              <button className="export-btn" onClick={() => handleExport('csv')}>
                <span className="icon">📄</span>
                <div>
                  <h4>Export CSV</h4>
                  <p>Projections au format CSV</p>
                </div>
              </button>
              <button className="export-btn" onClick={() => handleExport('pdf')}>
                <span className="icon">📑</span>
                <div>
                  <h4>Export PDF</h4>
                  <p>Rapport de résumé au format PDF</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendBudgetDetail;
