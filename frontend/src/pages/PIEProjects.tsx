import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import pieProjectService from '../services/pieProject.service';
import referentielService from '../services/referentiel.service';
import { PIEProject, CreatePIEProjectDto, PIEProjectCategory, PIEProjectStatus } from '../types/pieProject.types';
import { Ministry, FundingSource } from '../types/referentiel.types';

const PIEProjects: React.FC = () => {
  const [projects, setProjects] = useState<PIEProject[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PIEProject | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreatePIEProjectDto>({
    projectCode: '',
    projectName: '',
    description: '',
    category: PIEProjectCategory.INFRASTRUCTURE,
    ministryId: '',
    totalCost: 0,
    fundingSourceId: '',
    allocationY1: 0,
    allocationY2: 0,
    allocationY3: 0,
    status: PIEProjectStatus.DRAFT,
    isRecurrent: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, ministriesData, fundingSourcesData] = await Promise.all([
        pieProjectService.getPIEProjects(),
        referentielService.getMinistries(),
        referentielService.getFundingSources(),
      ]);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setMinistries(Array.isArray(ministriesData) ? ministriesData : []);
      setFundingSources(Array.isArray(fundingSourcesData) ? fundingSourcesData : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    setFormData({
      projectCode: '',
      projectName: '',
      description: '',
      category: PIEProjectCategory.INFRASTRUCTURE,
      ministryId: '',
      totalCost: 0,
      fundingSourceId: '',
      allocationY1: 0,
      allocationY2: 0,
      allocationY3: 0,
      status: PIEProjectStatus.DRAFT,
      isRecurrent: false,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (project: PIEProject) => {
    setEditingProject(project);
    setFormData({
      projectCode: project.projectCode,
      projectName: project.projectName,
      description: project.description,
      category: project.category,
      ministryId: project.ministryId,
      totalCost: project.totalCost,
      fundingSourceId: project.fundingSourceId,
      allocationY1: project.allocationY1,
      allocationY2: project.allocationY2,
      allocationY3: project.allocationY3,
      status: project.status,
      isRecurrent: project.isRecurrent,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (project: PIEProject) => {
    if (window.confirm(`Supprimer le projet "${project.projectName}" ?`)) {
      try {
        await pieProjectService.deletePIEProject(project.id);
        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du projet');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingProject) {
        await pieProjectService.updatePIEProject(editingProject.id, formData);
      } else {
        await pieProjectService.createPIEProject(formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement du projet');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DJF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const columns: Column<PIEProject>[] = [
    {
      key: 'projectCode',
      header: 'Code',
      width: '10%',
    },
    {
      key: 'projectName',
      header: 'Nom du Projet',
      width: '25%',
    },
    {
      key: 'ministry',
      header: 'Ministère',
      width: '15%',
      render: (item) => item.ministry?.name || '-',
    },
    {
      key: 'category',
      header: 'Catégorie',
      width: '12%',
    },
    {
      key: 'totalCost',
      header: 'Coût Total',
      width: '13%',
      render: (item) => formatCurrency(item.totalCost),
    },
    {
      key: 'allocationY1',
      header: 'N+1',
      width: '10%',
      render: (item) => formatCurrency(item.allocationY1),
    },
    {
      key: 'status',
      header: 'Statut',
      width: '10%',
      render: (item) => (
        <span className={`status-badge ${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <div className="pie-projects-page">
      <PageHeader
        title="Projets PIE"
        subtitle="Plan d'Investissement Exceptionnel"
        action={
          <Button onClick={handleCreate} variant="primary">
            Nouveau Projet PIE
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Modifier Projet PIE' : 'Nouveau Projet PIE'}
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-grid">
            <div className="form-group">
              <label>Code Projet *</label>
              <input
                type="text"
                value={formData.projectCode}
                onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Nom du Projet *</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Ministère *</label>
              <select
                value={formData.ministryId}
                onChange={(e) => setFormData({ ...formData, ministryId: e.target.value })}
                required
              >
                <option value="">Sélectionner...</option>
                {ministries.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Catégorie *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as PIEProjectCategory })}
                required
              >
                {Object.values(PIEProjectCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Source de Financement *</label>
              <select
                value={formData.fundingSourceId}
                onChange={(e) => setFormData({ ...formData, fundingSourceId: e.target.value })}
                required
              >
                <option value="">Sélectionner...</option>
                {fundingSources.map((fs) => (
                  <option key={fs.id} value={fs.id}>
                    {fs.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Coût Total *</label>
              <input
                type="number"
                value={formData.totalCost}
                onChange={(e) => setFormData({ ...formData, totalCost: Number(e.target.value) })}
                required
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Allocation N+1 *</label>
              <input
                type="number"
                value={formData.allocationY1}
                onChange={(e) => setFormData({ ...formData, allocationY1: Number(e.target.value) })}
                required
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Allocation N+2 *</label>
              <input
                type="number"
                value={formData.allocationY2}
                onChange={(e) => setFormData({ ...formData, allocationY2: Number(e.target.value) })}
                required
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Allocation N+3 *</label>
              <input
                type="number"
                value={formData.allocationY3}
                onChange={(e) => setFormData({ ...formData, allocationY3: Number(e.target.value) })}
                required
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PIEProjectStatus })}
              >
                {Object.values(PIEProjectStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isRecurrent}
                  onChange={(e) => setFormData({ ...formData, isRecurrent: e.target.checked })}
                />
                <span>Projet Récurrent</span>
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PIEProjects;
