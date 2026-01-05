import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cbmtService from '../services/cbmt.service';
import {
  CBMTDocument,
  CBMTAggregate,
  CBMTReserve,
  CBMTAnalysis,
  BudgetSummary,
  GapAnalysisResult,
  OverrunAlert,
  SensitivityAnalysisParams,
  ShockSimulationParams,
} from '../types/cbmt.types';
import './CBMTView.css';

type TabType = 'overview' | 'aggregates' | 'reserves' | 'analyses' | 'calculations';

const CBMTView: React.FC = () => {
  const { cbmtDocumentId } = useParams<{ cbmtDocumentId: string }>();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Data state
  const [document, setDocument] = useState<CBMTDocument | null>(null);
  const [aggregates, setAggregates] = useState<CBMTAggregate[]>([]);
  const [reserves, setReserves] = useState<CBMTReserve[]>([]);
  const [analyses, setAnalyses] = useState<CBMTAnalysis[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult[]>([]);
  const [overrunAlerts, setOverrunAlerts] = useState<OverrunAlert[]>([]);

  // Modal state
  const [isAggregateModalOpen, setIsAggregateModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isSensitivityModalOpen, setIsSensitivityModalOpen] = useState(false);
  const [isShockModalOpen, setIsShockModalOpen] = useState(false);
  const [isSustainabilityModalOpen, setIsSustainabilityModalOpen] = useState(false);

  // Form state
  const [editingAggregate, setEditingAggregate] = useState<CBMTAggregate | null>(null);
  const [editingReserve, setEditingReserve] = useState<CBMTReserve | null>(null);
  const [aggregateFormData, setAggregateFormData] = useState<any>({});
  const [reserveFormData, setReserveFormData] = useState<any>({});
  const [sensitivityParams, setSensitivityParams] = useState<SensitivityAnalysisParams>({});
  const [shockParams, setShockParams] = useState<ShockSimulationParams>({
    shockType: 'REVENUE_SHOCK',
    magnitude: 0,
    duration: 1,
  });
  const [gdpProjections, setGdpProjections] = useState<number[]>([]);

  // Filter state
  const [aggregateTypeFilter, setAggregateTypeFilter] = useState<string>('');

  useEffect(() => {
    if (cbmtDocumentId) {
      loadData();
    }
  }, [cbmtDocumentId]);

  const loadData = async () => {
    if (!cbmtDocumentId) return;

    try {
      setLoading(true);
      const doc = await cbmtService.getCBMTDocument(cbmtDocumentId);
      setDocument(doc);

      await Promise.all([
        loadAggregates(),
        loadReserves(),
        loadAnalyses(),
        loadBudgetSummary(),
      ]);
    } catch (error: any) {
      console.error('Error loading CBMT data:', error);
      alert(error.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadAggregates = async () => {
    if (!cbmtDocumentId) return;
    try {
      const data = await cbmtService.getAggregates(cbmtDocumentId, {});
      setAggregates(data);
    } catch (error) {
      console.error('Error loading aggregates:', error);
    }
  };

  const loadReserves = async () => {
    if (!cbmtDocumentId) return;
    try {
      const data = await cbmtService.getReserves(cbmtDocumentId);
      setReserves(data);
    } catch (error) {
      console.error('Error loading reserves:', error);
    }
  };

  const loadAnalyses = async () => {
    if (!cbmtDocumentId) return;
    try {
      const data = await cbmtService.getAnalyses(cbmtDocumentId);
      setAnalyses(data);
    } catch (error) {
      console.error('Error loading analyses:', error);
    }
  };

  const loadBudgetSummary = async () => {
    if (!cbmtDocumentId) return;
    try {
      const data = await cbmtService.getBudgetSummary(cbmtDocumentId);
      setBudgetSummary(data);
    } catch (error) {
      console.error('Error loading budget summary:', error);
    }
  };

  const loadGapAnalysis = async () => {
    if (!cbmtDocumentId) return;
    try {
      const data = await cbmtService.analyzeGaps(cbmtDocumentId);
      setGapAnalysis(data);
    } catch (error) {
      console.error('Error loading gap analysis:', error);
    }
  };

  const loadOverrunAlerts = async () => {
    if (!cbmtDocumentId) return;
    try {
      const data = await cbmtService.detectOverruns(cbmtDocumentId);
      setOverrunAlerts(data);
    } catch (error) {
      console.error('Error loading overrun alerts:', error);
    }
  };

  // Workflow actions
  const handleValidate = async () => {
    if (!cbmtDocumentId || !window.confirm('Voulez-vous valider ce document CBMT ?')) return;

    try {
      setSubmitting(true);
      const updated = await cbmtService.validateCBMTDocument(cbmtDocumentId);
      setDocument(updated);
      alert('Document validé avec succès');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la validation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!cbmtDocumentId || !window.confirm('Voulez-vous approuver ce document CBMT ?')) return;

    try {
      setSubmitting(true);
      const updated = await cbmtService.approveCBMTDocument(cbmtDocumentId);
      setDocument(updated);
      alert('Document approuvé avec succès');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'approbation');
    } finally {
      setSubmitting(false);
    }
  };

  // Aggregate CRUD
  const handleOpenAggregateModal = (aggregate?: CBMTAggregate) => {
    if (aggregate) {
      setEditingAggregate(aggregate);
      setAggregateFormData(aggregate);
    } else {
      setEditingAggregate(null);
      setAggregateFormData({
        cbmtDocumentId,
        aggregateType: 'REVENUE',
        categoryCode: '',
        categoryName: '',
        baseYear: document?.fiscalYear || new Date().getFullYear(),
        baseAmount: 0,
        year1: (document?.fiscalYear || new Date().getFullYear()) + 1,
        amount1: 0,
        year2: (document?.fiscalYear || new Date().getFullYear()) + 2,
        amount2: 0,
        year3: (document?.fiscalYear || new Date().getFullYear()) + 3,
        amount3: 0,
        calculationMethod: 'AUTO',
      });
    }
    setIsAggregateModalOpen(true);
  };

  const handleSaveAggregate = async () => {
    try {
      setSubmitting(true);
      if (editingAggregate) {
        await cbmtService.updateAggregate(editingAggregate.id, aggregateFormData);
      } else {
        await cbmtService.createAggregate(aggregateFormData);
      }
      setIsAggregateModalOpen(false);
      await loadAggregates();
      await loadBudgetSummary();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAggregate = async (id: string) => {
    if (!window.confirm('Voulez-vous supprimer cet agrégat ?')) return;

    try {
      await cbmtService.deleteAggregate(id);
      await loadAggregates();
      await loadBudgetSummary();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Reserve CRUD
  const handleOpenReserveModal = (reserve?: CBMTReserve) => {
    if (reserve) {
      setEditingReserve(reserve);
      setReserveFormData(reserve);
    } else {
      setEditingReserve(null);
      setReserveFormData({
        cbmtDocumentId,
        reserveType: 'CONTINGENCY',
        name: '',
        description: '',
        year1: (document?.fiscalYear || new Date().getFullYear()) + 1,
        amount1: 0,
        year2: (document?.fiscalYear || new Date().getFullYear()) + 2,
        amount2: 0,
        year3: (document?.fiscalYear || new Date().getFullYear()) + 3,
        amount3: 0,
      });
    }
    setIsReserveModalOpen(true);
  };

  const handleSaveReserve = async () => {
    try {
      setSubmitting(true);
      if (editingReserve) {
        await cbmtService.updateReserve(editingReserve.id, reserveFormData);
      } else {
        await cbmtService.createReserve(reserveFormData);
      }
      setIsReserveModalOpen(false);
      await loadReserves();
      await loadBudgetSummary();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReserve = async (id: string) => {
    if (!window.confirm('Voulez-vous supprimer cette réserve ?')) return;

    try {
      await cbmtService.deleteReserve(id);
      await loadReserves();
      await loadBudgetSummary();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Calculations
  const handleRecalculateGaps = async () => {
    if (!cbmtDocumentId) return;

    try {
      setSubmitting(true);
      await cbmtService.recalculateGaps(cbmtDocumentId);
      await loadAggregates();
      await loadBudgetSummary();
      alert('Écarts recalculés avec succès');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors du recalcul');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCalculateSpendingCeilings = async () => {
    if (!cbmtDocumentId) return;

    try {
      setSubmitting(true);
      await cbmtService.calculateSpendingCeilings(cbmtDocumentId);
      await loadAggregates();
      await loadBudgetSummary();
      alert('Plafonds de dépenses calculés avec succès');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors du calcul');
    } finally {
      setSubmitting(false);
    }
  };

  // Analyses
  const handleRunSensitivityAnalysis = async () => {
    if (!cbmtDocumentId) return;

    try {
      setSubmitting(true);
      await cbmtService.runSensitivityAnalysis(cbmtDocumentId, sensitivityParams);
      setIsSensitivityModalOpen(false);
      await loadAnalyses();
      alert('Analyse de sensibilité exécutée avec succès');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'analyse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunShockSimulation = async () => {
    if (!cbmtDocumentId) return;

    try {
      setSubmitting(true);
      await cbmtService.runShockSimulation(cbmtDocumentId, shockParams);
      setIsShockModalOpen(false);
      await loadAnalyses();
      alert('Simulation de choc exécutée avec succès');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la simulation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCalculateSustainability = async () => {
    if (!cbmtDocumentId) return;

    try {
      setSubmitting(true);
      await cbmtService.calculateSustainabilityRatios(cbmtDocumentId, gdpProjections);
      setIsSustainabilityModalOpen(false);
      await loadAnalyses();
      alert('Ratios de soutenabilité calculés avec succès');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors du calcul');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    if (!window.confirm('Voulez-vous supprimer cette analyse ?')) return;

    try {
      await cbmtService.deleteAnalysis(id);
      await loadAnalyses();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Exports
  const handleExportExcel = async () => {
    if (!cbmtDocumentId) return;

    try {
      setSubmitting(true);
      const blob = await cbmtService.exportToExcel(cbmtDocumentId);
      cbmtService.downloadBlob(blob, `CBMT-${document?.documentCode || cbmtDocumentId}.xlsx`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'export');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!cbmtDocumentId) return;

    try {
      setSubmitting(true);
      const blob = await cbmtService.exportToPDF(cbmtDocumentId);
      cbmtService.downloadBlob(blob, `CBMT-${document?.documentCode || cbmtDocumentId}.pdf`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'export');
    } finally {
      setSubmitting(false);
    }
  };

  // Filters
  const filteredAggregates = aggregates.filter(
    (agg) => !aggregateTypeFilter || agg.aggregateType === aggregateTypeFilter
  );

  if (loading) {
    return <div className="cbmt-view-loading">Chargement...</div>;
  }

  if (!document) {
    return <div className="cbmt-view-error">Document CBMT introuvable</div>;
  }

  return (
    <div className="cbmt-view">
      {/* Header */}
      <div className="cbmt-header">
        <div className="cbmt-header-left">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Retour
          </button>
          <div className="cbmt-title-section">
            <h1>{document.title}</h1>
            <p className="cbmt-subtitle">
              {document.documentCode} - Année fiscale {document.fiscalYear}
            </p>
          </div>
        </div>
        <div className="cbmt-header-right">
          <span className={`status-badge status-${document.status.toLowerCase()}`}>
            {document.status}
          </span>
          {document.status === 'DRAFT' && (
            <button
              className="btn-primary"
              onClick={handleValidate}
              disabled={submitting}
            >
              Valider
            </button>
          )}
          {document.status === 'VALIDATED' && (
            <button
              className="btn-success"
              onClick={handleApprove}
              disabled={submitting}
            >
              Approuver
            </button>
          )}
          <button className="btn-secondary" onClick={handleExportExcel} disabled={submitting}>
            📊 Export Excel
          </button>
          <button className="btn-secondary" onClick={handleExportPDF} disabled={submitting}>
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="cbmt-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button
          className={`tab ${activeTab === 'aggregates' ? 'active' : ''}`}
          onClick={() => setActiveTab('aggregates')}
        >
          Agrégats
        </button>
        <button
          className={`tab ${activeTab === 'reserves' ? 'active' : ''}`}
          onClick={() => setActiveTab('reserves')}
        >
          Réserves
        </button>
        <button
          className={`tab ${activeTab === 'calculations' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('calculations');
            loadGapAnalysis();
            loadOverrunAlerts();
          }}
        >
          Calculs
        </button>
        <button
          className={`tab ${activeTab === 'analyses' ? 'active' : ''}`}
          onClick={() => setActiveTab('analyses')}
        >
          Analyses
        </button>
      </div>

      {/* Tab Content */}
      <div className="cbmt-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-cards">
              <div className="overview-card">
                <h3>Plafond Recettes</h3>
                <p className="amount">
                  {document.totalRevenueCeiling.toLocaleString()} {document.currency}
                </p>
              </div>
              <div className="overview-card">
                <h3>Plafond Dépenses</h3>
                <p className="amount">
                  {document.totalExpenseCeiling.toLocaleString()} {document.currency}
                </p>
              </div>
              {document.fiscalDeficitCeiling && (
                <div className="overview-card">
                  <h3>Plafond Déficit</h3>
                  <p className="amount deficit">
                    {document.fiscalDeficitCeiling.toLocaleString()} {document.currency}
                  </p>
                </div>
              )}
              {document.debtCeiling && (
                <div className="overview-card">
                  <h3>Plafond Dette</h3>
                  <p className="amount">
                    {document.debtCeiling.toLocaleString()} {document.currency}
                  </p>
                </div>
              )}
            </div>

            <div className="overview-info">
              <h3>Informations</h3>
              <table className="info-table">
                <tbody>
                  <tr>
                    <td><strong>Scénario:</strong></td>
                    <td>{document.scenarioName}</td>
                  </tr>
                  <tr>
                    <td><strong>Type:</strong></td>
                    <td>{document.scenarioType}</td>
                  </tr>
                  <tr>
                    <td><strong>Unité:</strong></td>
                    <td>{document.unit}</td>
                  </tr>
                  <tr>
                    <td><strong>Date de génération:</strong></td>
                    <td>{new Date(document.generatedAt).toLocaleDateString()}</td>
                  </tr>
                  {document.validatedAt && (
                    <tr>
                      <td><strong>Validé le:</strong></td>
                      <td>{new Date(document.validatedAt).toLocaleDateString()}</td>
                    </tr>
                  )}
                  {document.approvedAt && (
                    <tr>
                      <td><strong>Approuvé le:</strong></td>
                      <td>{new Date(document.approvedAt).toLocaleDateString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {budgetSummary.length > 0 && (
              <div className="budget-summary-section">
                <h3>Résumé Budgétaire</h3>
                {budgetSummary.map((summary) => (
                  <div key={summary.year} className="year-summary">
                    <h4>Année {summary.year}</h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span>Recettes totales:</span>
                        <strong>{summary.revenues.total.toLocaleString()} {document.currency}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Plafond recettes:</span>
                        <strong>{summary.revenues.ceiling.toLocaleString()} {document.currency}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Écart recettes:</span>
                        <strong className={summary.revenues.gap < 0 ? 'negative' : ''}>
                          {summary.revenues.gap.toLocaleString()} {document.currency} ({summary.revenues.gapPercentage.toFixed(2)}%)
                        </strong>
                      </div>
                      <div className="summary-item">
                        <span>Dépenses totales:</span>
                        <strong>{summary.expenses.total.toLocaleString()} {document.currency}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Plafond dépenses:</span>
                        <strong>{summary.expenses.ceiling.toLocaleString()} {document.currency}</strong>
                      </div>
                      <div className="summary-item">
                        <span>Écart dépenses:</span>
                        <strong className={summary.expenses.gap > 0 ? 'negative' : ''}>
                          {summary.expenses.gap.toLocaleString()} {document.currency} ({summary.expenses.gapPercentage.toFixed(2)}%)
                        </strong>
                      </div>
                      <div className="summary-item">
                        <span>Solde budgétaire:</span>
                        <strong className={summary.balance.actual < 0 ? 'deficit' : 'surplus'}>
                          {summary.balance.actual.toLocaleString()} {document.currency}
                        </strong>
                      </div>
                      <div className="summary-item">
                        <span>Réserves disponibles:</span>
                        <strong>{summary.reserves.available.toLocaleString()} {document.currency}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {document.notes && (
              <div className="overview-notes">
                <h3>Notes</h3>
                <p>{document.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Aggregates Tab */}
        {activeTab === 'aggregates' && (
          <div className="aggregates-tab">
            <div className="tab-header">
              <div className="tab-header-left">
                <select
                  value={aggregateTypeFilter}
                  onChange={(e) => setAggregateTypeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Tous les types</option>
                  <option value="REVENUE">Recettes</option>
                  <option value="EXPENSE">Dépenses</option>
                </select>
              </div>
              <button
                className="btn-primary"
                onClick={() => handleOpenAggregateModal()}
                disabled={document.status !== 'DRAFT'}
              >
                + Ajouter un agrégat
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Catégorie</th>
                    <th>Année de base</th>
                    <th>Montant base</th>
                    <th>Année 1</th>
                    <th>Montant 1</th>
                    <th>Plafond 1</th>
                    <th>Écart 1</th>
                    <th>Année 2</th>
                    <th>Montant 2</th>
                    <th>Plafond 2</th>
                    <th>Écart 2</th>
                    <th>Année 3</th>
                    <th>Montant 3</th>
                    <th>Plafond 3</th>
                    <th>Écart 3</th>
                    <th>Méthode</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAggregates.map((agg) => (
                    <tr key={agg.id} className={agg.isAlertTriggered ? 'alert-row' : ''}>
                      <td>{agg.aggregateType === 'REVENUE' ? 'Recette' : 'Dépense'}</td>
                      <td>
                        <div>{agg.categoryName}</div>
                        <small className="code">{agg.categoryCode}</small>
                      </td>
                      <td>{agg.baseYear}</td>
                      <td className="amount">{agg.baseAmount.toLocaleString()}</td>
                      <td>{agg.year1}</td>
                      <td className="amount">{agg.amount1.toLocaleString()}</td>
                      <td className="amount">{agg.ceiling1?.toLocaleString() || '-'}</td>
                      <td className={`amount ${(agg.gap1 || 0) < 0 ? 'negative' : ''}`}>
                        {agg.gap1?.toLocaleString() || '-'}
                      </td>
                      <td>{agg.year2}</td>
                      <td className="amount">{agg.amount2.toLocaleString()}</td>
                      <td className="amount">{agg.ceiling2?.toLocaleString() || '-'}</td>
                      <td className={`amount ${(agg.gap2 || 0) < 0 ? 'negative' : ''}`}>
                        {agg.gap2?.toLocaleString() || '-'}
                      </td>
                      <td>{agg.year3}</td>
                      <td className="amount">{agg.amount3.toLocaleString()}</td>
                      <td className="amount">{agg.ceiling3?.toLocaleString() || '-'}</td>
                      <td className={`amount ${(agg.gap3 || 0) < 0 ? 'negative' : ''}`}>
                        {agg.gap3?.toLocaleString() || '-'}
                      </td>
                      <td>{agg.calculationMethod}</td>
                      <td className="actions">
                        <button
                          className="btn-edit"
                          onClick={() => handleOpenAggregateModal(agg)}
                          disabled={document.status !== 'DRAFT'}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteAggregate(agg.id)}
                          disabled={document.status !== 'DRAFT'}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reserves Tab */}
        {activeTab === 'reserves' && (
          <div className="reserves-tab">
            <div className="tab-header">
              <h2>Réserves</h2>
              <button
                className="btn-primary"
                onClick={() => handleOpenReserveModal()}
                disabled={document.status !== 'DRAFT'}
              >
                + Ajouter une réserve
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Nom</th>
                    <th>Année 1</th>
                    <th>Montant 1</th>
                    <th>Alloué 1</th>
                    <th>Disponible 1</th>
                    <th>Année 2</th>
                    <th>Montant 2</th>
                    <th>Alloué 2</th>
                    <th>Disponible 2</th>
                    <th>Année 3</th>
                    <th>Montant 3</th>
                    <th>Alloué 3</th>
                    <th>Disponible 3</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reserves.map((res) => (
                    <tr key={res.id}>
                      <td>{res.reserveType}</td>
                      <td>
                        <div>{res.name}</div>
                        {res.description && <small>{res.description}</small>}
                      </td>
                      <td>{res.year1}</td>
                      <td className="amount">{res.amount1.toLocaleString()}</td>
                      <td className="amount allocated">{res.allocated1.toLocaleString()}</td>
                      <td className="amount available">{res.available1.toLocaleString()}</td>
                      <td>{res.year2}</td>
                      <td className="amount">{res.amount2.toLocaleString()}</td>
                      <td className="amount allocated">{res.allocated2.toLocaleString()}</td>
                      <td className="amount available">{res.available2.toLocaleString()}</td>
                      <td>{res.year3}</td>
                      <td className="amount">{res.amount3.toLocaleString()}</td>
                      <td className="amount allocated">{res.allocated3.toLocaleString()}</td>
                      <td className="amount available">{res.available3.toLocaleString()}</td>
                      <td className="actions">
                        <button
                          className="btn-edit"
                          onClick={() => handleOpenReserveModal(res)}
                          disabled={document.status !== 'DRAFT'}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteReserve(res.id)}
                          disabled={document.status !== 'DRAFT'}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calculations Tab */}
        {activeTab === 'calculations' && (
          <div className="calculations-tab">
            <div className="tab-header">
              <h2>Calculs et Analyses d'écarts</h2>
              <div className="calc-buttons">
                <button
                  className="btn-primary"
                  onClick={handleRecalculateGaps}
                  disabled={submitting}
                >
                  Recalculer les écarts
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleCalculateSpendingCeilings}
                  disabled={submitting}
                >
                  Calculer les plafonds
                </button>
              </div>
            </div>

            {overrunAlerts.length > 0 && (
              <div className="overrun-alerts">
                <h3>⚠️ Alertes de dépassement</h3>
                {overrunAlerts.map((alert, idx) => (
                  <div key={idx} className={`alert alert-${alert.riskLevel.toLowerCase()}`}>
                    <strong>{alert.categoryName}</strong> ({alert.aggregateType}) - Année {alert.year}
                    <br />
                    {alert.message}
                    <br />
                    <small>
                      Montant: {alert.amount.toLocaleString()} | Plafond: {alert.ceiling.toLocaleString()} |
                      Écart: {alert.gap.toLocaleString()} ({alert.gapPercentage.toFixed(2)}%)
                    </small>
                  </div>
                ))}
              </div>
            )}

            {gapAnalysis.length > 0 && (
              <div className="gap-analysis-section">
                <h3>Analyse des écarts budgétaires</h3>
                {gapAnalysis.map((gap) => (
                  <div key={gap.year} className="gap-year-card">
                    <h4>Année {gap.year}</h4>
                    <div className="gap-grid">
                      <div className="gap-item">
                        <span>Recettes projetées:</span>
                        <strong>{gap.totalRevenueProjected.toLocaleString()}</strong>
                      </div>
                      <div className="gap-item">
                        <span>Plafond recettes:</span>
                        <strong>{gap.totalRevenueCeiling.toLocaleString()}</strong>
                      </div>
                      <div className="gap-item">
                        <span>Écart recettes:</span>
                        <strong className={gap.revenueGap < 0 ? 'negative' : ''}>
                          {gap.revenueGap.toLocaleString()} ({gap.revenueGapPercentage.toFixed(2)}%)
                        </strong>
                      </div>
                      <div className="gap-item">
                        <span>Dépenses projetées:</span>
                        <strong>{gap.totalExpenseProjected.toLocaleString()}</strong>
                      </div>
                      <div className="gap-item">
                        <span>Plafond dépenses:</span>
                        <strong>{gap.totalExpenseCeiling.toLocaleString()}</strong>
                      </div>
                      <div className="gap-item">
                        <span>Écart dépenses:</span>
                        <strong className={gap.expenseGap > 0 ? 'negative' : ''}>
                          {gap.expenseGap.toLocaleString()} ({gap.expenseGapPercentage.toFixed(2)}%)
                        </strong>
                      </div>
                      <div className="gap-item">
                        <span>Solde budgétaire:</span>
                        <strong className={gap.fiscalBalance < 0 ? 'deficit' : 'surplus'}>
                          {gap.fiscalBalance.toLocaleString()}
                        </strong>
                      </div>
                      <div className="gap-item">
                        <span>Dépassement:</span>
                        <strong className={gap.hasOverrun ? 'overrun' : 'ok'}>
                          {gap.hasOverrun ? 'OUI' : 'NON'}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analyses Tab */}
        {activeTab === 'analyses' && (
          <div className="analyses-tab">
            <div className="tab-header">
              <h2>Analyses</h2>
              <div className="analysis-buttons">
                <button
                  className="btn-primary"
                  onClick={() => setIsSensitivityModalOpen(true)}
                >
                  📊 Sensibilité
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setIsShockModalOpen(true)}
                >
                  💥 Choc
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setIsSustainabilityModalOpen(true)}
                >
                  ♻️ Soutenabilité
                </button>
              </div>
            </div>

            <div className="analyses-list">
              {analyses.map((analysis) => (
                <div key={analysis.id} className="analysis-card">
                  <div className="analysis-header">
                    <div>
                      <h3>{analysis.analysisName}</h3>
                      <span className="analysis-type">{analysis.analysisType}</span>
                      {analysis.riskLevel && (
                        <span className={`risk-badge risk-${analysis.riskLevel.toLowerCase()}`}>
                          {analysis.riskLevel}
                        </span>
                      )}
                    </div>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteAnalysis(analysis.id)}
                    >
                      🗑️
                    </button>
                  </div>
                  {analysis.description && <p>{analysis.description}</p>}

                  {analysis.conclusions && (
                    <div className="analysis-conclusions">
                      <strong>Conclusions:</strong>
                      <p>{analysis.conclusions}</p>
                    </div>
                  )}

                  {analysis.recommendations && (
                    <div className="analysis-recommendations">
                      <strong>Recommandations:</strong>
                      <p>{analysis.recommendations}</p>
                    </div>
                  )}

                  <div className="analysis-meta">
                    <small>Calculé le {new Date(analysis.calculatedAt).toLocaleString()}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Aggregate Modal */}
      {isAggregateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAggregateModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAggregate ? 'Modifier' : 'Ajouter'} un agrégat</h2>
              <button className="modal-close" onClick={() => setIsAggregateModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={aggregateFormData.aggregateType || 'REVENUE'}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, aggregateType: e.target.value })}
                  >
                    <option value="REVENUE">Recette</option>
                    <option value="EXPENSE">Dépense</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Code catégorie *</label>
                  <input
                    type="text"
                    value={aggregateFormData.categoryCode || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, categoryCode: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Nom catégorie *</label>
                  <input
                    type="text"
                    value={aggregateFormData.categoryName || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, categoryName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Année de base *</label>
                  <input
                    type="number"
                    value={aggregateFormData.baseYear || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, baseYear: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Montant de base *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={aggregateFormData.baseAmount || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, baseAmount: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Année 1 *</label>
                  <input
                    type="number"
                    value={aggregateFormData.year1 || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, year1: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Montant 1 *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={aggregateFormData.amount1 || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, amount1: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Plafond 1</label>
                  <input
                    type="number"
                    step="0.01"
                    value={aggregateFormData.ceiling1 || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, ceiling1: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Année 2 *</label>
                  <input
                    type="number"
                    value={aggregateFormData.year2 || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, year2: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Montant 2 *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={aggregateFormData.amount2 || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, amount2: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Plafond 2</label>
                  <input
                    type="number"
                    step="0.01"
                    value={aggregateFormData.ceiling2 || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, ceiling2: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Année 3 *</label>
                  <input
                    type="number"
                    value={aggregateFormData.year3 || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, year3: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Montant 3 *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={aggregateFormData.amount3 || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, amount3: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Plafond 3</label>
                  <input
                    type="number"
                    step="0.01"
                    value={aggregateFormData.ceiling3 || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, ceiling3: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Méthode de calcul</label>
                  <select
                    value={aggregateFormData.calculationMethod || 'AUTO'}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, calculationMethod: e.target.value })}
                  >
                    <option value="AUTO">Automatique</option>
                    <option value="MANUAL">Manuel</option>
                    <option value="HYBRID">Hybride</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={aggregateFormData.notes || ''}
                    onChange={(e) => setAggregateFormData({ ...aggregateFormData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsAggregateModalOpen(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleSaveAggregate} disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reserve Modal */}
      {isReserveModalOpen && (
        <div className="modal-overlay" onClick={() => setIsReserveModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingReserve ? 'Modifier' : 'Ajouter'} une réserve</h2>
              <button className="modal-close" onClick={() => setIsReserveModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={reserveFormData.reserveType || 'CONTINGENCY'}
                    onChange={(e) => setReserveFormData({ ...reserveFormData, reserveType: e.target.value })}
                  >
                    <option value="CONTINGENCY">Imprévus</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={reserveFormData.name || ''}
                    onChange={(e) => setReserveFormData({ ...reserveFormData, name: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={reserveFormData.description || ''}
                    onChange={(e) => setReserveFormData({ ...reserveFormData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label>Année 1 *</label>
                  <input
                    type="number"
                    value={reserveFormData.year1 || ''}
                    onChange={(e) => setReserveFormData({ ...reserveFormData, year1: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Montant 1 *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={reserveFormData.amount1 || ''}
                    onChange={(e) => setReserveFormData({ ...reserveFormData, amount1: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Année 2 *</label>
                  <input
                    type="number"
                    value={reserveFormData.year2 || ''}
                    onChange={(e) => setReserveFormData({ ...reserveFormData, year2: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Montant 2 *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={reserveFormData.amount2 || ''}
                    onChange={(e) => setReserveFormData({ ...reserveFormData, amount2: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Année 3 *</label>
                  <input
                    type="number"
                    value={reserveFormData.year3 || ''}
                    onChange={(e) => setReserveFormData({ ...reserveFormData, year3: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Montant 3 *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={reserveFormData.amount3 || ''}
                    onChange={(e) => setReserveFormData({ ...reserveFormData, amount3: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Base de calcul</label>
                  <input
                    type="text"
                    value={reserveFormData.calculationBasis || ''}
                    onChange={(e) => setReserveFormData({ ...reserveFormData, calculationBasis: e.target.value })}
                    placeholder="Ex: 2% des dépenses totales"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsReserveModalOpen(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleSaveReserve} disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sensitivity Analysis Modal */}
      {isSensitivityModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSensitivityModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Analyse de sensibilité</h2>
              <button className="modal-close" onClick={() => setIsSensitivityModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Variation croissance PIB (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sensitivityParams.gdpGrowthVariation || ''}
                    onChange={(e) => setSensitivityParams({ ...sensitivityParams, gdpGrowthVariation: parseFloat(e.target.value) })}
                    placeholder="Ex: 1.5"
                  />
                </div>
                <div className="form-group">
                  <label>Variation inflation (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sensitivityParams.inflationVariation || ''}
                    onChange={(e) => setSensitivityParams({ ...sensitivityParams, inflationVariation: parseFloat(e.target.value) })}
                    placeholder="Ex: 0.5"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsSensitivityModalOpen(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleRunSensitivityAnalysis} disabled={submitting}>
                {submitting ? 'Analyse...' : 'Analyser'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shock Simulation Modal */}
      {isShockModalOpen && (
        <div className="modal-overlay" onClick={() => setIsShockModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Simulation de choc</h2>
              <button className="modal-close" onClick={() => setIsShockModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Type de choc *</label>
                  <select
                    value={shockParams.shockType}
                    onChange={(e) => setShockParams({ ...shockParams, shockType: e.target.value })}
                  >
                    <option value="REVENUE_SHOCK">Choc sur recettes</option>
                    <option value="EXPENSE_SHOCK">Choc sur dépenses</option>
                    <option value="COMBINED_SHOCK">Choc combiné</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Magnitude (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={shockParams.magnitude}
                    onChange={(e) => setShockParams({ ...shockParams, magnitude: parseFloat(e.target.value) })}
                    placeholder="Ex: -10 pour -10%"
                  />
                </div>
                <div className="form-group">
                  <label>Durée (années) *</label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    value={shockParams.duration}
                    onChange={(e) => setShockParams({ ...shockParams, duration: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsShockModalOpen(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleRunShockSimulation} disabled={submitting}>
                {submitting ? 'Simulation...' : 'Simuler'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sustainability Modal */}
      {isSustainabilityModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSustainabilityModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ratios de soutenabilité</h2>
              <button className="modal-close" onClick={() => setIsSustainabilityModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Entrez les projections du PIB pour les 3 années:</p>
              <div className="form-grid">
                <div className="form-group">
                  <label>PIB Année 1 *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={gdpProjections[0] || ''}
                    onChange={(e) => {
                      const newProj = [...gdpProjections];
                      newProj[0] = parseFloat(e.target.value);
                      setGdpProjections(newProj);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>PIB Année 2 *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={gdpProjections[1] || ''}
                    onChange={(e) => {
                      const newProj = [...gdpProjections];
                      newProj[1] = parseFloat(e.target.value);
                      setGdpProjections(newProj);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>PIB Année 3 *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={gdpProjections[2] || ''}
                    onChange={(e) => {
                      const newProj = [...gdpProjections];
                      newProj[2] = parseFloat(e.target.value);
                      setGdpProjections(newProj);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsSustainabilityModalOpen(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleCalculateSustainability} disabled={submitting}>
                {submitting ? 'Calcul...' : 'Calculer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CBMTView;
