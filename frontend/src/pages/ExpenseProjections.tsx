import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import macroService from '../services/macro.service';
import referentielService from '../services/referentiel.service';
import {
  MacroFramework,
  ExpenseProjection,
  CreateExpenseProjectionDto,
  UpdateExpenseProjectionDto,
  ProjectionSummary,
  FiscalBalance
} from '../types/macro.types';
import { Ministry } from '../types/referentiel.types';
import './ExpenseProjections.css';

const ExpenseProjections: React.FC = () => {
  const { macroFrameworkId } = useParams<{ macroFrameworkId: string }>();
  const navigate = useNavigate();

  const [macroFramework, setMacroFramework] = useState<MacroFramework | null>(null);
  const [projections, setProjections] = useState<ExpenseProjection[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [summary, setSummary] = useState<ProjectionSummary | null>(null);
  const [fiscalBalance, setFiscalBalance] = useState<FiscalBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjection, setEditingProjection] = useState<ExpenseProjection | null>(null);
  const [viewingProjection, setViewingProjection] = useState<ExpenseProjection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<CreateExpenseProjectionDto>({
    macroFrameworkId: macroFrameworkId || '',
    expenseType: 'PERSONNEL',
    categoryCode: '',
    categoryName: '',
    ministryId: undefined,
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
    loadMinistries();
    if (macroFrameworkId) {
      loadData();
    }
  }, [macroFrameworkId]);

  const loadMinistries = async () => {
    try {
      const data = await referentielService.getMinistries();
      setMinistries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des ministères:', error);
      setMinistries([]);
    }
  };

  const loadData = async () => {
    if (!macroFrameworkId) return;

    try {
      setLoading(true);
      const [frameworkData, projectionsData, summaryData, balanceData] = await Promise.all([
        macroService.getMacroFramework(macroFrameworkId),
        macroService.getExpenseProjectionsByMacroFramework(macroFrameworkId),
        macroService.getExpenseSummary(macroFrameworkId).catch(() => null),
        macroService.getFiscalBalance(macroFrameworkId).catch(() => null)
      ]);

      setMacroFramework(frameworkData);
      setProjections(Array.isArray(projectionsData) ? projectionsData : []);
      setSummary(summaryData);
      setFiscalBalance(balanceData);
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
      expenseType: 'PERSONNEL',
      categoryCode: '',
      categoryName: '',
      ministryId: undefined,
      baseYear: macroFramework?.year || currentYear,
      baseAmount: 0,
      projectionYear1: (macroFramework?.year || currentYear) + 1,
      projectedAmount1: 0,
      growthRate1: macroFramework?.inflationRate ? Number(macroFramework.inflationRate) + 2 : 2,
      adjustmentFactor1: 0,
      projectionYear2: (macroFramework?.year || currentYear) + 2,
      projectedAmount2: 0,
      growthRate2: macroFramework?.inflationRate ? Number(macroFramework.inflationRate) + 2 : 2,
      adjustmentFactor2: 0,
      projectionYear3: (macroFramework?.year || currentYear) + 3,
      projectedAmount3: 0,
      growthRate3: macroFramework?.inflationRate ? Number(macroFramework.inflationRate) + 2 : 2,
      adjustmentFactor3: 0,
      calculationMethod: 'AUTO',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleView = (projection: ExpenseProjection) => {
    setViewingProjection(projection);
    setEditingProjection(null);
    populateFormData(projection);
    setIsModalOpen(true);
  };

  const handleEdit = (projection: ExpenseProjection) => {
    setEditingProjection(projection);
    setViewingProjection(null);
    populateFormData(projection);
    setIsModalOpen(true);
  };

  const populateFormData = (projection: ExpenseProjection) => {
    setFormData({
      macroFrameworkId: projection.macroFrameworkId,
      expenseType: projection.expenseType,
      categoryCode: projection.categoryCode,
      categoryName: projection.categoryName,
      ministryId: projection.ministryId || undefined,
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
  };

  const handleDelete = async (projection: ExpenseProjection) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la projection "${projection.categoryName}" ?`)) {
      try {
        await macroService.deleteExpenseProjection(projection.id);
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
        await macroService.updateExpenseProjection(editingProjection.id, formData as UpdateExpenseProjectionDto);
      } else {
        await macroService.createExpenseProjection(formData);
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

  const handleCalculate = async (projection: ExpenseProjection) => {
    try {
      setCalculating(projection.id);
      await macroService.calculateExpenseProjection(projection.id);
      await loadData();
    } catch (error) {
      console.error('Erreur lors du calcul:', error);
      alert('Erreur lors du calcul de la projection');
    } finally {
      setCalculating(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DJ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getExpenseTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'PERSONNEL': 'Personnel',
      'OPERATIONS': 'Fonctionnement',
      'INVESTMENT': 'Investissement',
      'DEBT_SERVICE': 'Service de la Dette',
      'TRANSFERS': 'Transferts',
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

  const getBalanceIndicator = (balance: number, revenues: number) => {
    const isSurplus = balance >= 0;
    const ratio = Math.abs(balance) / revenues;
    const isConcerning = !isSurplus && ratio > 0.05;

    return (
      <div className={`balance-indicator ${isSurplus ? 'surplus' : isConcerning ? 'concerning' : 'deficit'}`}>
        <span className="balance-label">{isSurplus ? 'Excédent' : 'Déficit'}</span>
        <span className="balance-value">{formatCurrency(Math.abs(balance))} FDJ</span>
        <span className="balance-ratio">({(ratio * 100).toFixed(2)}% des recettes)</span>
      </div>
    );
  };

  const columns: Column<ExpenseProjection>[] = [
    {
      key: 'expenseType',
      header: 'Type',
      width: '10%',
      render: (item) => getExpenseTypeLabel(item.expenseType)
    },
    {
      key: 'categoryCode',
      header: 'Code',
      width: '8%'
    },
    {
      key: 'categoryName',
      header: 'Catégorie',
      width: '12%'
    },
    {
      key: 'ministry',
      header: 'Ministère',
      width: '12%',
      render: (item) => item.ministry?.name || '-'
    },
    {
      key: 'baseAmount',
      header: `Base (${macroFramework?.year || 'N'})`,
      width: '11%',
      render: (item) => formatCurrency(Number(item.baseAmount))
    },
    {
      key: 'projectedAmount1',
      header: `Année N+1`,
      width: '11%',
      render: (item) => formatCurrency(Number(item.projectedAmount1))
    },
    {
      key: 'projectedAmount2',
      header: `Année N+2`,
      width: '11%',
      render: (item) => formatCurrency(Number(item.projectedAmount2))
    },
    {
      key: 'projectedAmount3',
      header: `Année N+3`,
      width: '11%',
      render: (item) => item.projectedAmount3 ? formatCurrency(Number(item.projectedAmount3)) : '-'
    },
    {
      key: 'calculationMethod',
      header: 'Méthode',
      width: '8%',
      render: (item) => getMethodBadge(item.calculationMethod)
    }
  ];

  const renderActions = (projection: ExpenseProjection) => {
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
    <div className="expense-projections-page">
      <PageHeader
        title="Projections de Dépenses"
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

      {fiscalBalance && (
        <div className="fiscal-balance-section">
          <h3>Solde Budgétaire Prévisionnel</h3>
          <div className="balance-grid">
            <div className="balance-year-card">
              <h4>Base ({macroFramework?.year})</h4>
              <div className="balance-details">
                <div className="balance-row">
                  <span className="balance-label-text">Recettes:</span>
                  <span className="balance-amount revenue">{formatCurrency(fiscalBalance.revenues.base)} FDJ</span>
                </div>
                <div className="balance-row">
                  <span className="balance-label-text">Dépenses:</span>
                  <span className="balance-amount expense">{formatCurrency(fiscalBalance.expenses.base)} FDJ</span>
                </div>
                <div className="balance-row total">
                  <span className="balance-label-text">Solde:</span>
                  {getBalanceIndicator(fiscalBalance.balance.base, fiscalBalance.revenues.base)}
                </div>
              </div>
            </div>

            <div className="balance-year-card">
              <h4>Année N+1</h4>
              <div className="balance-details">
                <div className="balance-row">
                  <span className="balance-label-text">Recettes:</span>
                  <span className="balance-amount revenue">{formatCurrency(fiscalBalance.revenues.year1)} FDJ</span>
                </div>
                <div className="balance-row">
                  <span className="balance-label-text">Dépenses:</span>
                  <span className="balance-amount expense">{formatCurrency(fiscalBalance.expenses.year1)} FDJ</span>
                </div>
                <div className="balance-row total">
                  <span className="balance-label-text">Solde:</span>
                  {getBalanceIndicator(fiscalBalance.balance.year1, fiscalBalance.revenues.year1)}
                </div>
              </div>
            </div>

            <div className="balance-year-card">
              <h4>Année N+2</h4>
              <div className="balance-details">
                <div className="balance-row">
                  <span className="balance-label-text">Recettes:</span>
                  <span className="balance-amount revenue">{formatCurrency(fiscalBalance.revenues.year2)} FDJ</span>
                </div>
                <div className="balance-row">
                  <span className="balance-label-text">Dépenses:</span>
                  <span className="balance-amount expense">{formatCurrency(fiscalBalance.expenses.year2)} FDJ</span>
                </div>
                <div className="balance-row total">
                  <span className="balance-label-text">Solde:</span>
                  {getBalanceIndicator(fiscalBalance.balance.year2, fiscalBalance.revenues.year2)}
                </div>
              </div>
            </div>

            <div className="balance-year-card">
              <h4>Année N+3</h4>
              <div className="balance-details">
                <div className="balance-row">
                  <span className="balance-label-text">Recettes:</span>
                  <span className="balance-amount revenue">{formatCurrency(fiscalBalance.revenues.year3)} FDJ</span>
                </div>
                <div className="balance-row">
                  <span className="balance-label-text">Dépenses:</span>
                  <span className="balance-amount expense">{formatCurrency(fiscalBalance.expenses.year3)} FDJ</span>
                </div>
                <div className="balance-row total">
                  <span className="balance-label-text">Solde:</span>
                  {getBalanceIndicator(fiscalBalance.balance.year3, fiscalBalance.revenues.year3)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {summary && (
        <div className="projections-summary">
          <h3>Résumé des Projections de Dépenses</h3>
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
        emptyMessage="Aucune projection de dépenses enregistrée"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingProjection ? 'Détails de la Projection' : editingProjection ? 'Modifier la Projection' : 'Nouvelle Projection de Dépenses'}
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
                <label htmlFor="expenseType">Type de Dépense *</label>
                <select
                  id="expenseType"
                  value={formData.expenseType}
                  onChange={(e) => setFormData({ ...formData, expenseType: e.target.value as any })}
                  required
                  disabled={!!viewingProjection}
                >
                  <option value="PERSONNEL">Dépenses de Personnel</option>
                  <option value="OPERATIONS">Fonctionnement</option>
                  <option value="INVESTMENT">Investissement</option>
                  <option value="DEBT_SERVICE">Service de la Dette</option>
                  <option value="TRANSFERS">Transferts</option>
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
                  placeholder="Ex: DEP-PERS-001"
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
                  placeholder="Ex: Salaires de base"
                  disabled={!!viewingProjection}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ministryId">Ministère (optionnel)</label>
              <select
                id="ministryId"
                value={formData.ministryId || ''}
                onChange={(e) => setFormData({ ...formData, ministryId: e.target.value || undefined })}
                disabled={!!viewingProjection}
              >
                <option value="">-- Aucun ministère --</option>
                {ministries.map((ministry) => (
                  <option key={ministry.id} value={ministry.id}>
                    {ministry.code} - {ministry.name}
                  </option>
                ))}
              </select>
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
                  placeholder="Ex: 500000"
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

export default ExpenseProjections;
