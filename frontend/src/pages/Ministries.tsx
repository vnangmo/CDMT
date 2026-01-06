import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import referentielService from '../services/referentiel.service';
import api from '../config/api';
import { Ministry, CreateMinistryDto, UpdateMinistryDto } from '../types/referentiel.types';
import './Ministries.css';

interface MinistryConstraints {
  programs: number;
  users: number;
  historicalData: number;
}

const Ministries: React.FC = () => {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [viewingMinistry, setViewingMinistry] = useState<Ministry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    ministry: Ministry | null;
    loading: boolean;
    error: string | null;
    constraints: MinistryConstraints | null;
  }>({ open: false, ministry: null, loading: false, error: null, constraints: null });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<CreateMinistryDto>({
    code: '',
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => { loadMinistries(); }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadMinistries = async () => {
    try {
      setLoading(true);
      const data = await referentielService.getMinistries();
      setMinistries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setMinistries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingMinistry(null);
    setViewingMinistry(null);
    setFormData({ code: '', name: '', description: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleView = (ministry: Ministry) => {
    setViewingMinistry(ministry);
    setEditingMinistry(null);
    setFormData({
      code: ministry.code,
      name: ministry.name,
      description: ministry.description || '',
      isActive: ministry.isActive
    });
    setIsModalOpen(true);
  };

  const handleEdit = (ministry: Ministry) => {
    setEditingMinistry(ministry);
    setViewingMinistry(null);
    setFormData({
      code: ministry.code,
      name: ministry.name,
      description: ministry.description || '',
      isActive: ministry.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (ministry: Ministry) => {
    setDeleteDialog({ open: true, ministry, loading: true, error: null, constraints: null });

    try {
      const [programsRes, usersRes, historicalRes] = await Promise.all([
        api.get(`/programmatic-structure/programs?ministryId=${ministry.id}&limit=1`).catch(() => ({ data: { data: { total: 0 } } })),
        api.get(`/users?ministryId=${ministry.id}&limit=1`).catch(() => ({ data: { data: { total: 0 } } })),
        api.get(`/trend-budgets/historical?ministryId=${ministry.id}&limit=1`).catch(() => ({ data: { data: { total: 0 } } }))
      ]);

      const constraints: MinistryConstraints = {
        programs: programsRes.data.data?.pagination?.total || programsRes.data.data?.data?.length || 0,
        users: usersRes.data.data?.pagination?.total || usersRes.data.data?.data?.length || 0,
        historicalData: historicalRes.data.data?.pagination?.total || historicalRes.data.data?.data?.length || 0
      };

      setDeleteDialog(prev => ({ ...prev, loading: false, constraints }));
    } catch (error) {
      setDeleteDialog(prev => ({ ...prev, loading: false, constraints: { programs: 0, users: 0, historicalData: 0 } }));
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.ministry) return;
    setDeleteDialog(prev => ({ ...prev, loading: true, error: null }));

    try {
      await referentielService.deleteMinistry(deleteDialog.ministry.id);
      setMessage({ type: 'success', text: 'Ministere supprime avec succes' });
      setDeleteDialog({ open: false, ministry: null, loading: false, error: null, constraints: null });
      await loadMinistries();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erreur lors de la suppression';
      setDeleteDialog(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  const hasConstraints = (): boolean => {
    const c = deleteDialog.constraints;
    return !!(c && (c.programs > 0 || c.users > 0 || c.historicalData > 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMinistry();
  };

  const saveMinistry = async () => {
    setSubmitting(true);
    try {
      if (editingMinistry) {
        await referentielService.updateMinistry(editingMinistry.id, formData as UpdateMinistryDto);
        setMessage({ type: 'success', text: 'Ministere mis a jour avec succes' });
      } else {
        await referentielService.createMinistry(formData);
        setMessage({ type: 'success', text: 'Ministere cree avec succes' });
      }
      setIsModalOpen(false);
      await loadMinistries();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Ministry>[] = [
    { key: 'code', header: 'Code', width: '15%' },
    { key: 'name', header: 'Nom', width: '35%' },
    { key: 'description', header: 'Description', width: '35%', render: (item) => item.description || '-' },
    { key: 'isActive', header: 'Statut', width: '15%', render: (item) => (
      <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
        {item.isActive ? 'Actif' : 'Inactif'}
      </span>
    )}
  ];

  return (
    <div className="ministries-page">
      <PageHeader
        title="Gestion des Ministeres"
        subtitle="Liste des ministeres et departements du gouvernement"
        action={
          <Button onClick={handleCreate} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
            Nouveau Ministere
          </Button>
        }
      />

      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="close-btn">&times;</button>
        </div>
      )}

      <DataTable data={ministries} columns={columns} loading={loading} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="Aucun ministere enregistre" />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingMinistry ? 'Details du Ministere' : editingMinistry ? 'Modifier le Ministere' : 'Nouveau Ministere'}
        footer={
          viewingMinistry ? (
            <Button onClick={() => setIsModalOpen(false)}>Fermer</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button onClick={saveMinistry} loading={submitting}>{editingMinistry ? 'Mettre a jour' : 'Creer'}</Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="ministry-form">
          <div className="form-group">
            <label htmlFor="code">Code *</label>
            <input id="code" type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required placeholder="Ex: MIN-FIN" disabled={!!viewingMinistry} />
          </div>
          <div className="form-group">
            <label htmlFor="name">Nom *</label>
            <input id="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Ministere des Finances" disabled={!!viewingMinistry} />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Description du ministere..." disabled={!!viewingMinistry} />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} disabled={!!viewingMinistry} />
              <span>Actif</span>
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteDialog.open}
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, ministry: null, loading: false, error: null, constraints: null })}
        title="Confirmer la suppression"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteDialog({ open: false, ministry: null, loading: false, error: null, constraints: null })} disabled={deleteDialog.loading}>Annuler</Button>
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

          <p>Etes-vous sur de vouloir supprimer le ministere <strong>"{deleteDialog.ministry?.name}"</strong> ?</p>

          {deleteDialog.loading && !deleteDialog.constraints && (
            <div className="loading-constraints"><span className="spinner"></span> Verification des contraintes...</div>
          )}

          {hasConstraints() && (
            <div className="alert alert-error constraints-warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <strong>Suppression impossible - Elements lies:</strong>
                <ul>
                  {deleteDialog.constraints!.programs > 0 && (<li><strong>{deleteDialog.constraints!.programs} Programme(s)</strong> - Supprimez d'abord les programmes</li>)}
                  {deleteDialog.constraints!.users > 0 && (<li><strong>{deleteDialog.constraints!.users} Utilisateur(s)</strong> - Reassignez les utilisateurs</li>)}
                  {deleteDialog.constraints!.historicalData > 0 && (<li><strong>{deleteDialog.constraints!.historicalData} Donnee(s) historique(s)</strong> - Supprimez les donnees</li>)}
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

export default Ministries;
