import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import macroService from '../services/macro.service';
import { MacroFramework, CreateMacroFrameworkDto, UpdateMacroFrameworkDto } from '../types/macro.types';
import './MacroFrameworks.css';

const MacroFrameworks: React.FC = () => {
  const navigate = useNavigate();
  const [frameworks, setFrameworks] = useState<MacroFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFramework, setEditingFramework] = useState<MacroFramework | null>(null);
  const [viewingFramework, setViewingFramework] = useState<MacroFramework | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateMacroFrameworkDto>({
    year: new Date().getFullYear(),
    budgetYear: new Date().getFullYear() + 1,
    gdpGrowthRate: 0,
    inflationRate: 0,
    exchangeRate: undefined,
    agricultureGrowthRate: 0,
    industryGrowthRate: 0,
    servicesGrowthRate: 0
  });

  useEffect(() => {
    loadFrameworks();
  }, []);

  const loadFrameworks = async () => {
    try {
      setLoading(true);
      const data = await macroService.getMacroFrameworks();
      setFrameworks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des cadres macroéconomiques:', error);
      setFrameworks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFramework(null);
    setViewingFramework(null);
    setFormData({
      year: new Date().getFullYear(),
      budgetYear: new Date().getFullYear() + 1,
      gdpGrowthRate: 0,
      inflationRate: 0,
      exchangeRate: undefined,
      agricultureGrowthRate: 0,
      industryGrowthRate: 0,
      servicesGrowthRate: 0
    });
    setIsModalOpen(true);
  };

  const handleView = (framework: MacroFramework) => {
    setViewingFramework(framework);
    setEditingFramework(null);
    setFormData({
      year: framework.year,
      budgetYear: framework.budgetYear,
      gdpGrowthRate: Number(framework.gdpGrowthRate),
      inflationRate: Number(framework.inflationRate),
      exchangeRate: framework.exchangeRate ? Number(framework.exchangeRate) : undefined,
      agricultureGrowthRate: Number(framework.agricultureGrowthRate),
      industryGrowthRate: Number(framework.industryGrowthRate),
      servicesGrowthRate: Number(framework.servicesGrowthRate)
    });
    setIsModalOpen(true);
  };

  const handleEdit = (framework: MacroFramework) => {
    setEditingFramework(framework);
    setViewingFramework(null);
    setFormData({
      year: framework.year,
      budgetYear: framework.budgetYear,
      gdpGrowthRate: Number(framework.gdpGrowthRate),
      inflationRate: Number(framework.inflationRate),
      exchangeRate: framework.exchangeRate ? Number(framework.exchangeRate) : undefined,
      agricultureGrowthRate: Number(framework.agricultureGrowthRate),
      industryGrowthRate: Number(framework.industryGrowthRate),
      servicesGrowthRate: Number(framework.servicesGrowthRate)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (framework: MacroFramework) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le cadre macroéconomique de l'année ${framework.year} ?`)) {
      try {
        await macroService.deleteMacroFramework(framework.id);
        await loadFrameworks();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du cadre macroéconomique');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveFramework();
  };

  const saveFramework = async () => {
    setSubmitting(true);

    try {
      if (editingFramework) {
        await macroService.updateMacroFramework(editingFramework.id, formData as UpdateMacroFrameworkDto);
      } else {
        await macroService.createMacroFramework(formData);
      }
      setIsModalOpen(false);
      await loadFrameworks();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement du cadre macroéconomique');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (framework: MacroFramework) => {
    if (window.confirm(`Voulez-vous valider le cadre macroéconomique de l'année ${framework.year} ?`)) {
      try {
        await macroService.validateMacroFramework(framework.id);
        await loadFrameworks();
      } catch (error) {
        console.error('Erreur lors de la validation:', error);
        alert('Erreur lors de la validation du cadre macroéconomique');
      }
    }
  };

  const handleApprove = async (framework: MacroFramework) => {
    if (window.confirm(`Voulez-vous approuver le cadre macroéconomique de l'année ${framework.year} ?`)) {
      try {
        await macroService.approveMacroFramework(framework.id);
        await loadFrameworks();
      } catch (error) {
        console.error('Erreur lors de l\'approbation:', error);
        alert('Erreur lors de l\'approbation du cadre macroéconomique');
      }
    }
  };

  const handleReject = async (framework: MacroFramework) => {
    if (window.confirm(`Voulez-vous rejeter le cadre macroéconomique de l'année ${framework.year} ?`)) {
      try {
        await macroService.rejectMacroFramework(framework.id);
        await loadFrameworks();
      } catch (error) {
        console.error('Erreur lors du rejet:', error);
        alert('Erreur lors du rejet du cadre macroéconomique');
      }
    }
  };

  const navigateToRevenues = (framework: MacroFramework) => {
    navigate(`/macro/revenues/${framework.id}`);
  };

  const navigateToExpenses = (framework: MacroFramework) => {
    navigate(`/macro/expenses/${framework.id}`);
  };

  const formatPercentage = (value: number) => {
    return `${Number(value).toFixed(2)}%`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      'DRAFT': { label: 'Brouillon', className: 'draft' },
      'VALIDATED': { label: 'Validé', className: 'validated' },
      'APPROVED': { label: 'Approuvé', className: 'approved' }
    };
    const statusInfo = statusMap[status] || { label: status, className: 'draft' };
    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const columns: Column<MacroFramework>[] = [
    {
      key: 'year',
      header: 'Année',
      width: '8%'
    },
    {
      key: 'budgetYear',
      header: 'Année Budgétaire',
      width: '10%'
    },
    {
      key: 'gdpGrowthRate',
      header: 'Croissance PIB',
      width: '10%',
      render: (item) => formatPercentage(Number(item.gdpGrowthRate))
    },
    {
      key: 'inflationRate',
      header: 'Inflation',
      width: '10%',
      render: (item) => formatPercentage(Number(item.inflationRate))
    },
    {
      key: 'agricultureGrowthRate',
      header: 'Croiss. Agriculture',
      width: '12%',
      render: (item) => formatPercentage(Number(item.agricultureGrowthRate))
    },
    {
      key: 'industryGrowthRate',
      header: 'Croiss. Industrie',
      width: '12%',
      render: (item) => formatPercentage(Number(item.industryGrowthRate))
    },
    {
      key: 'servicesGrowthRate',
      header: 'Croiss. Services',
      width: '12%',
      render: (item) => formatPercentage(Number(item.servicesGrowthRate))
    },
    {
      key: 'status',
      header: 'Statut',
      width: '10%',
      render: (item) => getStatusBadge(item.status)
    }
  ];

  const renderActions = (framework: MacroFramework) => {
    return (
      <div className="macro-actions">
        <button
          onClick={() => handleView(framework)}
          className="action-button view"
          title="Voir"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

        {framework.status === 'DRAFT' && (
          <>
            <button
              onClick={() => handleEdit(framework)}
              className="action-button edit"
              title="Modifier"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              onClick={() => handleValidate(framework)}
              className="action-button validate"
              title="Valider"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </>
        )}

        {framework.status === 'VALIDATED' && (
          <>
            <button
              onClick={() => handleApprove(framework)}
              className="action-button approve"
              title="Approuver"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </button>
            <button
              onClick={() => handleReject(framework)}
              className="action-button reject"
              title="Rejeter"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </>
        )}

        <button
          onClick={() => navigateToRevenues(framework)}
          className="action-button revenues"
          title="Projections de Recettes"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </button>

        <button
          onClick={() => navigateToExpenses(framework)}
          className="action-button expenses"
          title="Projections de Dépenses"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
          </svg>
        </button>

        <button
          onClick={() => navigate(`/macro/tofe/${framework.id}`)}
          className="action-button tofe"
          title="TOFE Prévisionnel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </button>

        {framework.status === 'DRAFT' && (
          <button
            onClick={() => handleDelete(framework)}
            className="action-button delete"
            title="Supprimer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="macro-frameworks-page">
      <PageHeader
        title="Gestion des Cadres Macroéconomiques"
        subtitle="Hypothèses macroéconomiques et projections - Sprint 3.1"
        action={
          <Button
            onClick={handleCreate}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            }
          >
            Nouveau Cadre Macroéconomique
          </Button>
        }
      />

      <DataTable
        data={frameworks}
        columns={columns}
        loading={loading}
        onView={handleView}
        onEdit={(framework) => framework.status === 'DRAFT' && handleEdit(framework)}
        onDelete={(framework) => framework.status === 'DRAFT' && handleDelete(framework)}
        customActions={renderActions}
        emptyMessage="Aucun cadre macroéconomique enregistré"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingFramework ? 'Détails du Cadre Macroéconomique' : editingFramework ? 'Modifier le Cadre Macroéconomique' : 'Nouveau Cadre Macroéconomique'}
        footer={
          viewingFramework ? (
            <Button onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveFramework} loading={submitting}>
                {editingFramework ? 'Mettre à jour' : 'Créer'}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="macro-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Année *</label>
              <input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
                min="2000"
                max="2100"
                disabled={!!viewingFramework}
              />
            </div>

            <div className="form-group">
              <label htmlFor="budgetYear">Année Budgétaire *</label>
              <input
                id="budgetYear"
                type="number"
                value={formData.budgetYear}
                onChange={(e) => setFormData({ ...formData, budgetYear: parseInt(e.target.value) })}
                required
                min="2000"
                max="2100"
                disabled={!!viewingFramework}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gdpGrowthRate">Taux de Croissance du PIB (%) *</label>
              <input
                id="gdpGrowthRate"
                type="number"
                step="0.01"
                value={formData.gdpGrowthRate}
                onChange={(e) => setFormData({ ...formData, gdpGrowthRate: parseFloat(e.target.value) })}
                required
                placeholder="Ex: 5.5"
                disabled={!!viewingFramework}
              />
            </div>

            <div className="form-group">
              <label htmlFor="inflationRate">Taux d'Inflation (%) *</label>
              <input
                id="inflationRate"
                type="number"
                step="0.01"
                value={formData.inflationRate}
                onChange={(e) => setFormData({ ...formData, inflationRate: parseFloat(e.target.value) })}
                required
                placeholder="Ex: 2.5"
                disabled={!!viewingFramework}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="exchangeRate">Taux de Change (optionnel)</label>
            <input
              id="exchangeRate"
              type="number"
              step="0.0001"
              value={formData.exchangeRate || ''}
              onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="Ex: 177.721"
              disabled={!!viewingFramework}
            />
          </div>

          <div className="form-section">
            <h3>Taux de Croissance Sectoriels (%)</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="agricultureGrowthRate">Agriculture *</label>
                <input
                  id="agricultureGrowthRate"
                  type="number"
                  step="0.01"
                  value={formData.agricultureGrowthRate}
                  onChange={(e) => setFormData({ ...formData, agricultureGrowthRate: parseFloat(e.target.value) })}
                  required
                  placeholder="Ex: 3.5"
                  disabled={!!viewingFramework}
                />
              </div>

              <div className="form-group">
                <label htmlFor="industryGrowthRate">Industrie *</label>
                <input
                  id="industryGrowthRate"
                  type="number"
                  step="0.01"
                  value={formData.industryGrowthRate}
                  onChange={(e) => setFormData({ ...formData, industryGrowthRate: parseFloat(e.target.value) })}
                  required
                  placeholder="Ex: 4.2"
                  disabled={!!viewingFramework}
                />
              </div>

              <div className="form-group">
                <label htmlFor="servicesGrowthRate">Services *</label>
                <input
                  id="servicesGrowthRate"
                  type="number"
                  step="0.01"
                  value={formData.servicesGrowthRate}
                  onChange={(e) => setFormData({ ...formData, servicesGrowthRate: parseFloat(e.target.value) })}
                  required
                  placeholder="Ex: 6.0"
                  disabled={!!viewingFramework}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MacroFrameworks;
