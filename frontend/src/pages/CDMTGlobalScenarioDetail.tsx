import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import DataTable, { Column } from '../components/common/DataTable';
import CDMTGlobalService from '../services/cdmtGlobal.service';
import {
  CDMTGlobalScenario,
  PolicyMeasure,
  MarginAllocation,
  MinisterialCeiling,
  CreatePolicyMeasureDto,
} from '../types/cdmtGlobal.types';
import './CDMTGlobalScenarioDetail.css';

const CDMTGlobalScenarioDetail: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();

  const [scenario, setScenario] = useState<CDMTGlobalScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Policy Measures
  const [measures, setMeasures] = useState<PolicyMeasure[]>([]);
  const [measuresLoading, setMeasuresLoading] = useState(false);
  const [isAddMeasureModalOpen, setIsAddMeasureModalOpen] = useState(false);
  const [measureFormData, setMeasureFormData] = useState<CreatePolicyMeasureDto>({
    ministryId: '',
    measureName: '',
    description: '',
    category: 'OTHER',
    amountY1: 0,
    amountY2: 0,
    amountY3: 0,
    justification: '',
    source: '',
  });

  // Margin Allocations
  const [allocations, setAllocations] = useState<MarginAllocation[]>([]);
  const [allocationsLoading, setAllocationsLoading] = useState(false);
  const [editedAllocations, setEditedAllocations] = useState<{ [key: string]: MarginAllocation }>({});

  // Ministerial Ceilings
  const [ceilings, setCeilings] = useState<MinisterialCeiling[]>([]);
  const [ceilingsLoading, setCeilingsLoading] = useState(false);

  // Ministries for dropdowns
  const [ministries, setMinistries] = useState<any[]>([]);

  // Remaining margin
  const [remainingMargin, setRemainingMargin] = useState<any>(null);

  useEffect(() => {
    if (scenarioId) {
      loadScenario();
      loadMinistries();
    }
  }, [scenarioId]);

  useEffect(() => {
    if (scenarioId && scenario) {
      if (activeTab === 'measures') {
        loadMeasures();
      } else if (activeTab === 'allocations') {
        loadAllocations();
        loadRemainingMargin();
      } else if (activeTab === 'ceilings') {
        loadCeilings();
      }
    }
  }, [activeTab, scenarioId, scenario]);

  const loadScenario = async () => {
    try {
      setLoading(true);
      const data = await CDMTGlobalService.getScenarioById(scenarioId!);
      setScenario(data);
    } catch (error: any) {
      console.error('Error loading scenario:', error);
      alert(error.response?.data?.message || 'Erreur lors du chargement');
      navigate('/cdmt-global');
    } finally {
      setLoading(false);
    }
  };

  const loadMinistries = async () => {
    try {
      // Mock data - replace with actual API call
      setMinistries([
        { id: '1', code: 'MEF', name: 'Ministère de l\'Économie et des Finances', isPriority: true },
        { id: '2', code: 'MEN', name: 'Ministère de l\'Éducation Nationale', isPriority: true },
        { id: '3', code: 'MS', name: 'Ministère de la Santé', isPriority: true },
        { id: '4', code: 'MI', name: 'Ministère de l\'Intérieur', isPriority: false },
      ]);
    } catch (error: any) {
      console.error('Error loading ministries:', error);
    }
  };

  const loadMeasures = async () => {
    try {
      setMeasuresLoading(true);
      const data = await CDMTGlobalService.getPolicyMeasures(scenarioId!);
      setMeasures(data);
    } catch (error: any) {
      console.error('Error loading measures:', error);
    } finally {
      setMeasuresLoading(false);
    }
  };

  const loadAllocations = async () => {
    try {
      setAllocationsLoading(true);
      const data = await CDMTGlobalService.getMarginAllocations(scenarioId!);
      setAllocations(data);
    } catch (error: any) {
      console.error('Error loading allocations:', error);
    } finally {
      setAllocationsLoading(false);
    }
  };

  const loadCeilings = async () => {
    try {
      setCeilingsLoading(true);
      const data = await CDMTGlobalService.getMinisterialCeilings(scenarioId!);
      setCeilings(data);
    } catch (error: any) {
      console.error('Error loading ceilings:', error);
    } finally {
      setCeilingsLoading(false);
    }
  };

  const loadRemainingMargin = async () => {
    try {
      const data = await CDMTGlobalService.getRemainingMargin(scenarioId!);
      setRemainingMargin(data);
    } catch (error: any) {
      console.error('Error loading remaining margin:', error);
    }
  };

  const handleActivate = async () => {
    if (!window.confirm('Voulez-vous activer ce scénario ?')) return;
    try {
      await CDMTGlobalService.activateScenario(scenarioId!);
      alert('Scénario activé avec succès');
      await loadScenario();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'activation');
    }
  };

  const handleDuplicate = async () => {
    const newName = prompt(`Nom du nouveau scénario (copie de "${scenario?.name}"):`, `${scenario?.name} - Copie`);
    if (!newName) return;
    const newCode = prompt('Code du nouveau scénario:', `${scenario?.scenarioCode}-COPY`);
    if (!newCode) return;

    try {
      const duplicated = await CDMTGlobalService.duplicateScenario(scenarioId!, newName, newCode);
      alert('Scénario dupliqué avec succès');
      navigate(`/cdmt-global/${duplicated.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la duplication');
    }
  };

  const handleSyncCBMT = async () => {
    if (!window.confirm('Synchroniser ce scénario vers CBMT ?')) return;
    try {
      const result = await CDMTGlobalService.syncCBMT(scenarioId!);
      alert(`Synchronisation réussie: ${result.synced} enregistrement(s) synchronisé(s)`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la synchronisation');
    }
  };

  // Policy Measures handlers
  const handleAddMeasure = async () => {
    if (!measureFormData.ministryId || !measureFormData.measureName) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      await CDMTGlobalService.createPolicyMeasure(scenarioId!, measureFormData);
      setIsAddMeasureModalOpen(false);
      setMeasureFormData({
        ministryId: '',
        measureName: '',
        description: '',
        category: 'OTHER',
        amountY1: 0,
        amountY2: 0,
        amountY3: 0,
        justification: '',
        source: '',
      });
      alert('Mesure ajoutée avec succès');
      await loadMeasures();
      await loadScenario(); // Refresh totals
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'ajout');
    }
  };

  const handleDeleteMeasure = async (measureId: string) => {
    if (!window.confirm('Supprimer cette mesure ?')) return;
    try {
      await CDMTGlobalService.deletePolicyMeasure(measureId);
      alert('Mesure supprimée avec succès');
      await loadMeasures();
      await loadScenario();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Margin Allocation handlers
  const handleAllocationChange = (ministryId: string, year: 'Y1' | 'Y2' | 'Y3', value: number) => {
    const allocation = allocations.find((a) => a.ministryId === ministryId);
    if (!allocation) return;

    const updated = { ...allocation };
    if (year === 'Y1') updated.allocatedY1 = value;
    if (year === 'Y2') updated.allocatedY2 = value;
    if (year === 'Y3') updated.allocatedY3 = value;

    setEditedAllocations((prev) => ({ ...prev, [ministryId]: updated }));
  };

  const handleSaveAllocations = async () => {
    try {
      const updates = Object.values(editedAllocations).map((alloc) => ({
        ministryId: alloc.ministryId,
        allocatedY1: alloc.allocatedY1,
        allocatedY2: alloc.allocatedY2,
        allocatedY3: alloc.allocatedY3,
      }));

      await CDMTGlobalService.bulkUpdateMarginAllocations(scenarioId!, updates);
      alert('Allocations enregistrées avec succès');
      setEditedAllocations({});
      await loadAllocations();
      await loadRemainingMargin();
      await loadScenario();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleResetAllocations = async () => {
    if (!window.confirm('Réinitialiser toutes les allocations à 0 ?')) return;
    try {
      await CDMTGlobalService.resetMarginAllocations(scenarioId!);
      alert('Allocations réinitialisées avec succès');
      await loadAllocations();
      await loadRemainingMargin();
      await loadScenario();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la réinitialisation');
    }
  };

  const handleRecalculateCeilings = async () => {
    if (!window.confirm('Recalculer tous les plafonds ?')) return;
    try {
      const result = await CDMTGlobalService.recalculateCeilings(scenarioId!);
      alert(`${result.calculated} plafond(s) recalculé(s)`);
      await loadCeilings();
      await loadScenario();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors du recalcul');
    }
  };

  // Export handlers
  const handleExport = async (type: 'excel' | 'csv' | 'pdf') => {
    try {
      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'excel':
          blob = await CDMTGlobalService.exportExcel(scenarioId!);
          filename = `cdmt_global_${scenario?.scenarioCode}.xlsx`;
          break;
        case 'csv':
          blob = await CDMTGlobalService.exportCSV(scenarioId!);
          filename = `cdmt_global_${scenario?.scenarioCode}.csv`;
          break;
        case 'pdf':
          blob = await CDMTGlobalService.exportPDF(scenarioId!);
          filename = `cdmt_global_${scenario?.scenarioCode}.pdf`;
          break;
      }

      CDMTGlobalService.downloadFile(blob, filename);
      alert('Export réussi');
    } catch (error: any) {
      alert('Erreur lors de l\'export');
    }
  };

  const formatAmount = (amount: number | string): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!scenario) {
    return <div className="error">Scénario non trouvé</div>;
  }

  // Columns for measures
  const measuresColumns: Column<PolicyMeasure>[] = [
    {
      key: 'ministry',
      header: 'Ministère',
      render: (m) => m.ministry?.name || '-',
    },
    {
      key: 'measureName',
      header: 'Mesure',
      render: (m) => m.measureName,
    },
    {
      key: 'category',
      header: 'Catégorie',
      render: (m) => <span className="category-badge">{m.category}</span>,
    },
    {
      key: 'amountY1',
      header: 'Y1',
      render: (m) => formatAmount(m.amountY1),
    },
    {
      key: 'amountY2',
      header: 'Y2',
      render: (m) => formatAmount(m.amountY2),
    },
    {
      key: 'amountY3',
      header: 'Y3',
      render: (m) => formatAmount(m.amountY3),
    },
  ];

  // Columns for ceilings
  const ceilingsColumns: Column<MinisterialCeiling>[] = [
    {
      key: 'ministry',
      header: 'Ministère',
      render: (c) => (
        <div>
          {c.ministry?.name || '-'}
          {c.ministry?.isPriority && <span className="priority-badge">Prioritaire</span>}
        </div>
      ),
    },
    {
      key: 'year',
      header: 'Année',
      render: (c) => c.year,
    },
    {
      key: 'baseline',
      header: 'Baseline',
      render: (c) => formatAmount(c.baseline),
    },
    {
      key: 'newMeasures',
      header: 'Mesures nouvelles',
      render: (c) => formatAmount(c.newMeasures),
    },
    {
      key: 'allocatedSpace',
      header: 'Marge allouée',
      render: (c) => formatAmount(c.allocatedSpace),
    },
    {
      key: 'ceiling',
      header: 'Plafond',
      render: (c) => <strong>{formatAmount(c.ceiling)}</strong>,
    },
  ];

  return (
    <div className="cdmt-global-scenario-detail-page">
      <PageHeader
        title={scenario.name}
        subtitle={`${scenario.scenarioCode} - ${scenario.status} ${scenario.isActive ? '(ACTIF)' : ''}`}
        action={
          <div style={{ display: 'flex', gap: '12px' }}>
            {scenario.status === 'DRAFT' && (
              <Button variant="primary" onClick={handleActivate}>
                Activer
              </Button>
            )}
            <Button variant="secondary" onClick={handleDuplicate}>
              Dupliquer
            </Button>
            {scenario.isActive && (
              <Button variant="secondary" onClick={handleSyncCBMT}>
                Sync CBMT
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/cdmt-global')}>
              Retour
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Vue d'ensemble
        </button>
        <button className={`tab ${activeTab === 'measures' ? 'active' : ''}`} onClick={() => setActiveTab('measures')}>
          Mesures nouvelles
        </button>
        <button className={`tab ${activeTab === 'allocations' ? 'active' : ''}`} onClick={() => setActiveTab('allocations')}>
          Allocation de la marge
        </button>
        <button className={`tab ${activeTab === 'ceilings' ? 'active' : ''}`} onClick={() => setActiveTab('ceilings')}>
          Plafonds ministériels
        </button>
        <button className={`tab ${activeTab === 'breakdown' ? 'active' : ''}`} onClick={() => setActiveTab('breakdown')}>
          Décomposition
        </button>
        <button className={`tab ${activeTab === 'exports' ? 'active' : ''}`} onClick={() => setActiveTab('exports')}>
          Export & CBMT
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="info-section">
              <h3>Informations du scénario</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Code:</label>
                  <span>{scenario.scenarioCode}</span>
                </div>
                <div className="info-item">
                  <label>Nom:</label>
                  <span>{scenario.name}</span>
                </div>
                <div className="info-item">
                  <label>Année fiscale:</label>
                  <span>{scenario.fiscalYear}</span>
                </div>
                <div className="info-item">
                  <label>Statut:</label>
                  <span className={`status-badge status-${scenario.status.toLowerCase()}`}>{scenario.status}</span>
                </div>
              </div>
            </div>

            <div className="cards-grid">
              <div className="summary-card">
                <h3>Marge fiscale disponible</h3>
                <div className="amounts-row">
                  <div className="amount-item">
                    <label>Y1</label>
                    <span className="amount">{formatAmount(scenario.fiscalMarginY1)}</span>
                  </div>
                  <div className="amount-item">
                    <label>Y2</label>
                    <span className="amount">{formatAmount(scenario.fiscalMarginY2)}</span>
                  </div>
                  <div className="amount-item">
                    <label>Y3</label>
                    <span className="amount">{formatAmount(scenario.fiscalMarginY3)}</span>
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <h3>Total Baseline</h3>
                <div className="amounts-row">
                  <div className="amount-item">
                    <label>Y1</label>
                    <span className="amount">{formatAmount(scenario.totalBaselineY1)}</span>
                  </div>
                  <div className="amount-item">
                    <label>Y2</label>
                    <span className="amount">{formatAmount(scenario.totalBaselineY2)}</span>
                  </div>
                  <div className="amount-item">
                    <label>Y3</label>
                    <span className="amount">{formatAmount(scenario.totalBaselineY3)}</span>
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <h3>Total Mesures nouvelles</h3>
                <div className="amounts-row">
                  <div className="amount-item">
                    <label>Y1</label>
                    <span className="amount">{formatAmount(scenario.totalMeasuresY1)}</span>
                  </div>
                  <div className="amount-item">
                    <label>Y2</label>
                    <span className="amount">{formatAmount(scenario.totalMeasuresY2)}</span>
                  </div>
                  <div className="amount-item">
                    <label>Y3</label>
                    <span className="amount">{formatAmount(scenario.totalMeasuresY3)}</span>
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <h3>Total Marge allouée</h3>
                <div className="amounts-row">
                  <div className="amount-item">
                    <label>Y1</label>
                    <span className="amount">{formatAmount(scenario.totalAllocatedY1)}</span>
                    <small>
                      {((Number(scenario.totalAllocatedY1) / Number(scenario.fiscalMarginY1)) * 100).toFixed(1)}%
                    </small>
                  </div>
                  <div className="amount-item">
                    <label>Y2</label>
                    <span className="amount">{formatAmount(scenario.totalAllocatedY2)}</span>
                    <small>
                      {((Number(scenario.totalAllocatedY2) / Number(scenario.fiscalMarginY2)) * 100).toFixed(1)}%
                    </small>
                  </div>
                  <div className="amount-item">
                    <label>Y3</label>
                    <span className="amount">{formatAmount(scenario.totalAllocatedY3)}</span>
                    <small>
                      {((Number(scenario.totalAllocatedY3) / Number(scenario.fiscalMarginY3)) * 100).toFixed(1)}%
                    </small>
                  </div>
                </div>
              </div>

              <div className="summary-card highlight">
                <h3>Total Plafonds</h3>
                <div className="amounts-row">
                  <div className="amount-item">
                    <label>Y1</label>
                    <span className="amount">{formatAmount(scenario.totalCeilingY1)}</span>
                  </div>
                  <div className="amount-item">
                    <label>Y2</label>
                    <span className="amount">{formatAmount(scenario.totalCeilingY2)}</span>
                  </div>
                  <div className="amount-item">
                    <label>Y3</label>
                    <span className="amount">{formatAmount(scenario.totalCeilingY3)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Measures */}
        {activeTab === 'measures' && (
          <div className="measures-tab">
            <div className="section-header">
              <h3>Mesures nouvelles</h3>
              <Button variant="primary" onClick={() => setIsAddMeasureModalOpen(true)}>
                + Ajouter une mesure
              </Button>
            </div>

            <DataTable
              columns={measuresColumns}
              data={measures}
              loading={measuresLoading}
              emptyMessage="Aucune mesure trouvée"
              customActions={(measure: PolicyMeasure) => (
                <button className="btn-delete" onClick={() => handleDeleteMeasure(measure.id)}>
                  Supprimer
                </button>
              )}
            />

            {measures.length > 0 && (
              <div className="totals-row">
                <strong>Total:</strong>
                <span>
                  Y1: {formatAmount(measures.reduce((sum, m) => sum + Number(m.amountY1), 0))}
                </span>
                <span>
                  Y2: {formatAmount(measures.reduce((sum, m) => sum + Number(m.amountY2), 0))}
                </span>
                <span>
                  Y3: {formatAmount(measures.reduce((sum, m) => sum + Number(m.amountY3), 0))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Allocations */}
        {activeTab === 'allocations' && (
          <div className="allocations-tab">
            <div className="section-header">
              <h3>Allocation de la marge fiscale</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" onClick={handleResetAllocations}>
                  Réinitialiser
                </Button>
                <Button variant="primary" onClick={handleSaveAllocations} disabled={Object.keys(editedAllocations).length === 0}>
                  Enregistrer
                </Button>
                <Button variant="secondary" onClick={handleRecalculateCeilings}>
                  Calculer plafonds
                </Button>
              </div>
            </div>

            {remainingMargin && (
              <div className="remaining-margin-card">
                <h4>Marge restante</h4>
                <div className="margin-stats">
                  <div className={`margin-item ${remainingMargin.remainingY1 < 0 ? 'negative' : ''}`}>
                    <label>Y1 Restant:</label>
                    <span className="amount">{formatAmount(remainingMargin.remainingY1)}</span>
                  </div>
                  <div className={`margin-item ${remainingMargin.remainingY2 < 0 ? 'negative' : ''}`}>
                    <label>Y2 Restant:</label>
                    <span className="amount">{formatAmount(remainingMargin.remainingY2)}</span>
                  </div>
                  <div className={`margin-item ${remainingMargin.remainingY3 < 0 ? 'negative' : ''}`}>
                    <label>Y3 Restant:</label>
                    <span className="amount">{formatAmount(remainingMargin.remainingY3)}</span>
                  </div>
                </div>
                {!remainingMargin.isValid && (
                  <div className="warnings">
                    {remainingMargin.warnings.map((warning: string, idx: number) => (
                      <div key={idx} className="warning-message">
                        ⚠️ {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="allocation-table">
              <table>
                <thead>
                  <tr>
                    <th>Ministère</th>
                    <th>Allocation Y1</th>
                    <th>Allocation Y2</th>
                    <th>Allocation Y3</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc) => {
                    const edited = editedAllocations[alloc.ministryId] || alloc;
                    return (
                      <tr key={alloc.id}>
                        <td>
                          {alloc.ministry?.name || '-'}
                          {alloc.ministry?.isPriority && <span className="priority-badge">Prioritaire</span>}
                        </td>
                        <td>
                          <input
                            type="number"
                            value={edited.allocatedY1}
                            onChange={(e) => handleAllocationChange(alloc.ministryId, 'Y1', parseFloat(e.target.value) || 0)}
                            className="allocation-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={edited.allocatedY2}
                            onChange={(e) => handleAllocationChange(alloc.ministryId, 'Y2', parseFloat(e.target.value) || 0)}
                            className="allocation-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={edited.allocatedY3}
                            onChange={(e) => handleAllocationChange(alloc.ministryId, 'Y3', parseFloat(e.target.value) || 0)}
                            className="allocation-input"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Ceilings */}
        {activeTab === 'ceilings' && (
          <div className="ceilings-tab">
            <div className="section-header">
              <h3>Plafonds ministériels calculés</h3>
              <Button variant="secondary" onClick={handleRecalculateCeilings}>
                Recalculer
              </Button>
            </div>

            <DataTable
              columns={ceilingsColumns}
              data={ceilings}
              loading={ceilingsLoading}
              emptyMessage="Aucun plafond calculé"
            />
          </div>
        )}

        {/* Tab 5: Breakdown */}
        {activeTab === 'breakdown' && (
          <div className="breakdown-tab">
            <h3>Décomposition par nature économique</h3>
            <p className="placeholder-message">Cette fonctionnalité sera disponible dans une prochaine version.</p>
          </div>
        )}

        {/* Tab 6: Exports */}
        {activeTab === 'exports' && (
          <div className="exports-tab">
            <div className="export-section">
              <h3>Exporter le scénario</h3>
              <div className="export-buttons">
                <Button variant="primary" onClick={() => handleExport('excel')}>
                  Export Excel complet
                </Button>
                <Button variant="secondary" onClick={() => handleExport('csv')}>
                  Export CSV
                </Button>
                <Button variant="secondary" onClick={() => handleExport('pdf')}>
                  Export PDF résumé
                </Button>
              </div>
            </div>

            <div className="cbmt-section">
              <h3>Intégration CBMT</h3>
              <div className="cbmt-actions">
                <Button variant="primary" onClick={handleSyncCBMT}>
                  Synchroniser vers CBMT
                </Button>
                <p className="info-text">
                  Les plafonds ministériels seront synchronisés avec les agrégats CBMT.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Measure Modal */}
      {isAddMeasureModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddMeasureModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ajouter une mesure nouvelle</h2>
              <button className="modal-close" onClick={() => setIsAddMeasureModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Ministère *</label>
                <select
                  value={measureFormData.ministryId}
                  onChange={(e) => setMeasureFormData({ ...measureFormData, ministryId: e.target.value })}
                >
                  <option value="">Sélectionner un ministère</option>
                  {ministries.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Nom de la mesure *</label>
                <input
                  type="text"
                  value={measureFormData.measureName}
                  onChange={(e) => setMeasureFormData({ ...measureFormData, measureName: e.target.value })}
                  placeholder="Ex: Recrutement de 1000 enseignants"
                />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <select
                  value={measureFormData.category}
                  onChange={(e) => setMeasureFormData({ ...measureFormData, category: e.target.value as any })}
                >
                  <option value="PERSONNEL">Personnel</option>
                  <option value="INVESTMENT">Investissement</option>
                  <option value="OPERATION">Fonctionnement</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Montant Y1</label>
                  <input
                    type="number"
                    value={measureFormData.amountY1}
                    onChange={(e) => setMeasureFormData({ ...measureFormData, amountY1: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Montant Y2</label>
                  <input
                    type="number"
                    value={measureFormData.amountY2}
                    onChange={(e) => setMeasureFormData({ ...measureFormData, amountY2: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Montant Y3</label>
                  <input
                    type="number"
                    value={measureFormData.amountY3}
                    onChange={(e) => setMeasureFormData({ ...measureFormData, amountY3: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={measureFormData.description}
                  onChange={(e) => setMeasureFormData({ ...measureFormData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Justification</label>
                <textarea
                  value={measureFormData.justification}
                  onChange={(e) => setMeasureFormData({ ...measureFormData, justification: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsAddMeasureModalOpen(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleAddMeasure}>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CDMTGlobalScenarioDetail;
