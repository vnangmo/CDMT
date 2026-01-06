import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import referentielService from '../services/referentiel.service';
import api from '../config/api';
import { EconomicNature, CreateEconomicNatureDto, UpdateEconomicNatureDto } from '../types/referentiel.types';
import './EconomicNatures.css';

interface NatureConstraints {
  historicalData: number;
  budgetLines: number;
}

const EconomicNatures: React.FC = () => {
  const [natures, setNatures] = useState<EconomicNature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNature, setEditingNature] = useState<EconomicNature | null>(null);
  const [viewingNature, setViewingNature] = useState<EconomicNature | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    nature: EconomicNature | null;
    loading: boolean;
    error: string | null;
    constraints: NatureConstraints | null;
  }>({ open: false, nature: null, loading: false, error: null, constraints: null });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<CreateEconomicNatureDto>({
    code: '',
    name: '',
    type: 'EXPENSE',
    description: '',
    isActive: true
  });

  useEffect(() => { loadNatures(); }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadNatures = async () => {
    try {
      setLoading(true);
      const data = await referentielService.getEconomicNatures();
      setNatures(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setNatures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingNature(null);
    setViewingNature(null);
    setFormData({ code: '', name: '', type: 'EXPENSE', description: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleView = (nature: EconomicNature) => {
    setViewingNature(nature);
    setEditingNature(null);
    setFormData({
      code: nature.code,
      name: nature.name,
      type: nature.type,
      description: nature.description || '',
      isActive: nature.isActive
    });
    setIsModalOpen(true);
  };

  const handleEdit = (nature: EconomicNature) => {
    setEditingNature(nature);
    setViewingNature(null);
    setFormData({
      code: nature.code,
      name: nature.name,
      type: nature.type,
      description: nature.description || '',
      isActive: nature.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (nature: EconomicNature) => {
    setDeleteDialog({ open: true, nature, loading: true, error: null, constraints: null });

    try {
      const [historicalRes, budgetRes] = await Promise.all([
        api.get(`/trend-budgets/historical?economicNatureId=${nature.id}&limit=1`).catch(() => ({ data: { data: { total: 0 } } })),
        api.get(`/budget-lines?economicNatureId=${nature.id}&limit=1`).catch(() => ({ data: { data: { total: 0 } } }))
      ]);

      const constraints: NatureConstraints = {
        historicalData: historicalRes.data.data?.pagination?.total || historicalRes.data.data?.data?.length || 0,
        budgetLines: budgetRes.data.data?.pagination?.total || budgetRes.data.data?.data?.length || 0
      };

      setDeleteDialog(prev => ({ ...prev, loading: false, constraints }));
    } catch (error) {
      setDeleteDialog(prev => ({ ...prev, loading: false, constraints: { historicalData: 0, budgetLines: 0 } }));
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.nature) return;
    setDeleteDialog(prev => ({ ...prev, loading: true, error: null }));

    try {
      await referentielService.deleteEconomicNature(deleteDialog.nature.id);
      setMessage({ type: 'success', text: 'Nature economique supprimee avec succes' });
      setDeleteDialog({ open: false, nature: null, loading: false, error: null, constraints: null });
      await loadNatures();
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
    await saveNature();
  };

  const saveNature = async () => {
    setSubmitting(true);
    try {
      if (editingNature) {
        await referentielService.updateEconomicNature(editingNature.id, formData as UpdateEconomicNatureDto);
        setMessage({ type: 'success', text: 'Nature economique mise a jour avec succes' });
      } else {
        await referentielService.createEconomicNature(formData);
        setMessage({ type: 'success', text: 'Nature economique creee avec succes' });
      }
      setIsModalOpen(false);
      await loadNatures();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<EconomicNature>[] = [
    { key: 'code', header: 'Code', width: '15%' },
    { key: 'name', header: 'Nom', width: '30%' },
    { key: 'type', header: 'Type', width: '15%', render: (item) => (
      <span className={`type-badge ${item.type === 'REVENUE' ? 'revenue' : 'expense'}`}>
        {item.type === 'REVENUE' ? 'Recette' : 'Depense'}
      </span>
    )},
    { key: 'description', header: 'Description', width: '30%', render: (item) => item.description || '-' },
    { key: 'isActive', header: 'Statut', width: '10%', render: (item) => (
      <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
        {item.isActive ? 'Actif' : 'Inactif'}
      </span>
    )}
  ];

  return (
    <div className="economic-natures-page">
      <PageHeader
        title="Nature des Depenses"
        subtitle="Classification des depenses par nature economique - Modele CDMT"
        action={
          <Button onClick={handleCreate} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
            Nouvelle Nature de Depense
          </Button>
        }
      />

      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="close-btn">&times;</button>
        </div>
      )}

      <DataTable data={natures} columns={columns} loading={loading} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="Aucune nature economique enregistree" />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingNature ? 'Details de la Nature Economique' : editingNature ? 'Modifier la Nature Economique' : 'Nouvelle Nature de Depense'}
        footer={
          viewingNature ? (
            <Button onClick={() => setIsModalOpen(false)}>Fermer</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button onClick={saveNature} loading={submitting}>{editingNature ? 'Mettre a jour' : 'Creer'}</Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="nature-form">
          <div className="form-group">
            <label htmlFor="code">Code *</label>
            <input id="code" type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required placeholder="Ex: 21" disabled={!!viewingNature} />
          </div>
          <div className="form-group">
            <label htmlFor="name">Nom *</label>
            <input id="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Personnel" disabled={!!viewingNature} />
          </div>
          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select id="type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'REVENUE' | 'EXPENSE' })} required disabled={!!viewingNature}>
              <option value="EXPENSE">Depense</option>
              <option value="REVENUE">Recette</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Description de la nature economique..." disabled={!!viewingNature} />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} disabled={!!viewingNature} />
              <span>Actif</span>
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteDialog.open}
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, nature: null, loading: false, error: null, constraints: null })}
        title="Confirmer la suppression"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteDialog({ open: false, nature: null, loading: false, error: null, constraints: null })} disabled={deleteDialog.loading}>Annuler</Button>
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

          <p>Etes-vous sur de vouloir supprimer la nature economique <strong>"{deleteDialog.nature?.name}"</strong> ?</p>

          {deleteDialog.loading && !deleteDialog.constraints && (
            <div className="loading-constraints"><span className="spinner"></span> Verification des contraintes...</div>
          )}

          {hasConstraints() && (
            <div className="alert alert-error constraints-warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <strong>Suppression impossible - Elements lies:</strong>
                <ul>
                  {deleteDialog.constraints!.budgetLines > 0 && (<li><strong>{deleteDialog.constraints!.budgetLines} Rubrique(s) budgetaire(s)</strong> - Cette nature est affectee a des rubriques</li>)}
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

export default EconomicNatures;
