import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import referentielService from '../services/referentiel.service';
import { FundingSource, CreateFundingSourceDto, UpdateFundingSourceDto } from '../types/referentiel.types';
import './FundingSources.css';

const FundingSources: React.FC = () => {
  const [sources, setSources] = useState<FundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<FundingSource | null>(null);
  const [viewingSource, setViewingSource] = useState<FundingSource | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateFundingSourceDto>({
    code: '',
    name: '',
    type: 'INTERNAL',
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await referentielService.getFundingSources();
      setSources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des sources de financement:', error);
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSource(null);
    setViewingSource(null);
    setFormData({
      code: '',
      name: '',
      type: 'INTERNAL',
      description: '',
      isActive: true
    });
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
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la source de financement "${source.name}" ?`)) {
      try {
        await referentielService.deleteFundingSource(source.id);
        await loadSources();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la source de financement');
      }
    }
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
      } else {
        await referentielService.createFundingSource(formData);
      }
      setIsModalOpen(false);
      await loadSources();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement de la source de financement');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<FundingSource>[] = [
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
      key: 'type',
      header: 'Type',
      width: '15%',
      render: (item) => {
        const typeMap = {
          INTERNAL: 'Interne',
          EXTERNAL: 'Externe',
          LOAN: 'Prêt',
          GRANT: 'Don'
        };
        return typeMap[item.type];
      }
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
    <div className="funding-sources-page">
      <PageHeader
        title="Gestion des Sources de Financement"
        subtitle="Classification par source de financement - REQ-REF-01"
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
            Nouvelle Source de Financement
          </Button>
        }
      />

      <DataTable
        data={sources}
        columns={columns}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Aucune source de financement enregistrée"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingSource ? 'Détails de la Source de Financement' : editingSource ? 'Modifier la Source de Financement' : 'Nouvelle Source de Financement'}
        footer={
          viewingSource ? (
            <Button onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveSource} loading={submitting}>
                {editingSource ? 'Mettre à jour' : 'Créer'}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="source-form">
          <div className="form-group">
            <label htmlFor="code">Code *</label>
            <input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="Ex: FIN-01"
              disabled={!!viewingSource}
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
              placeholder="Ex: Budget National"
              disabled={!!viewingSource}
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INTERNAL' | 'EXTERNAL' | 'LOAN' | 'GRANT' })}
              required
              disabled={!!viewingSource}
            >
              <option value="INTERNAL">Interne</option>
              <option value="EXTERNAL">Externe</option>
              <option value="LOAN">Prêt</option>
              <option value="GRANT">Don</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description de la source de financement..."
              disabled={!!viewingSource}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={!!viewingSource}
              />
              <span>Actif</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FundingSources;
