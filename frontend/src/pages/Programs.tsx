import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import referentielService from '../services/referentiel.service';
import { Program, CreateProgramDto, UpdateProgramDto, Ministry } from '../types/referentiel.types';
import './Programs.css';

const Programs: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      console.error('Erreur lors du chargement des ministères:', error);
      setMinistries([]);
    }
  };

  const handleCreate = () => {
    setEditingProgram(null);
    setViewingProgram(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      ministryId: '',
      isActive: true
    });
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
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le programme "${program.name}" ?`)) {
      try {
        await referentielService.deleteProgram(program.id);
        await loadPrograms();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du programme');
      }
    }
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
      } else {
        await referentielService.createProgram(formData);
      }
      setIsModalOpen(false);
      await loadPrograms();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement du programme');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Program>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '15%'
    },
    {
      key: 'name',
      header: 'Nom',
      width: '25%'
    },
    {
      key: 'ministry',
      header: 'Ministère',
      width: '25%',
      render: (item) => item.ministry?.name || '-'
    },
    {
      key: 'description',
      header: 'Description',
      width: '25%',
      render: (item) => item.description || '-'
    },
    {
      key: 'isActive',
      header: 'Statut',
      width: '10%',
      render: (item) => (
        <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
          {item.isActive ? 'Actif' : 'Inactif'}
        </span>
      )
    }
  ];

  return (
    <div className="programs-page">
      <PageHeader
        title="Gestion des Programmes"
        subtitle="Classification par programme - REQ-REF-01"
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
            Nouveau Programme
          </Button>
        }
      />

      <DataTable
        data={programs}
        columns={columns}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Aucun programme enregistré"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingProgram ? 'Détails du Programme' : editingProgram ? 'Modifier le Programme' : 'Nouveau Programme'}
        footer={
          viewingProgram ? (
            <Button onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveProgram} loading={submitting}>
                {editingProgram ? 'Mettre à jour' : 'Créer'}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="program-form">
          <div className="form-group">
            <label htmlFor="code">Code *</label>
            <input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="Ex: PROG-001"
              disabled={!!viewingProgram}
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Nom *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ex: Programme de Développement Rural"
              disabled={!!viewingProgram}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ministryId">Ministère *</label>
            <select
              id="ministryId"
              value={formData.ministryId}
              onChange={(e) => setFormData({ ...formData, ministryId: e.target.value })}
              required
              disabled={!!viewingProgram}
            >
              <option value="">Sélectionner un ministère</option>
              {ministries.map((ministry) => (
                <option key={ministry.id} value={ministry.id}>
                  {ministry.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description du programme..."
              disabled={!!viewingProgram}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={!!viewingProgram}
              />
              <span>Actif</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Programs;
