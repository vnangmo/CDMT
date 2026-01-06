import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import referentielService from '../services/referentiel.service';
import api from '../config/api';
import { FiscalYear, CreateFiscalYearDto, UpdateFiscalYearDto } from '../types/referentiel.types';
import './FiscalYears.css';

interface BaseYearConfig {
  label: string;
  year: number;
  description: string;
  type: 'EXECUTED' | 'LFI' | 'PROJECTION';
}

interface YearConstraints {
  historicalData: number;
  budgetLines: number;
}

const FiscalYears: React.FC = () => {
  const [years, setYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<FiscalYear | null>(null);
  const [viewingYear, setViewingYear] = useState<FiscalYear | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [baseYear, setBaseYear] = useState<number>(new Date().getFullYear());

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    year: FiscalYear | null;
    loading: boolean;
    error: string | null;
    constraints: YearConstraints | null;
  }>({ open: false, year: null, loading: false, error: null, constraints: null });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<CreateFiscalYearDto>({
    year: new Date().getFullYear(),
    name: '',
    startDate: '',
    endDate: '',
    isActive: true
  });

  const baseYearConfig = useMemo<BaseYearConfig[]>(() => {
    return [
      { label: 'N-2', year: baseYear - 2, description: 'Execution cloturee', type: 'EXECUTED' as const },
      { label: 'N-1', year: baseYear - 1, description: 'Execution en cours', type: 'EXECUTED' as const },
      { label: 'N', year: baseYear, description: 'LFI (Loi de Finances Initiale)', type: 'LFI' as const }
    ];
  }, [baseYear]);

  const getYearStatus = (year: number): FiscalYear | undefined => {
    return years.find(y => y.year === year);
  };

  useEffect(() => { loadYears(); }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadYears = async () => {
    try {
      setLoading(true);
      const data = await referentielService.getFiscalYears();
      setYears(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setYears([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingYear(null);
    setViewingYear(null);
    const currentYear = new Date().getFullYear();
    setFormData({
      year: currentYear,
      name: `Annee Fiscale ${currentYear}`,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleView = (year: FiscalYear) => {
    setViewingYear(year);
    setEditingYear(null);
    setFormData({
      year: year.year,
      name: year.name,
      startDate: year.startDate.split('T')[0],
      endDate: year.endDate.split('T')[0],
      isActive: year.isActive
    });
    setIsModalOpen(true);
  };

  const handleEdit = (year: FiscalYear) => {
    setEditingYear(year);
    setViewingYear(null);
    setFormData({
      year: year.year,
      name: year.name,
      startDate: year.startDate.split('T')[0],
      endDate: year.endDate.split('T')[0],
      isActive: year.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (year: FiscalYear) => {
    setDeleteDialog({ open: true, year, loading: true, error: null, constraints: null });

    try {
      const [historicalRes, budgetRes] = await Promise.all([
        api.get(`/trend-budgets/historical?fiscalYear=${year.year}&limit=1`).catch(() => ({ data: { data: { total: 0 } } })),
        api.get(`/budget-lines?fiscalYear=${year.year}&limit=1`).catch(() => ({ data: { data: { total: 0 } } }))
      ]);

      const constraints: YearConstraints = {
        historicalData: historicalRes.data.data?.pagination?.total || historicalRes.data.data?.data?.length || 0,
        budgetLines: budgetRes.data.data?.pagination?.total || budgetRes.data.data?.data?.length || 0
      };

      setDeleteDialog(prev => ({ ...prev, loading: false, constraints }));
    } catch (error) {
      setDeleteDialog(prev => ({ ...prev, loading: false, constraints: { historicalData: 0, budgetLines: 0 } }));
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.year) return;
    setDeleteDialog(prev => ({ ...prev, loading: true, error: null }));

    try {
      await referentielService.deleteFiscalYear(deleteDialog.year.id);
      setMessage({ type: 'success', text: 'Annee fiscale supprimee avec succes' });
      setDeleteDialog({ open: false, year: null, loading: false, error: null, constraints: null });
      await loadYears();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erreur lors de la suppression';
      setDeleteDialog(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  const hasConstraints = (): boolean => {
    const c = deleteDialog.constraints;
    return !!(c && (c.historicalData > 0 || c.budgetLines > 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveYear();
  };

  const saveYear = async () => {
    setSubmitting(true);
    try {
      if (editingYear) {
        await referentielService.updateFiscalYear(editingYear.id, formData as UpdateFiscalYearDto);
        setMessage({ type: 'success', text: 'Annee fiscale mise a jour avec succes' });
      } else {
        await referentielService.createFiscalYear(formData);
        setMessage({ type: 'success', text: 'Annee fiscale creee avec succes' });
      }
      setIsModalOpen(false);
      await loadYears();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBaseYear = async (yearConfig: BaseYearConfig) => {
    try {
      setSubmitting(true);
      await referentielService.createFiscalYear({
        year: yearConfig.year,
        name: `Annee Fiscale ${yearConfig.year}`,
        startDate: `${yearConfig.year}-01-01`,
        endDate: `${yearConfig.year}-12-31`,
        isActive: true
      });
      setMessage({ type: 'success', text: `Annee fiscale ${yearConfig.year} creee avec succes` });
      await loadYears();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de la creation' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<FiscalYear>[] = [
    { key: 'year', header: 'Annee', width: '15%', render: (item) => <strong>{item.year}</strong> },
    { key: 'startDate', header: 'Date debut', width: '20%', render: (item) => new Date(item.startDate).toLocaleDateString('fr-FR') },
    { key: 'endDate', header: 'Date fin', width: '20%', render: (item) => new Date(item.endDate).toLocaleDateString('fr-FR') },
    { key: 'isClosed', header: 'Statut', width: '15%', render: (item) => (<span className={`status-badge ${item.isClosed ? 'closed' : 'active'}`}>{item.isClosed ? 'Cloturee' : 'Ouverte'}</span>) },
    { key: 'isActive', header: 'Etat', width: '10%', render: (item) => (<span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>{item.isActive ? 'Actif' : 'Inactif'}</span>) }
  ];

  return (
    <div className="fiscal-years-page">
      <PageHeader
        title="Gestion des Annees Fiscales"
        subtitle="Annees de base (N-2, N-1, N) - Modele CDMT Djibouti"
        action={
          <Button onClick={handleCreate} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
            Nouvelle Annee Fiscale
          </Button>
        }
      />

      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="close-btn">&times;</button>
        </div>
      )}

      <div className="base-years-section">
        <div className="base-years-header">
          <h3>Annees de Base - Modele CDMT</h3>
          <div className="base-year-selector">
            <label htmlFor="baseYearSelect">Annee de reference (N) :</label>
            <select id="baseYearSelect" value={baseYear} onChange={(e) => setBaseYear(parseInt(e.target.value))}>
              {[...Array(10)].map((_, i) => {
                const year = new Date().getFullYear() - 3 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="base-years-grid">
          {baseYearConfig.map((config) => {
            const fiscalYear = getYearStatus(config.year);
            const isConfigured = !!fiscalYear;
            return (
              <div key={config.label} className={`base-year-card ${isConfigured ? 'configured' : 'not-configured'} ${config.type.toLowerCase()}`}>
                <div className="base-year-label">{config.label}</div>
                <div className="base-year-value">{config.year}</div>
                <div className="base-year-description">{config.description}</div>
                {isConfigured ? (
                  <div className="base-year-status">
                    <span className={`status-indicator ${fiscalYear.isClosed ? 'closed' : 'open'}`}>{fiscalYear.isClosed ? 'Cloturee' : 'Ouverte'}</span>
                    <button className="view-details-btn" onClick={() => handleView(fiscalYear)}>Voir details</button>
                  </div>
                ) : (
                  <div className="base-year-status">
                    <span className="status-indicator missing">Non configuree</span>
                    <button className="create-btn" onClick={() => handleCreateBaseYear(config)} disabled={submitting}>{submitting ? 'Creation...' : 'Creer'}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="base-years-info">
          <div className="info-item"><span className="info-label">N-2 :</span><span className="info-value">Donnees execution annee N-2 (cloturee)</span></div>
          <div className="info-item"><span className="info-label">N-1 :</span><span className="info-value">Donnees execution annee N-1 (en cours)</span></div>
          <div className="info-item"><span className="info-label">N :</span><span className="info-value">Loi de Finances Initiale (LFI) annee en cours</span></div>
        </div>
      </div>

      <div className="fiscal-years-table-section">
        <h3>Liste des Annees Fiscales</h3>
        <DataTable data={years} columns={columns} loading={loading} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="Aucune annee fiscale enregistree" />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingYear ? 'Details Annee Fiscale' : editingYear ? 'Modifier Annee Fiscale' : 'Nouvelle Annee Fiscale'}
        footer={
          viewingYear ? (
            <Button onClick={() => setIsModalOpen(false)}>Fermer</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button onClick={saveYear} loading={submitting}>{editingYear ? 'Mettre a jour' : 'Creer'}</Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="year-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Annee *</label>
              <input id="year" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })} required min="2000" max="2100" placeholder="Ex: 2024" disabled={!!viewingYear} />
            </div>
            <div className="form-group">
              <label htmlFor="name">Nom *</label>
              <input id="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Annee Fiscale 2024" disabled={!!viewingYear} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Date de debut *</label>
              <input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required disabled={!!viewingYear} />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">Date de fin *</label>
              <input id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required disabled={!!viewingYear} />
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} disabled={!!viewingYear} />
              <span>Actif</span>
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteDialog.open}
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, year: null, loading: false, error: null, constraints: null })}
        title="Confirmer la suppression"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteDialog({ open: false, year: null, loading: false, error: null, constraints: null })} disabled={deleteDialog.loading}>Annuler</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleteDialog.loading} disabled={deleteDialog.loading || hasConstraints()}>Supprimer</Button>
          </>
        }
      >
        <div className="delete-dialog-content">
          {deleteDialog.error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {deleteDialog.error}
            </div>
          )}

          <p>Etes-vous sur de vouloir supprimer l'annee fiscale <strong>{deleteDialog.year?.year}</strong> ?</p>

          {deleteDialog.loading && !deleteDialog.constraints && (
            <div className="loading-constraints"><span className="spinner"></span> Verification des contraintes...</div>
          )}

          {hasConstraints() && (
            <div className="alert alert-error constraints-warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <strong>Suppression impossible - Donnees existantes:</strong>
                <ul>
                  {deleteDialog.constraints!.historicalData > 0 && (<li><strong>{deleteDialog.constraints!.historicalData} Donnee(s) historique(s)</strong> - Supprimez les donnees dans Donnees Historiques</li>)}
                  {deleteDialog.constraints!.budgetLines > 0 && (<li><strong>{deleteDialog.constraints!.budgetLines} Rubrique(s) budgetaire(s)</strong> - Cette annee contient des rubriques</li>)}
                </ul>
              </div>
            </div>
          )}

          {!hasConstraints() && deleteDialog.constraints && (
            <div className="alert alert-warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Cette action est irreversible.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default FiscalYears;
