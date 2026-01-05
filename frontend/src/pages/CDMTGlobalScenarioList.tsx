import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Button from '../components/common/Button';
import CDMTGlobalService from '../services/cdmtGlobal.service';
import { CDMTGlobalScenario } from '../types/cdmtGlobal.types';
import './CDMTGlobalScenarioList.css';

const CDMTGlobalScenarioList: React.FC = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<CDMTGlobalScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selection for comparison
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);

  // MacroFrameworks and TrendConfigs for dropdown
  const [macroFrameworks, setMacroFrameworks] = useState<any[]>([]);
  const [trendConfigs, setTrendConfigs] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    scenarioCode: '',
    name: '',
    description: '',
    fiscalYear: new Date().getFullYear(),
    macroFrameworkId: '',
    trendConfigId: '',
  });

  useEffect(() => {
    loadScenarios();
  }, [fiscalYearFilter, statusFilter, currentPage]);

  useEffect(() => {
    loadReferentialData();
  }, []);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const filters: any = {
        page: currentPage,
        limit: 20,
      };

      if (fiscalYearFilter) filters.fiscalYear = parseInt(fiscalYearFilter);
      if (statusFilter) filters.status = statusFilter as 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

      const result = await CDMTGlobalService.getScenarios(filters);
      setScenarios(result.scenarios);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Error loading CDMT Global scenarios:', error);
      alert(error.response?.data?.message || 'Erreur lors du chargement des scénarios');
    } finally {
      setLoading(false);
    }
  };

  const loadReferentialData = async () => {
    try {
      // Load macro frameworks - assuming there's a service for this
      // const macros = await macroFrameworkService.getMacroFrameworks();
      // setMacroFrameworks(macros);

      // Load trend configs - assuming there's a service for this
      // const trends = await trendBudgetService.getTrendBudgetConfigs();
      // setTrendConfigs(trends);

      // Temporary mock data - replace with actual API calls
      setMacroFrameworks([
        { id: '1', name: 'Cadre Macro 2024', fiscalYear: 2024 },
        { id: '2', name: 'Cadre Macro 2025', fiscalYear: 2025 },
      ]);
      setTrendConfigs([
        { id: '1', name: 'Budget Tendanciel 2024', fiscalYear: 2024 },
        { id: '2', name: 'Budget Tendanciel 2025', fiscalYear: 2025 },
      ]);
    } catch (error: any) {
      console.error('Error loading referential data:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.scenarioCode.trim() || !formData.name.trim()) {
      alert('Veuillez remplir le code et le nom');
      return;
    }

    if (!formData.macroFrameworkId) {
      alert('Veuillez sélectionner un cadre macroéconomique');
      return;
    }

    try {
      setSubmitting(true);
      const newScenario = await CDMTGlobalService.createScenario({
        scenarioCode: formData.scenarioCode,
        name: formData.name,
        description: formData.description,
        fiscalYear: formData.fiscalYear,
        macroFrameworkId: formData.macroFrameworkId,
        trendConfigId: formData.trendConfigId || undefined,
      });
      setIsCreateModalOpen(false);
      setFormData({
        scenarioCode: '',
        name: '',
        description: '',
        fiscalYear: new Date().getFullYear(),
        macroFrameworkId: '',
        trendConfigId: '',
      });
      alert('Scénario créé avec succès');
      await loadScenarios();
      navigate(`/cdmt-global/${newScenario.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicate = async (scenario: CDMTGlobalScenario) => {
    const newName = prompt(`Nom du nouveau scénario (copie de "${scenario.name}"):`, `${scenario.name} - Copie`);
    if (!newName) return;

    const newCode = prompt('Code du nouveau scénario:', `${scenario.scenarioCode}-COPY`);
    if (!newCode) return;

    try {
      const duplicated = await CDMTGlobalService.duplicateScenario(scenario.id, newName, newCode);
      alert('Scénario dupliqué avec succès');
      await loadScenarios();
      navigate(`/cdmt-global/${duplicated.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la duplication');
    }
  };

  const handleActivate = async (id: string) => {
    if (!window.confirm('Voulez-vous activer ce scénario ? Le scénario actif actuel sera désactivé.')) return;

    try {
      await CDMTGlobalService.activateScenario(id);
      alert('Scénario activé avec succès');
      await loadScenarios();
    } catch (error: any) {
      alert(error.response?.data?.message || "Erreur lors de l'activation");
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Voulez-vous désactiver ce scénario ?')) return;

    try {
      await CDMTGlobalService.deactivateScenario(id);
      alert('Scénario désactivé avec succès');
      await loadScenarios();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la désactivation');
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Voulez-vous archiver ce scénario ?')) return;

    try {
      await CDMTGlobalService.archiveScenario(id);
      alert('Scénario archivé avec succès');
      await loadScenarios();
    } catch (error: any) {
      alert(error.response?.data?.message || "Erreur lors de l'archivage");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce scénario ? Cette action est irréversible.')) return;

    try {
      await CDMTGlobalService.deleteScenario(id);
      alert('Scénario supprimé avec succès');
      await loadScenarios();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleCompareScenarios = () => {
    if (selectedScenarios.length < 2) {
      alert('Veuillez sélectionner au moins 2 scénarios à comparer');
      return;
    }
    if (selectedScenarios.length > 4) {
      alert('Vous pouvez comparer au maximum 4 scénarios');
      return;
    }
    navigate(`/cdmt-global/compare?scenarios=${selectedScenarios.join(',')}`);
  };

  const toggleScenarioSelection = (scenarioId: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId) ? prev.filter((id) => id !== scenarioId) : [...prev, scenarioId]
    );
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns: Column<CDMTGlobalScenario>[] = [
    {
      key: 'select',
      header: '',
      render: (scenario: CDMTGlobalScenario) => (
        <input
          type="checkbox"
          checked={selectedScenarios.includes(scenario.id)}
          onChange={() => toggleScenarioSelection(scenario.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'scenarioCode',
      header: 'Code',
      render: (scenario: CDMTGlobalScenario) => scenario.scenarioCode,
    },
    {
      key: 'name',
      header: 'Nom',
      render: (scenario: CDMTGlobalScenario) => (
        <div>
          <div style={{ fontWeight: 500 }}>{scenario.name}</div>
          {scenario.isActive && (
            <span className="status-badge status-active" style={{ fontSize: '11px', marginTop: '4px' }}>
              ACTIF
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'fiscalYear',
      header: 'Année fiscale',
      render: (scenario: CDMTGlobalScenario) => scenario.fiscalYear,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (scenario: CDMTGlobalScenario) => (
        <span className={`status-badge status-${scenario.status.toLowerCase()}`}>
          {scenario.status}
        </span>
      ),
    },
    {
      key: 'margins',
      header: 'Marge fiscale (Y1/Y2/Y3)',
      render: (scenario: CDMTGlobalScenario) => (
        <div style={{ fontSize: '0.9em', whiteSpace: 'nowrap' }}>
          {formatAmount(Number(scenario.fiscalMarginY1))} / {formatAmount(Number(scenario.fiscalMarginY2))} /{' '}
          {formatAmount(Number(scenario.fiscalMarginY3))}
        </div>
      ),
    },
    {
      key: 'ceilings',
      header: 'Plafonds totaux (Y1/Y2/Y3)',
      render: (scenario: CDMTGlobalScenario) => (
        <div style={{ fontSize: '0.9em', fontWeight: 500, whiteSpace: 'nowrap' }}>
          {formatAmount(Number(scenario.totalCeilingY1))} / {formatAmount(Number(scenario.totalCeilingY2))} /{' '}
          {formatAmount(Number(scenario.totalCeilingY3))}
        </div>
      ),
    },
  ];

  return (
    <div className="cdmt-global-scenario-list-page">
      <PageHeader
        title="CDMT Global - Plafonds Ministériels"
        subtitle="Gestion des scénarios de répartition budgétaire"
        action={
          <div style={{ display: 'flex', gap: '12px' }}>
            {selectedScenarios.length >= 2 && (
              <Button variant="secondary" onClick={handleCompareScenarios}>
                Comparer ({selectedScenarios.length})
              </Button>
            )}
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              + Nouveau Scénario
            </Button>
          </div>
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
              <option value="ACTIVE">Actif</option>
              <option value="ARCHIVED">Archivé</option>
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
        data={scenarios}
        loading={loading}
        emptyMessage="Aucun scénario trouvé"
        customActions={(scenario: CDMTGlobalScenario) => (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn-view" onClick={() => navigate(`/cdmt-global/${scenario.id}`)}>
              Voir
            </button>
            <button className="btn-duplicate" onClick={() => handleDuplicate(scenario)}>
              Dupliquer
            </button>
            {scenario.status === 'DRAFT' && !scenario.isActive && (
              <button className="btn-activate" onClick={() => handleActivate(scenario.id)}>
                Activer
              </button>
            )}
            {scenario.isActive && (
              <button className="btn-deactivate" onClick={() => handleDeactivate(scenario.id)}>
                Désactiver
              </button>
            )}
            {scenario.status !== 'ARCHIVED' && (
              <button className="btn-archive" onClick={() => handleArchive(scenario.id)}>
                Archiver
              </button>
            )}
            {scenario.status === 'DRAFT' && (
              <button className="btn-delete" onClick={() => handleDelete(scenario.id)}>
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
              <h2>Nouveau Scénario CDMT Global</h2>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Code du scénario *</label>
                <input
                  type="text"
                  value={formData.scenarioCode}
                  onChange={(e) => setFormData({ ...formData, scenarioCode: e.target.value })}
                  placeholder="CDMT-GLOBAL-2024"
                />
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Scénario A - Baseline"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du scénario"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Année fiscale *</label>
                <input
                  type="number"
                  value={formData.fiscalYear}
                  onChange={(e) => setFormData({ ...formData, fiscalYear: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>Cadre macroéconomique *</label>
                <select
                  value={formData.macroFrameworkId}
                  onChange={(e) => setFormData({ ...formData, macroFrameworkId: e.target.value })}
                >
                  <option value="">Sélectionner un cadre macro</option>
                  {macroFrameworks.map((macro) => (
                    <option key={macro.id} value={macro.id}>
                      {macro.name} ({macro.fiscalYear})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  La marge fiscale sera calculée depuis ce cadre macroéconomique
                </small>
              </div>
              <div className="form-group">
                <label>Configuration Budget Tendanciel (optionnel)</label>
                <select
                  value={formData.trendConfigId}
                  onChange={(e) => setFormData({ ...formData, trendConfigId: e.target.value })}
                >
                  <option value="">Aucune (créer manuellement les baselines)</option>
                  {trendConfigs.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.name} ({config.fiscalYear})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Les baselines ministériels seront calculés depuis cette configuration
                </small>
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

export default CDMTGlobalScenarioList;
