import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import referentielService from '../services/referentiel.service';
import api from '../config/api';
import { Program, CreateProgramDto, UpdateProgramDto, Ministry } from '../types/referentiel.types';
import './Programs.css';

interface ProgramConstraints {
  actions: number;
  objectives: number;
  indicators: number;
}

const Programs: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    program: Program | null;
    loading: boolean;
    error: string | null;
    constraints: ProgramConstraints | null;
  }>({ open: false, program: null, loading: false, error: null, constraints: null });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<CreateProgramDto>({
    code: '',
    name: '',
    description: '',
    ministryId: '',
    isActive: true
  });

  useEffect(() => {
    loadPrograms();
    loadMinistries();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const data = await referentielService.getPrograms();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des programmes:', error);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMinistries = async () => {
    try {
      const data = await referentielService.getMinistries();
      setMinistries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des ministeres:', error);
      setMinistries([]);
    }
  };

  const handleCreate = () => {
    setEditingProgram(null);
    setViewingProgram(null);
    setFormData({ code: '', name: '', description: '', ministryId: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleView = (program: Program) => {
    setViewingProgram(program);
    setEditingProgram(null);
    setFormData({
      code: program.code,
      name: program.name,
      description: program.description || '',
      ministryId: program.ministryId,
      isActive: program.isActive
    });
    setIsModalOpen(true);
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setViewingProgram(null);
    setFormData({
      code: program.code,
      name: program.name,
      description: program.description || '',
      ministryId: program.ministryId,
      isActive: program.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (program: Program) => {
    setDeleteDialog({ open: true, program, loading: true, error: null, constraints: null });

    try {
      const [actionsRes, objectivesRes, indicatorsRes] = await Promise.all([
        api.get(`/programmatic-structure/actions?programId=${program.id}&isActive=true&limit=1`).catch(() => ({ data: { data: { total: 0 } } })),
        api.get(`/objectives?programId=${program.id}&limit=1`).catch(() => ({ data: { data: { total: 0 } } })),
        api.get(`/indicators?programId=${program.id}&limit=1`).catch(() => ({ data: { data: { total: 0 } } }))
      ]);

      const constraints: ProgramConstraints = {
        actions: actionsRes.data.data?.pagination?.total || actionsRes.data.data?.data?.length || actionsRes.data.data?.length || 0,
        objectives: objectivesRes.data.data?.pagination?.total || objectivesRes.data.data?.data?.length || 0,
        indicators: indicatorsRes.data.data?.pagination?.total || indicatorsRes.data.data?.data?.length || 0
      };

      setDeleteDialog(prev => ({ ...prev, loading: false, constraints }));
    } catch (error) {
      setDeleteDialog(prev => ({ ...prev, loading: false, constraints: { actions: 0, objectives: 0, indicators: 0 } }));
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.program) return;
    setDeleteDialog(prev => ({ ...prev, loading: true, error: null }));

    try {
      await referentielService.deleteProgram(deleteDialog.program.id);
      setMessage({ type: 'success', text: 'Programme supprime avec succes' });
      setDeleteDialog({ open: false, program: null, loading: false, error: null, constraints: null });
      await loadPrograms();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Erreur lors de la suppression';
      setDeleteDialog(prev => ({ ...prev, loading: false, error: msg }));
    }
  };

  const hasConstraints = (): boolean => {
    const c = deleteDialog.constraints;
    return !!(c && (c.actions > 0 || c.objectives > 0 || c.indicators > 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProgram();
  };

  const saveProgram = async () => {
    setSubmitting(true);
    try {
      if (editingProgram) {
        await referentielService.updateProgram(editingProgram.id, formData as UpdateProgramDto);
        setMessage({ type: 'success', text: 'Programme mis a jour avec succes' });
      } else {
        await referentielService.createProgram(formData);
        setMessage({ type: 'success', text: 'Programme cree avec succes' });
      }
      setIsModalOpen(false);
      await loadPrograms();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Program>[] = [
    { key: 'code', header: 'Code', width: '15%' },
    { key: 'name', header: 'Nom', width: '25%' },
    { key: 'ministry', header: 'Ministere', width: '25%', render: (item) => item.ministry?.name || '-' },
    { key: 'description', header: 'Description', width: '25%', render: (item) => item.description || '-' },
    { key: 'isActive', header: 'Statut', width: '10%', render: (item) => (
      <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
        {item.isActive ? 'Actif' : 'Inactif'}
      </span>
    )}
  ];

  return (
    <div className="programs-page">
      <PageHeader
        title="Gestion des Programmes"
        subtitle="Classification par programme - REQ-REF-01"
        action={
          <Button onClick={handleCreate} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
            Nouveau Programme
          </Button>
        }
      />

      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="close-btn">&times;</button>
        </div>
      )}

      <DataTable data={programs} columns={columns} loading={loading} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="Aucun programme enregistre" />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingProgram ? 'Details du Programme' : editingProgram ? 'Modifier le Programme' : 'Nouveau Programme'}
        footer={
          viewingProgram ? (
            <Button onClick={() => setIsModalOpen(false)}>Fermer</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
              <Button onClick={saveProgram} loading={submitting}>{editingProgram ? 'Mettre a jour' : 'Creer'}</Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="program-form">
          <div className="form-group">
            <label htmlFor="code">Code *</label>
            <input id="code" type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required placeholder="Ex: PROG-001" disabled={!!viewingProgram} />
          </div>
          <div className="form-group">
            <label htmlFor="name">Nom *</label>
            <input id="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Programme de Developpement Rural" disabled={!!viewingProgram} />
          </div>
          <div className="form-group">
            <label htmlFor="ministryId">Ministere *</label>
            <select id="ministryId" value={formData.ministryId} onChange={(e) => setFormData({ ...formData, ministryId: e.target.value })} required disabled={!!viewingProgram}>
              <option value="">Selectionner un ministere</option>
              {ministries.map((ministry) => (<option key={ministry.id} value={ministry.id}>{ministry.name}</option>))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Description du programme..." disabled={!!viewingProgram} />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} disabled={!!viewingProgram} />
              <span>Actif</span>
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteDialog.open}
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, program: null, loading: false, error: null, constraints: null })}
        title="Confirmer la suppression"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteDialog({ open: false, program: null, loading: false, error: null, constraints: null })} disabled={deleteDialog.loading}>Annuler</Button>
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

          <p>Etes-vous sur de vouloir supprimer le programme <strong>"{deleteDialog.program?.name}"</strong> ?</p>

          {deleteDialog.loading && !deleteDialog.constraints && (
            <div className="loading-constraints"><span className="spinner"></span> Verification des contraintes...</div>
          )}

          {hasConstraints() && (
            <div className="alert alert-error constraints-warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <strong>Suppression impossible - Elements lies:</strong>
                <ul>
                  {deleteDialog.constraints!.actions > 0 && (<li><strong>{deleteDialog.constraints!.actions} Action(s)</strong> - Supprimez d'abord les actions</li>)}
                  {deleteDialog.constraints!.objectives > 0 && (<li><strong>{deleteDialog.constraints!.objectives} Objectif(s)</strong> - Supprimez les objectifs</li>)}
                  {deleteDialog.constraints!.indicators > 0 && (<li><strong>{deleteDialog.constraints!.indicators} Indicateur(s)</strong> - Supprimez les indicateurs</li>)}
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

export default Programs;
