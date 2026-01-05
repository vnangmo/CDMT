import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Button from '../components/common/Button';
import trendBudgetService from '../services/trendBudget.service';
import { TrendBudgetConfig } from '../types/trendBudget.types';
import './TrendBudgetList.css';

const TrendBudgetList: React.FC = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<TrendBudgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    configCode: '',
    name: '',
    description: '',
    fiscalYear: new Date().getFullYear(),
    baselineStartYear: new Date().getFullYear() - 3,
    baselineEndYear: new Date().getFullYear() - 1,
    globalGrowthRate: 3.0,
    projectionYears: 3,
    excludeTemporary: true,
  });

  useEffect(() => {
    loadConfigs();
  }, [fiscalYearFilter, statusFilter, currentPage]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (fiscalYearFilter) params.fiscalYear = parseInt(fiscalYearFilter);
      if (statusFilter) params.status = statusFilter;

      const result = await trendBudgetService.getTrendBudgetConfigs(params);
      setConfigs(result.data);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Error loading trend budget configs:', error);
      alert(error.response?.data?.message || 'Erreur lors du chargement des configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.configCode.trim() || !formData.name.trim()) {
      alert('Veuillez remplir le code et le nom');
      return;
    }

    if (formData.baselineStartYear > formData.baselineEndYear) {
      alert("L'année de début doit être antérieure ou égale à l'année de fin");
      return;
    }

    if (formData.fiscalYear < formData.baselineEndYear) {
      alert("L'année fiscale doit être postérieure à la période de référence");
      return;
    }

    try {
      setSubmitting(true);
      const newConfig = await trendBudgetService.createTrendBudgetConfig(formData);
      setIsCreateModalOpen(false);
      setFormData({
        configCode: '',
        name: '',
        description: '',
        fiscalYear: new Date().getFullYear(),
        baselineStartYear: new Date().getFullYear() - 3,
        baselineEndYear: new Date().getFullYear() - 1,
        globalGrowthRate: 3.0,
        projectionYears: 3,
        excludeTemporary: true,
      });
      alert('Configuration créée avec succès');
      await loadConfigs();
      navigate(`/trend-budgets/${newConfig.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette configuration ?')) return;

    try {
      await trendBudgetService.deleteTrendBudgetConfig(id);
      alert('Configuration supprimée avec succès');
      await loadConfigs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const columns: Column<TrendBudgetConfig>[] = [
    {
      key: 'configCode',
      header: 'Code',
      render: (config: TrendBudgetConfig) => config.configCode,
    },
    {
      key: 'name',
      header: 'Nom',
      render: (config: TrendBudgetConfig) => config.name,
    },
    {
      key: 'fiscalYear',
      header: 'Année fiscale',
      render: (config: TrendBudgetConfig) => config.fiscalYear,
    },
    {
      key: 'baselinePeriod',
      header: 'Période de référence',
      render: (config: TrendBudgetConfig) =>
        `${config.baselineStartYear} - ${config.baselineEndYear}`,
    },
    {
      key: 'globalGrowthRate',
      header: 'Taux croissance',
      render: (config: TrendBudgetConfig) => `${config.globalGrowthRate}%`,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (config: TrendBudgetConfig) => (
        <span className={`status-badge status-${config.status.toLowerCase()}`}>
          {config.status}
        </span>
      ),
    },
    {
      key: 'counts',
      header: 'Données',
      render: (config: TrendBudgetConfig) => (
        <span style={{ fontSize: '0.9em' }}>
          {config._count?.historicalBudgets || 0} hist. / {config._count?.trendProjections || 0} proj.
        </span>
      ),
    },
  ];

  return (
    <div className="trend-budget-list-page">
      <PageHeader
        title="Budgets Tendanciels"
        subtitle="Projections basées sur les données historiques"
        action={
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            + Nouvelle Configuration
          </Button>
        }
      />

      <div className="filters-section">
        <div className="filters">
          <div className="filter-group">
            <label>Année fiscale</label>
            <input
              type="number"
              value={fiscalYearFilter}
              onChange={(e) => setFiscalYearFilter(e.target.value)}
              placeholder="Toutes"
            />
          </div>
          <div className="filter-group">
            <label>Statut</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Tous</option>
              <option value="DRAFT">Brouillon</option>
              <option value="VALIDATED">Validé</option>
              <option value="APPROVED">Approuvé</option>
            </select>
          </div>
          {(fiscalYearFilter || statusFilter) && (
            <button
              className="btn-clear-filters"
              onClick={() => {
                setFiscalYearFilter('');
                setStatusFilter('');
              }}
            >
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={configs}
        loading={loading}
        emptyMessage="Aucune configuration trouvée"
        customActions={(config: TrendBudgetConfig) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-view" onClick={() => navigate(`/trend-budgets/${config.id}`)}>
              Voir
            </button>
            {config.status === 'DRAFT' && (
              <button className="btn-delete" onClick={() => handleDelete(config.id)}>
                Supprimer
              </button>
            )}
          </div>
        )}
      />

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
            Précédent
          </button>
          <span>
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouvelle Configuration</h2>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Code *</label>
                <input
                  type="text"
                  value={formData.configCode}
                  onChange={(e) => setFormData({ ...formData, configCode: e.target.value })}
                  placeholder="TREND-2024"
                />
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Budget Tendanciel 2024"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description optionnelle"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Année fiscale *</label>
                  <input
                    type="number"
                    value={formData.fiscalYear}
                    onChange={(e) =>
                      setFormData({ ...formData, fiscalYear: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Taux de croissance global (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.globalGrowthRate}
                    onChange={(e) =>
                      setFormData({ ...formData, globalGrowthRate: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Période de référence - Début *</label>
                  <input
                    type="number"
                    value={formData.baselineStartYear}
                    onChange={(e) =>
                      setFormData({ ...formData, baselineStartYear: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Période de référence - Fin *</label>
                  <input
                    type="number"
                    value={formData.baselineEndYear}
                    onChange={(e) =>
                      setFormData({ ...formData, baselineEndYear: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.excludeTemporary}
                    onChange={(e) =>
                      setFormData({ ...formData, excludeTemporary: e.target.checked })
                    }
                  />
                  Exclure les dépenses temporaires du calcul
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendBudgetList;
