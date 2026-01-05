import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import referentielService from '../services/referentiel.service';
import { FiscalYear, CreateFiscalYearDto, UpdateFiscalYearDto } from '../types/referentiel.types';
import './FiscalYears.css';

const FiscalYears: React.FC = () => {
  const [years, setYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<FiscalYear | null>(null);
  const [viewingYear, setViewingYear] = useState<FiscalYear | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateFiscalYearDto>({
    year: new Date().getFullYear(),
    name: '',
    startDate: '',
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    try {
      setLoading(true);
      const data = await referentielService.getFiscalYears();
      setYears(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement des années fiscales:', error);
      setYears([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingYear(null);
    setViewingYear(null);
    const currentYear = new Date().getFullYear();
    setFormData({
      year: currentYear,
      name: `Année Fiscale ${currentYear}`,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleView = (year: FiscalYear) => {
    setViewingYear(year);
    setEditingYear(null);
    setFormData({
      year: year.year,
      name: year.name,
      startDate: year.startDate.split('T')[0],
      endDate: year.endDate.split('T')[0],
      isActive: year.isActive
    });
    setIsModalOpen(true);
  };

  const handleEdit = (year: FiscalYear) => {
    setEditingYear(year);
    setViewingYear(null);
    setFormData({
      year: year.year,
      name: year.name,
      startDate: year.startDate.split('T')[0],
      endDate: year.endDate.split('T')[0],
      isActive: year.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (year: FiscalYear) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'année fiscale ${year.year} ?`)) {
      try {
        await referentielService.deleteFiscalYear(year.id);
        await loadYears();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'année fiscale');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveYear();
  };

  const saveYear = async () => {
    setSubmitting(true);

    try {
      if (editingYear) {
        await referentielService.updateFiscalYear(editingYear.id, formData as UpdateFiscalYearDto);
      } else {
        await referentielService.createFiscalYear(formData);
      }
      setIsModalOpen(false);
      await loadYears();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement de l\'année fiscale');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<FiscalYear>[] = [
    {
      key: 'year',
      header: 'Année',
      width: '15%',
      render: (item) => <strong>{item.year}</strong>
    },
    {
      key: 'startDate',
      header: 'Date de début',
      width: '20%',
      render: (item) => new Date(item.startDate).toLocaleDateString('fr-FR')
    },
    {
      key: 'endDate',
      header: 'Date de fin',
      width: '20%',
      render: (item) => new Date(item.endDate).toLocaleDateString('fr-FR')
    },
    {
      key: 'isClosed',
      header: 'Statut',
      width: '15%',
      render: (item) => (
        <span className={`status-badge ${item.isClosed ? 'closed' : 'active'}`}>
          {item.isClosed ? 'Clôturée' : 'Ouverte'}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'État',
      width: '10%',
      render: (item) => (
        <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
          {item.isActive ? 'Actif' : 'Inactif'}
        </span>
      )
    }
  ];

  return (
    <div className="fiscal-years-page">
      <PageHeader
        title="Gestion des Années Fiscales"
        subtitle="Gestion des versions et historisation - REQ-REF-03"
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
            Nouvelle Année Fiscale
          </Button>
        }
      />

      <DataTable
        data={years}
        columns={columns}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Aucune année fiscale enregistrée"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingYear ? 'Détails de l\'Année Fiscale' : editingYear ? 'Modifier l\'Année Fiscale' : 'Nouvelle Année Fiscale'}
        footer={
          viewingYear ? (
            <Button onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveYear} loading={submitting}>
                {editingYear ? 'Mettre à jour' : 'Créer'}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="year-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Année *</label>
              <input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
                min="2000"
                max="2100"
                placeholder="Ex: 2024"
                disabled={!!viewingYear}
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
                placeholder="Ex: Année Fiscale 2024"
                disabled={!!viewingYear}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Date de début *</label>
              <input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                disabled={!!viewingYear}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Date de fin *</label>
              <input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                disabled={!!viewingYear}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={!!viewingYear}
              />
              <span>Actif</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FiscalYears;
