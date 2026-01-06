import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import referentielService from '../services/referentiel.service';
import { EconomicNature, CreateEconomicNatureDto, UpdateEconomicNatureDto } from '../types/referentiel.types';
import './EconomicNatures.css';

const EconomicNatures: React.FC = () => {
  const [natures, setNatures] = useState<EconomicNature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNature, setEditingNature] = useState<EconomicNature | null>(null);
  const [viewingNature, setViewingNature] = useState<EconomicNature | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateEconomicNatureDto>({
    code: '',
    name: '',
    type: 'EXPENSE',
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadNatures();
  }, []);

  const loadNatures = async () => {
    try {
      setLoading(true);
      const data = await referentielService.getEconomicNatures();
      setNatures(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des natures économiques:', error);
      setNatures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingNature(null);
    setViewingNature(null);
    setFormData({
      code: '',
      name: '',
      type: 'EXPENSE',
      description: '',
      isActive: true
    });
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
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la nature économique "${nature.name}" ?`)) {
      try {
        await referentielService.deleteEconomicNature(nature.id);
        await loadNatures();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la nature économique');
      }
    }
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
      } else {
        await referentielService.createEconomicNature(formData);
      }
      setIsModalOpen(false);
      await loadNatures();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement de la nature économique');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<EconomicNature>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '15%'
    },
    {
      key: 'name',
      header: 'Nom',
      width: '30%'
    },
    {
      key: 'type',
      header: 'Type',
      width: '15%',
      render: (item) => (
        <span className={`type-badge ${item.type === 'REVENUE' ? 'revenue' : 'expense'}`}>
          {item.type === 'REVENUE' ? 'Recette' : 'Dépense'}
        </span>
      )
    },
    {
      key: 'description',
      header: 'Description',
      width: '30%',
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
    <div className="economic-natures-page">
      <PageHeader
        title="Nature des Depenses"
        subtitle="Classification des depenses par nature economique - Modele CDMT"
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
            Nouvelle Nature de Depense
          </Button>
        }
      />

      <DataTable
        data={natures}
        columns={columns}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Aucune nature économique enregistrée"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingNature ? 'Détails de la Nature Économique' : editingNature ? 'Modifier la Nature Économique' : 'Nouvelle Nature de Depense'}
        footer={
          viewingNature ? (
            <Button onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveNature} loading={submitting}>
                {editingNature ? 'Mettre à jour' : 'Créer'}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="nature-form">
          <div className="form-group">
            <label htmlFor="code">Code *</label>
            <input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="Ex: 21"
              disabled={!!viewingNature}
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
              placeholder="Ex: Personnel"
              disabled={!!viewingNature}
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'REVENUE' | 'EXPENSE' })}
              required
              disabled={!!viewingNature}
            >
              <option value="EXPENSE">Dépense</option>
              <option value="REVENUE">Recette</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description de la nature économique..."
              disabled={!!viewingNature}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={!!viewingNature}
              />
              <span>Actif</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EconomicNatures;
