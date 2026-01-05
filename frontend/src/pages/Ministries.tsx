import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import referentielService from '../services/referentiel.service';
import { Ministry, CreateMinistryDto, UpdateMinistryDto } from '../types/referentiel.types';
import './Ministries.css';

const Ministries: React.FC = () => {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [viewingMinistry, setViewingMinistry] = useState<Ministry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateMinistryDto>({
    code: '',
    name: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadMinistries();
  }, []);

  const loadMinistries = async () => {
    try {
      setLoading(true);
      const data = await referentielService.getMinistries();
      setMinistries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des ministères:', error);
      setMinistries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingMinistry(null);
    setViewingMinistry(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      isActive: true
    });
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
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le ministère "${ministry.name}" ?`)) {
      try {
        await referentielService.deleteMinistry(ministry.id);
        await loadMinistries();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du ministère');
      }
    }
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
      } else {
        await referentielService.createMinistry(formData);
      }
      setIsModalOpen(false);
      await loadMinistries();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement du ministère');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Ministry>[] = [
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
      width: '35%',
      render: (item) => item.description || '-'
    },
    {
      key: 'isActive',
      header: 'Statut',
      width: '15%',
      render: (item) => (
        <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
          {item.isActive ? 'Actif' : 'Inactif'}
        </span>
      )
    }
  ];

  return (
    <div className="ministries-page">
      <PageHeader
        title="Gestion des Ministères"
        subtitle="Liste des ministères et départements du gouvernement"
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
            Nouveau Ministère
          </Button>
        }
      />

      <DataTable
        data={ministries}
        columns={columns}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Aucun ministère enregistré"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingMinistry ? 'Détails du Ministère' : editingMinistry ? 'Modifier le Ministère' : 'Nouveau Ministère'}
        footer={
          viewingMinistry ? (
            <Button onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveMinistry} loading={submitting}>
                {editingMinistry ? 'Mettre à jour' : 'Créer'}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="ministry-form">
          <div className="form-group">
            <label htmlFor="code">Code *</label>
            <input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="Ex: MIN-FIN"
              disabled={!!viewingMinistry}
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
              placeholder="Ex: Ministère des Finances"
              disabled={!!viewingMinistry}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description du ministère..."
              disabled={!!viewingMinistry}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={!!viewingMinistry}
              />
              <span>Actif</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Ministries;
