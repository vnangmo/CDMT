import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import macroService from '../services/macro.service';
import {
  MacroFramework,
  RevenueProjection,
  CreateRevenueProjectionDto,
  UpdateRevenueProjectionDto,
  ProjectionSummary
} from '../types/macro.types';
import './RevenueProjections.css';

const RevenueProjections: React.FC = () => {
  const { macroFrameworkId } = useParams<{ macroFrameworkId: string }>();
  const navigate = useNavigate();

  const [macroFramework, setMacroFramework] = useState<MacroFramework | null>(null);
  const [projections, setProjections] = useState<RevenueProjection[]>([]);
  const [summary, setSummary] = useState<ProjectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjection, setEditingProjection] = useState<RevenueProjection | null>(null);
  const [viewingProjection, setViewingProjection] = useState<RevenueProjection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<CreateRevenueProjectionDto>({
    macroFrameworkId: macroFrameworkId || '',
    revenueType: 'TAX',
    categoryCode: '',
    categoryName: '',
    baseYear: currentYear,
    baseAmount: 0,
    projectionYear1: currentYear + 1,
    projectedAmount1: 0,
    growthRate1: 0,
    adjustmentFactor1: 0,
    projectionYear2: currentYear + 2,
    projectedAmount2: 0,
    growthRate2: 0,
    adjustmentFactor2: 0,
    projectionYear3: currentYear + 3,
    projectedAmount3: 0,
    growthRate3: 0,
    adjustmentFactor3: 0,
    calculationMethod: 'AUTO',
    notes: ''
  });

  useEffect(() => {
    if (macroFrameworkId) {
      loadData();
    }
  }, [macroFrameworkId]);

  const loadData = async () => {
    if (!macroFrameworkId) return;

    try {
      setLoading(true);
      const [frameworkData, projectionsData, summaryData] = await Promise.all([
        macroService.getMacroFramework(macroFrameworkId),
        macroService.getRevenueProjectionsByMacroFramework(macroFrameworkId),
        macroService.getRevenueSummary(macroFrameworkId).catch(() => null)
      ]);

      setMacroFramework(frameworkData);
      setProjections(Array.isArray(projectionsData) ? projectionsData : []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setProjections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProjection(null);
    setViewingProjection(null);
    setFormData({
      macroFrameworkId: macroFrameworkId || '',
      revenueType: 'TAX',
      categoryCode: '',
      categoryName: '',
      baseYear: macroFramework?.year || currentYear,
      baseAmount: 0,
      projectionYear1: (macroFramework?.year || currentYear) + 1,
      projectedAmount1: 0,
      growthRate1: macroFramework?.gdpGrowthRate ? Number(macroFramework.gdpGrowthRate) : 0,
      adjustmentFactor1: 0,
      projectionYear2: (macroFramework?.year || currentYear) + 2,
      projectedAmount2: 0,
      growthRate2: macroFramework?.gdpGrowthRate ? Number(macroFramework.gdpGrowthRate) : 0,
      adjustmentFactor2: 0,
      projectionYear3: (macroFramework?.year || currentYear) + 3,
      projectedAmount3: 0,
      growthRate3: macroFramework?.gdpGrowthRate ? Number(macroFramework.gdpGrowthRate) : 0,
      adjustmentFactor3: 0,
      calculationMethod: 'AUTO',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleView = (projection: RevenueProjection) => {
    setViewingProjection(projection);
    setEditingProjection(null);
    setFormData({
      macroFrameworkId: projection.macroFrameworkId,
      revenueType: projection.revenueType,
      categoryCode: projection.categoryCode,
      categoryName: projection.categoryName,
      baseYear: projection.baseYear,
      baseAmount: Number(projection.baseAmount),
      projectionYear1: projection.projectionYear1,
      projectedAmount1: Number(projection.projectedAmount1),
      growthRate1: projection.growthRate1 ? Number(projection.growthRate1) : 0,
      adjustmentFactor1: projection.adjustmentFactor1 ? Number(projection.adjustmentFactor1) : 0,
      projectionYear2: projection.projectionYear2,
      projectedAmount2: Number(projection.projectedAmount2),
      growthRate2: projection.growthRate2 ? Number(projection.growthRate2) : 0,
      adjustmentFactor2: projection.adjustmentFactor2 ? Number(projection.adjustmentFactor2) : 0,
      projectionYear3: projection.projectionYear3,
      projectedAmount3: projection.projectedAmount3 ? Number(projection.projectedAmount3) : 0,
      growthRate3: projection.growthRate3 ? Number(projection.growthRate3) : 0,
      adjustmentFactor3: projection.adjustmentFactor3 ? Number(projection.adjustmentFactor3) : 0,
      calculationMethod: projection.calculationMethod,
      notes: projection.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (projection: RevenueProjection) => {
    setEditingProjection(projection);
    setViewingProjection(null);
    setFormData({
      macroFrameworkId: projection.macroFrameworkId,
      revenueType: projection.revenueType,
      categoryCode: projection.categoryCode,
      categoryName: projection.categoryName,
      baseYear: projection.baseYear,
      baseAmount: Number(projection.baseAmount),
      projectionYear1: projection.projectionYear1,
      projectedAmount1: Number(projection.projectedAmount1),
      growthRate1: projection.growthRate1 ? Number(projection.growthRate1) : 0,
      adjustmentFactor1: projection.adjustmentFactor1 ? Number(projection.adjustmentFactor1) : 0,
      projectionYear2: projection.projectionYear2,
      projectedAmount2: Number(projection.projectedAmount2),
      growthRate2: projection.growthRate2 ? Number(projection.growthRate2) : 0,
      adjustmentFactor2: projection.adjustmentFactor2 ? Number(projection.adjustmentFactor2) : 0,
      projectionYear3: projection.projectionYear3,
      projectedAmount3: projection.projectedAmount3 ? Number(projection.projectedAmount3) : 0,
      growthRate3: projection.growthRate3 ? Number(projection.growthRate3) : 0,
      adjustmentFactor3: projection.adjustmentFactor3 ? Number(projection.adjustmentFactor3) : 0,
      calculationMethod: projection.calculationMethod,
      notes: projection.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (projection: RevenueProjection) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la projection "${projection.categoryName}" ?`)) {
      try {
        await macroService.deleteRevenueProjection(projection.id);
        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la projection');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProjection();
  };

  const saveProjection = async () => {
    setSubmitting(true);

    try {
      if (editingProjection) {
        await macroService.updateRevenueProjection(editingProjection.id, formData as UpdateRevenueProjectionDto);
      } else {
        await macroService.createRevenueProjection(formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement de la projection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCalculate = async (projection: RevenueProjection) => {
    try {
      setCalculating(projection.id);
      await macroService.calculateRevenueProjection(projection.id);
      await loadData();
    } catch (error) {
      console.error('Erreur lors du calcul:', error);
      alert('Erreur lors du calcul de la projection');
    } finally {
      setCalculating(null);
    }
  };

  const handleRecalculateAll = async () => {
    if (!macroFrameworkId) return;

    if (window.confirm('Voulez-vous recalculer toutes les projections de recettes ?')) {
      try {
        setLoading(true);
        await macroService.recalculateAllRevenues(macroFrameworkId);
        await loadData();
      } catch (error) {
        console.error('Erreur lors du recalcul:', error);
        alert('Erreur lors du recalcul des projections');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DJ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return `${Number(value).toFixed(2)}%`;
  };

  const getRevenueTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'TAX': 'Fiscales',
      'NON_TAX': 'Non Fiscales',
      'GRANTS': 'Dons',
      'OTHER': 'Autres'
    };
    return labels[type] || type;
  };

  const getMethodBadge = (method: string) => {
    const badges: { [key: string]: { label: string; className: string } } = {
      'AUTO': { label: 'Auto', className: 'auto' },
      'MANUAL': { label: 'Manuel', className: 'manual' },
      'HYBRID': { label: 'Hybride', className: 'hybrid' }
    };
    const badge = badges[method] || { label: method, className: 'auto' };
    return (
      <span className={`method-badge ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const columns: Column<RevenueProjection>[] = [
    {
      key: 'revenueType',
      header: 'Type',
      width: '10%',
      render: (item) => getRevenueTypeLabel(item.revenueType)
    },
    {
      key: 'categoryCode',
      header: 'Code',
      width: '10%'
    },
    {
      key: 'categoryName',
      header: 'Catégorie',
      width: '15%'
    },
    {
      key: 'baseAmount',
      header: `Base (${macroFramework?.year || 'N'})`,
      width: '12%',
      render: (item) => formatCurrency(Number(item.baseAmount))
    },
    {
      key: 'projectedAmount1',
      header: `Année N+1`,
      width: '12%',
      render: (item) => formatCurrency(Number(item.projectedAmount1))
    },
    {
      key: 'projectedAmount2',
      header: `Année N+2`,
      width: '12%',
      render: (item) => formatCurrency(Number(item.projectedAmount2))
    },
    {
      key: 'projectedAmount3',
      header: `Année N+3`,
      width: '12%',
      render: (item) => item.projectedAmount3 ? formatCurrency(Number(item.projectedAmount3)) : '-'
    },
    {
      key: 'calculationMethod',
      header: 'Méthode',
      width: '8%',
      render: (item) => getMethodBadge(item.calculationMethod)
    }
  ];

  const renderActions = (projection: RevenueProjection) => {
    return (
      <div className="projection-actions">
        <button
          onClick={() => handleView(projection)}
          className="action-button view"
          title="Voir"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

        <button
          onClick={() => handleEdit(projection)}
          className="action-button edit"
          title="Modifier"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>

        <button
          onClick={() => handleCalculate(projection)}
          className="action-button calculate"
          title="Recalculer"
          disabled={calculating === projection.id}
        >
          {calculating === projection.id ? (
            <div className="spinner-small"></div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
          )}
        </button>

        <button
          onClick={() => handleDelete(projection)}
          className="action-button delete"
          title="Supprimer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="revenue-projections-page">
      <PageHeader
        title="Projections de Recettes"
        subtitle={macroFramework ? `Cadre Macroéconomique ${macroFramework.year} - Année Budgétaire ${macroFramework.budgetYear}` : 'Chargement...'}
        action={
          <div className="header-actions">
            <Button
              variant="secondary"
              onClick={() => navigate('/macro/frameworks')}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
              }
            >
              Retour
            </Button>
            <Button
              variant="secondary"
              onClick={handleRecalculateAll}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                  <path d="M16 21h5v-5"/>
                </svg>
              }
            >
              Recalculer Tout
            </Button>
            <Button
              onClick={handleCreate}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              }
            >
              Nouvelle Projection
            </Button>
          </div>
        }
      />

      {summary && (
        <div className="projections-summary">
          <h3>Résumé des Projections</h3>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">Base ({macroFramework?.year})</div>
              <div className="summary-value">{formatCurrency(summary.total.base)} FDJ</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Année N+1</div>
              <div className="summary-value">{formatCurrency(summary.total.year1)} FDJ</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Année N+2</div>
              <div className="summary-value">{formatCurrency(summary.total.year2)} FDJ</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Année N+3</div>
              <div className="summary-value">{formatCurrency(summary.total.year3)} FDJ</div>
            </div>
          </div>
        </div>
      )}

      <DataTable
        data={projections}
        columns={columns}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        customActions={renderActions}
        emptyMessage="Aucune projection de recettes enregistrée"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingProjection ? 'Détails de la Projection' : editingProjection ? 'Modifier la Projection' : 'Nouvelle Projection de Recettes'}
        size="large"
        footer={
          viewingProjection ? (
            <Button onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveProjection} loading={submitting}>
                {editingProjection ? 'Mettre à jour' : 'Créer'}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="projection-form">
          <div className="form-section">
            <h3>Informations Générales</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="revenueType">Type de Recette *</label>
                <select
                  id="revenueType"
                  value={formData.revenueType}
                  onChange={(e) => setFormData({ ...formData, revenueType: e.target.value as any })}
                  required
                  disabled={!!viewingProjection}
                >
                  <option value="TAX">Recettes Fiscales</option>
                  <option value="NON_TAX">Recettes Non Fiscales</option>
                  <option value="GRANTS">Dons</option>
                  <option value="OTHER">Autres</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="calculationMethod">Méthode de Calcul *</label>
                <select
                  id="calculationMethod"
                  value={formData.calculationMethod}
                  onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value as any })}
                  required
                  disabled={!!viewingProjection}
                >
                  <option value="AUTO">Automatique</option>
                  <option value="MANUAL">Manuelle</option>
                  <option value="HYBRID">Hybride</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="categoryCode">Code Catégorie *</label>
                <input
                  id="categoryCode"
                  type="text"
                  value={formData.categoryCode}
                  onChange={(e) => setFormData({ ...formData, categoryCode: e.target.value })}
                  required
                  placeholder="Ex: REC-TAX-001"
                  disabled={!!viewingProjection}
                />
              </div>

              <div className="form-group">
                <label htmlFor="categoryName">Nom de la Catégorie *</label>
                <input
                  id="categoryName"
                  type="text"
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  required
                  placeholder="Ex: TVA"
                  disabled={!!viewingProjection}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Année de Base</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="baseYear">Année de Base *</label>
                <input
                  id="baseYear"
                  type="number"
                  value={formData.baseYear}
                  onChange={(e) => setFormData({ ...formData, baseYear: parseInt(e.target.value) })}
                  required
                  disabled={!!viewingProjection}
                />
              </div>

              <div className="form-group">
                <label htmlFor="baseAmount">Montant de Base (FDJ) *</label>
                <input
                  id="baseAmount"
                  type="number"
                  step="0.01"
                  value={formData.baseAmount}
                  onChange={(e) => setFormData({ ...formData, baseAmount: parseFloat(e.target.value) })}
                  required
                  placeholder="Ex: 1000000"
                  disabled={!!viewingProjection}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Projections Triennales</h3>

            <div className="projection-year-block">
              <h4>Année N+1 ({formData.projectionYear1})</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="projectedAmount1">Montant Projeté *</label>
                  <input
                    id="projectedAmount1"
                    type="number"
                    step="0.01"
                    value={formData.projectedAmount1}
                    onChange={(e) => setFormData({ ...formData, projectedAmount1: parseFloat(e.target.value) })}
                    disabled={!!viewingProjection}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="growthRate1">Taux de Croissance (%)</label>
                  <input
                    id="growthRate1"
                    type="number"
                    step="0.01"
                    value={formData.growthRate1}
                    onChange={(e) => setFormData({ ...formData, growthRate1: parseFloat(e.target.value) })}
                    disabled={!!viewingProjection}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="adjustmentFactor1">Facteur d'Ajustement (%)</label>
                  <input
                    id="adjustmentFactor1"
                    type="number"
                    step="0.01"
                    value={formData.adjustmentFactor1}
                    onChange={(e) => setFormData({ ...formData, adjustmentFactor1: parseFloat(e.target.value) })}
                    disabled={!!viewingProjection}
                  />
                </div>
              </div>
            </div>

            <div className="projection-year-block">
              <h4>Année N+2 ({formData.projectionYear2})</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="projectedAmount2">Montant Projeté *</label>
                  <input
                    id="projectedAmount2"
                    type="number"
                    step="0.01"
                    value={formData.projectedAmount2}
                    onChange={(e) => setFormData({ ...formData, projectedAmount2: parseFloat(e.target.value) })}
                    disabled={!!viewingProjection}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="growthRate2">Taux de Croissance (%)</label>
                  <input
                    id="growthRate2"
                    type="number"
                    step="0.01"
                    value={formData.growthRate2}
                    onChange={(e) => setFormData({ ...formData, growthRate2: parseFloat(e.target.value) })}
                    disabled={!!viewingProjection}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="adjustmentFactor2">Facteur d'Ajustement (%)</label>
                  <input
                    id="adjustmentFactor2"
                    type="number"
                    step="0.01"
                    value={formData.adjustmentFactor2}
                    onChange={(e) => setFormData({ ...formData, adjustmentFactor2: parseFloat(e.target.value) })}
                    disabled={!!viewingProjection}
                  />
                </div>
              </div>
            </div>

            <div className="projection-year-block">
              <h4>Année N+3 ({formData.projectionYear3}) - Optionnel</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="projectedAmount3">Montant Projeté</label>
                  <input
                    id="projectedAmount3"
                    type="number"
                    step="0.01"
                    value={formData.projectedAmount3 || ''}
                    onChange={(e) => setFormData({ ...formData, projectedAmount3: e.target.value ? parseFloat(e.target.value) : 0 })}
                    disabled={!!viewingProjection}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="growthRate3">Taux de Croissance (%)</label>
                  <input
                    id="growthRate3"
                    type="number"
                    step="0.01"
                    value={formData.growthRate3 || ''}
                    onChange={(e) => setFormData({ ...formData, growthRate3: e.target.value ? parseFloat(e.target.value) : 0 })}
                    disabled={!!viewingProjection}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="adjustmentFactor3">Facteur d'Ajustement (%)</label>
                  <input
                    id="adjustmentFactor3"
                    type="number"
                    step="0.01"
                    value={formData.adjustmentFactor3 || ''}
                    onChange={(e) => setFormData({ ...formData, adjustmentFactor3: e.target.value ? parseFloat(e.target.value) : 0 })}
                    disabled={!!viewingProjection}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notes et commentaires..."
              disabled={!!viewingProjection}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RevenueProjections;
