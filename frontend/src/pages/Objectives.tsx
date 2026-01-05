import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import programmaticService from '../services/programmatic.service';
import referentielService from '../services/referentiel.service';
import {
  Objective,
  CreateObjectiveDto,
  UpdateObjectiveDto
} from '../types/programmatic.types';
import { Program } from '../types/referentiel.types';
import './Objectives.css';

const Objectives: React.FC = () => {
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [viewingObjective, setViewingObjective] = useState<Objective | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [filterObjectiveType, setFilterObjectiveType] = useState<string>('');
  const [filterProgramId, setFilterProgramId] = useState<string>('');

  const [formData, setFormData] = useState<CreateObjectiveDto>({
    code: '',
    name: '',
    description: '',
    entityType: 'PROGRAM',
    programId: '',
    objectiveType: 'STRATEGIC',
    priority: 1,
    isActive: true
  });

  useEffect(() => {
    loadObjectives();
    loadPrograms();
  }, [filterEntityType, filterObjectiveType, filterProgramId]);

  const loadObjectives = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterEntityType) filters.entityType = filterEntityType;
      if (filterObjectiveType) filters.objectiveType = filterObjectiveType;
      if (filterProgramId) filters.programId = filterProgramId;

      const result = await programmaticService.getObjectives(filters);
      setObjectives(Array.isArray(result.objectives) ? result.objectives : []);
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs:', error);
      setObjectives([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const data = await referentielService.getPrograms();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des programmes:', error);
      setPrograms([]);
    }
  };

  const handleCreate = () => {
    setEditingObjective(null);
    setViewingObjective(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      entityType: 'PROGRAM',
      programId: '',
      objectiveType: 'STRATEGIC',
      priority: 1,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleView = (objective: Objective) => {
    setViewingObjective(objective);
    setEditingObjective(null);
    setFormData({
      code: objective.code,
      name: objective.name,
      description: objective.description || '',
      entityType: objective.entityType,
      programId: objective.programId || '',
      actionId: objective.actionId || '',
      activityId: objective.activityId || '',
      objectiveType: objective.objectiveType as any || 'STRATEGIC',
      priority: objective.priority || 1,
      isActive: objective.isActive
    });
    setIsModalOpen(true);
  };

  const handleEdit = (objective: Objective) => {
    setEditingObjective(objective);
    setViewingObjective(null);
    setFormData({
      code: objective.code,
      name: objective.name,
      description: objective.description || '',
      entityType: objective.entityType,
      programId: objective.programId || '',
      actionId: objective.actionId || '',
      activityId: objective.activityId || '',
      objectiveType: objective.objectiveType as any || 'STRATEGIC',
      priority: objective.priority || 1,
      isActive: objective.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (objective: Objective) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'objectif "${objective.name}" ?`)) {
      try {
        await programmaticService.deleteObjective(objective.id);
        await loadObjectives();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'objectif');
      }
    }
  };

  const handleViewIndicators = (objective: Objective) => {
    navigate(`/indicators?objectiveId=${objective.id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveObjective();
  };

  const saveObjective = async () => {
    setSubmitting(true);

    try {
      // Clean up entity IDs based on entityType
      const cleanFormData = { ...formData };
      if (cleanFormData.entityType === 'PROGRAM') {
        delete cleanFormData.actionId;
        delete cleanFormData.activityId;
      } else if (cleanFormData.entityType === 'ACTION') {
        delete cleanFormData.programId;
        delete cleanFormData.activityId;
      } else if (cleanFormData.entityType === 'ACTIVITY') {
        delete cleanFormData.programId;
        delete cleanFormData.actionId;
      }

      if (editingObjective) {
        await programmaticService.updateObjective(editingObjective.id, cleanFormData as UpdateObjectiveDto);
      } else {
        await programmaticService.createObjective(cleanFormData);
      }
      setIsModalOpen(false);
      await loadObjectives();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement de l\'objectif');
    } finally {
      setSubmitting(false);
    }
  };

  const getEntityTypeBadge = (entityType: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      PROGRAM: { color: 'primary', label: 'Programme' },
      ACTION: { color: 'info', label: 'Action' },
      ACTIVITY: { color: 'warning', label: 'Activité' }
    };
    const badge = badges[entityType] || { color: 'secondary', label: entityType };
    return <span className={`badge badge-${badge.color}`}>{badge.label}</span>;
  };

  const getObjectiveTypeBadge = (objectiveType: string | null | undefined) => {
    if (!objectiveType) return '-';
    const badges: Record<string, { color: string; label: string }> = {
      STRATEGIC: { color: 'success', label: 'Stratégique' },
      OPERATIONAL: { color: 'info', label: 'Opérationnel' },
      SPECIFIC: { color: 'warning', label: 'Spécifique' }
    };
    const badge = badges[objectiveType] || { color: 'secondary', label: objectiveType };
    return <span className={`badge badge-${badge.color}`}>{badge.label}</span>;
  };

  const columns: Column<Objective>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '12%'
    },
    {
      key: 'name',
      header: 'Nom',
      width: '25%'
    },
    {
      key: 'entityType',
      header: 'Entité',
      width: '12%',
      render: (item) => getEntityTypeBadge(item.entityType)
    },
    {
      key: 'objectiveType',
      header: 'Type',
      width: '13%',
      render: (item) => getObjectiveTypeBadge(item.objectiveType)
    },
    {
      key: 'program',
      header: 'Programme/Action/Activité',
      width: '20%',
      render: (item) => {
        if (item.program) return item.program.name;
        if (item.action) return item.action.name;
        if (item.activity) return item.activity.name;
        return '-';
      }
    },
    {
      key: 'priority',
      header: 'Priorité',
      width: '8%',
      render: (item) => item.priority || '-'
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
    <div className="objectives-page">
      <PageHeader
        title="Gestion des Objectifs"
        subtitle="Structure programmatique - Objectifs et cibles - REQ-PROG-01"
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
            Nouvel Objectif
          </Button>
        }
      />

      <div className="filters-section">
        <div className="filter-group">
          <label>Type d'entité</label>
          <select value={filterEntityType} onChange={(e) => setFilterEntityType(e.target.value)}>
            <option value="">Tous</option>
            <option value="PROGRAM">Programme</option>
            <option value="ACTION">Action</option>
            <option value="ACTIVITY">Activité</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type d'objectif</label>
          <select value={filterObjectiveType} onChange={(e) => setFilterObjectiveType(e.target.value)}>
            <option value="">Tous</option>
            <option value="STRATEGIC">Stratégique</option>
            <option value="OPERATIONAL">Opérationnel</option>
            <option value="SPECIFIC">Spécifique</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Programme</label>
          <select value={filterProgramId} onChange={(e) => setFilterProgramId(e.target.value)}>
            <option value="">Tous</option>
            {programs.map(program => (
              <option key={program.id} value={program.id}>{program.name}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        data={objectives}
        columns={columns}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Aucun objectif enregistré"
        customActions={(item: Objective) => (
          <button
            onClick={() => handleViewIndicators(item)}
            className="btn-icon"
            title="Voir les indicateurs"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </button>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingObjective ? 'Détails de l\'Objectif' : editingObjective ? 'Modifier l\'Objectif' : 'Nouvel Objectif'}
        footer={
          viewingObjective ? (
            <Button onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveObjective} loading={submitting}>
                {editingObjective ? 'Mettre à jour' : 'Créer'}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="objective-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="code">Code *</label>
              <input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                placeholder="Ex: OBJ-001"
                disabled={!!viewingObjective}
              />
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priorité</label>
              <input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                placeholder="1-10"
                disabled={!!viewingObjective}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">Nom *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ex: Améliorer l'accès aux soins de santé"
              disabled={!!viewingObjective}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description détaillée de l'objectif..."
              disabled={!!viewingObjective}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="entityType">Type d'entité *</label>
              <select
                id="entityType"
                value={formData.entityType}
                onChange={(e) => setFormData({ ...formData, entityType: e.target.value as any })}
                required
                disabled={!!viewingObjective || !!editingObjective}
              >
                <option value="PROGRAM">Programme</option>
                <option value="ACTION">Action</option>
                <option value="ACTIVITY">Activité</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="objectiveType">Type d'objectif *</label>
              <select
                id="objectiveType"
                value={formData.objectiveType}
                onChange={(e) => setFormData({ ...formData, objectiveType: e.target.value as any })}
                required
                disabled={!!viewingObjective}
              >
                <option value="STRATEGIC">Stratégique</option>
                <option value="OPERATIONAL">Opérationnel</option>
                <option value="SPECIFIC">Spécifique</option>
              </select>
            </div>
          </div>

          {formData.entityType === 'PROGRAM' && (
            <div className="form-group">
              <label htmlFor="programId">Programme *</label>
              <select
                id="programId"
                value={formData.programId}
                onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                required
                disabled={!!viewingObjective}
              >
                <option value="">Sélectionner un programme</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </div>
          )}

          {formData.entityType === 'ACTION' && (
            <div className="form-group">
              <label htmlFor="actionId">Action *</label>
              <input
                id="actionId"
                type="text"
                value={formData.actionId || ''}
                onChange={(e) => setFormData({ ...formData, actionId: e.target.value })}
                required
                placeholder="ID de l'action"
                disabled={!!viewingObjective}
              />
              <small className="form-hint">Pour l'instant, saisir l'ID de l'action manuellement</small>
            </div>
          )}

          {formData.entityType === 'ACTIVITY' && (
            <div className="form-group">
              <label htmlFor="activityId">Activité *</label>
              <input
                id="activityId"
                type="text"
                value={formData.activityId || ''}
                onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                required
                placeholder="ID de l'activité"
                disabled={!!viewingObjective}
              />
              <small className="form-hint">Pour l'instant, saisir l'ID de l'activité manuellement</small>
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={!!viewingObjective}
              />
              Actif
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Objectives;
