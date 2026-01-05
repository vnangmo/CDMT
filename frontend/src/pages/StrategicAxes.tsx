import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import referentielService from '../services/referentiel.service';
import { StrategicAxis, CreateStrategicAxisDto, UpdateStrategicAxisDto } from '../types/referentiel.types';
import './StrategicAxes.css';

const StrategicAxes: React.FC = () => {
  const [axes, setAxes] = useState<StrategicAxis[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAxis, setEditingAxis] = useState<StrategicAxis | null>(null);
  const [viewingAxis, setViewingAxis] = useState<StrategicAxis | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateStrategicAxisDto>({
    code: '',
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadAxes();
  }, []);

  const loadAxes = async () => {
    try {
      setLoading(true);
      const data = await referentielService.getStrategicAxes();
      setAxes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des axes stratégiques:', error);
      setAxes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAxis(null);
    setViewingAxis(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleView = (axis: StrategicAxis) => {
    setViewingAxis(axis);
    setEditingAxis(null);
    setFormData({
      code: axis.code,
      name: axis.name,
      description: axis.description || '',
      isActive: axis.isActive
    });
    setIsModalOpen(true);
  };

  const handleEdit = (axis: StrategicAxis) => {
    setEditingAxis(axis);
    setViewingAxis(null);
    setFormData({
      code: axis.code,
      name: axis.name,
      description: axis.description || '',
      isActive: axis.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (axis: StrategicAxis) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'axe stratégique "${axis.name}" ?`)) {
      try {
        await referentielService.deleteStrategicAxis(axis.id);
        await loadAxes();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'axe stratégique');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAxis();
  };

  const saveAxis = async () => {
    setSubmitting(true);

    try {
      if (editingAxis) {
        await referentielService.updateStrategicAxis(editingAxis.id, formData as UpdateStrategicAxisDto);
      } else {
        await referentielService.createStrategicAxis(formData);
      }
      setIsModalOpen(false);
      await loadAxes();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement de l\'axe stratégique');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<StrategicAxis>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '15%'
    },
    {
      key: 'name',
      header: 'Nom',
      width: '35%'
    },
    {
      key: 'description',
      header: 'Description',
      width: '40%',
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
    <div className="strategic-axes-page">
      <PageHeader
        title="Gestion des Axes Stratégiques"
        subtitle="Classification fonctionnelle - REQ-REF-01"
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
            Nouvel Axe Stratégique
          </Button>
        }
      />

      <DataTable
        data={axes}
        columns={columns}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Aucun axe stratégique enregistré"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingAxis ? 'Détails de l\'Axe Stratégique' : editingAxis ? 'Modifier l\'Axe Stratégique' : 'Nouvel Axe Stratégique'}
        footer={
          viewingAxis ? (
            <Button onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveAxis} loading={submitting}>
                {editingAxis ? 'Mettre à jour' : 'Créer'}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="axis-form">
          <div className="form-group">
            <label htmlFor="code">Code *</label>
            <input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="Ex: AXE-01"
              disabled={!!viewingAxis}
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
              placeholder="Ex: Développement Économique"
              disabled={!!viewingAxis}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description de l'axe stratégique..."
              disabled={!!viewingAxis}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={!!viewingAxis}
              />
              <span>Actif</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StrategicAxes;
