import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import referentielService from '../services/referentiel.service';
import api from '../config/api';
import { FundingSource, CreateFundingSourceDto, UpdateFundingSourceDto } from '../types/referentiel.types';
import './FundingSources.css';

interface SourceConstraints {
  budgetLines: number;
  historicalData: number;
}

const FundingSources: React.FC = () => {
  const [sources, setSources] = useState<FundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<FundingSource | null>(null);
  const [viewingSource, setViewingSource] = useState<FundingSource | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    source: FundingSource | null;
    loading: boolean;
    error: string | null;
    constraints: SourceConstraints | null;
  }>({ open: false, source: null, loading: false, error: null, constraints: null });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<CreateFundingSourceDto>({
    code: '',
    name: '',
    type: 'INTERNAL',
    description: '',
    isActive: true
  });

  useEffect(() => { loadSources(); }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await referentielService.getFundingSources();
      setSources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSource(null);
    setViewingSource(null);
    setFormData({ code: '', name: '', type: 'INTERNAL', description: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleView = (source: FundingSource) => {
    setViewingSource(source);
    setEditingSource(null);
    setFormData({
      code: source.code,
      name: source.name,
      type: source.type,
      description: source.description || '',
      isActive: source.isActive
    });
    setIsModalOpen(true);
  };

  const handleEdit = (source: FundingSource) => {
    setEditingSource(source);
    setViewingSource(null);
    setFormData({
      code: source.code,
      name: source.name,
      type: source.type,
      description: source.description || '',
      isActive: source.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (source: FundingSource) => {
    setDeleteDialog({ open: true, source, loading: true, error: null, constraints: null });

    try {
      const [budgetRes, historicalRes] = await Promise.all([
        api.get(`/budget-lines?fundingSourceId=${source.id}&limit=1`).catch(() => ({ data: { data: { total: 0 } } })),
        api.get(`/trend-budgets/historical?fundingSourceId=${source.id}&limit=1`).catch(() => ({ data: { data: { total: 0 } } }))
      ]);

      const constraints: SourceConstraints = {
        budgetLines: budgetRes.data.data?.pagination?.total || budgetRes.data.data?.data?.length || 0,
        historicalData: historicalRes.data.data?.pagination?.total || historicalRes.data.data?.data?.length || 0
      };

      setDeleteDialog(prev => ({ ...prev, loading: false, constraints }));
    } catch (error) {
      setDeleteDialog(prev => ({ ...prev, loading: false, constraints: { budgetLines: 0, historicalData: 0 } }));
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.source) return;
    setDeleteDialog(prev => ({ ...prev, loading: true, error: null }));

    try {
      await referentielService.deleteFundingSource(deleteDialog.source.id);
      setMessage({ type: 'success', text: 'Source de financement supprimee avec succes' });
      setDeleteDialog({ open: false, source: null, loading: false, error: null, constraints: null });
      await loadSources();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erreur lors de la suppression';
      setDeleteDialog(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  const hasConstraints = (): boolean => {
    const c = deleteDialog.constraints;
    return !!(c && (c.budgetLines > 0 || c.historicalData > 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSource();
  };

  const saveSource = async () => {
    setSubmitting(true);
    try {
      if (editingSource) {
        await referentielService.updateFundingSource(editingSource.id, formData as UpdateFundingSourceDto);
        setMessage({ type: 'success', text: 'Source de financement mise a jour avec succes' });
      } else {
        await referentielService.createFundingSource(formData);
        setMessage({ type: 'success', text: 'Source de financement creee avec succes' });
      }
      setIsModalOpen(false);
      await loadSources();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<FundingSource>[] = [
    { key: 'code', header: 'Code', width: '15%' },
    { key: 'name', header: 'Nom', width: '25%' },
    { key: 'type', header: 'Type', width: '15%', render: (item) => {
      const typeMap: Record<string, string> = { INTERNAL: 'Interne', EXTERNAL: 'Externe', LOAN: 'Pret', GRANT: 'Don' };
      return typeMap[item.type];
    }},
    { key: 'description', header: 'Description', width: '30%', render: (item) => item.description || '-' },
    { key: 'isActive', header: 'Statut', width: '10%', render: (item) => (
      <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
        {item.isActive ? 'Actif' : 'Inactif'}
      </span>
    )}
  ];

  return (
    <div className="funding-sources-page">
      <PageHeader
        title="Gestion des Sources de Financement"
        subtitle="Classification par source de financement - REQ-REF-01"
        action={
          <Button onClick={handleCreate} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
            Nouvelle Source de Financement
          </Button>
        }
      />

      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="close-btn">&times;</button>
        </div>
      )}

      <DataTable data={sources} columns={columns} loading={loading} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="Aucune source de financement enregistree" />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingSource ? 'Details de la Source de Financement' : editingSource ? 'Modifier la Source de Financement' : 'Nouvelle Source de Financement'}
        footer={
          viewingSource ? (
            <Button onClick={() => setIsModalOpen(false)}>Fermer</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button onClick={saveSource} loading={submitting}>{editingSource ? 'Mettre a jour' : 'Creer'}</Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="source-form">
          <div className="form-group">
            <label htmlFor="code">Code *</label>
            <input id="code" type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required placeholder="Ex: FIN-01" disabled={!!viewingSource} />
          </div>
          <div className="form-group">
            <label htmlFor="name">Nom *</label>
            <input id="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Budget National" disabled={!!viewingSource} />
          </div>
          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select id="type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INTERNAL' | 'EXTERNAL' | 'LOAN' | 'GRANT' })} required disabled={!!viewingSource}>
              <option value="INTERNAL">Interne</option>
              <option value="EXTERNAL">Externe</option>
              <option value="LOAN">Pret</option>
              <option value="GRANT">Don</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Description de la source de financement..." disabled={!!viewingSource} />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} disabled={!!viewingSource} />
              <span>Actif</span>
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteDialog.open}
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, source: null, loading: false, error: null, constraints: null })}
        title="Confirmer la suppression"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteDialog({ open: false, source: null, loading: false, error: null, constraints: null })} disabled={deleteDialog.loading}>Annuler</Button>
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

          <p>Etes-vous sur de vouloir supprimer la source de financement <strong>"{deleteDialog.source?.name}"</strong> ?</p>

          {deleteDialog.loading && !deleteDialog.constraints && (
            <div className="loading-constraints"><span className="spinner"></span> Verification des contraintes...</div>
          )}

          {hasConstraints() && (
            <div className="alert alert-error constraints-warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <strong>Suppression impossible - Elements lies:</strong>
                <ul>
                  {deleteDialog.constraints!.budgetLines > 0 && (<li><strong>{deleteDialog.constraints!.budgetLines} Rubrique(s) budgetaire(s)</strong> - Cette source est affectee a des rubriques</li>)}
                  {deleteDialog.constraints!.historicalData > 0 && (<li><strong>{deleteDialog.constraints!.historicalData} Donnee(s) historique(s)</strong> - Supprimez les donnees historiques</li>)}
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

export default FundingSources;
