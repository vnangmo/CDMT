import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import actionPlanService from '../services/actionPlan.service';
import sectoralMeasureService from '../services/sectoralMeasure.service';
import referentielService from '../services/referentiel.service';
import {
  ActionPlan,
  CreateActionPlanDto,
  ActionPlanStatus,
} from '../types/actionPlan.types';
import { SectoralMeasure } from '../types/sectoralMeasure.types';
import { Ministry } from '../types/referentiel.types';

const ActionPlans: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [sectoralMeasures, setSectoralMeasures] = useState<SectoralMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ActionPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateActionPlanDto>({
    planCode: '',
    name: '',
    description: '',
    sectoralMeasureId: '',
    ministryId: '',
    fiscalYear: new Date().getFullYear(),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, ministriesData, measuresData] = await Promise.all([
        actionPlanService.getActionPlans(),
        referentielService.getMinistries(),
        sectoralMeasureService.getSectoralMeasures(),
      ]);
      setPlans(Array.isArray(plansData) ? plansData : []);
      setMinistries(Array.isArray(ministriesData) ? ministriesData : []);
      setSectoralMeasures(Array.isArray(measuresData) ? measuresData : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      planCode: '',
      name: '',
      description: '',
      sectoralMeasureId: '',
      ministryId: '',
      fiscalYear: new Date().getFullYear(),
    });
    setIsModalOpen(true);
  };

  const handleEdit = (plan: ActionPlan) => {
    setEditingPlan(plan);
    setFormData({
      planCode: plan.planCode,
      name: plan.name,
      nameAr: plan.nameAr,
      nameEn: plan.nameEn,
      description: plan.description,
      sectoralMeasureId: plan.sectoralMeasureId,
      ministryId: plan.ministryId,
      fiscalYear: plan.fiscalYear,
      startDate: plan.startDate,
      endDate: plan.endDate,
      duration: plan.duration,
      objectives: plan.objectives,
      expectedResults: plan.expectedResults,
      performanceIndicators: plan.performanceIndicators,
      humanResources: plan.humanResources,
      technicalResources: plan.technicalResources,
      institutionalSupport: plan.institutionalSupport,
      risks: plan.risks,
      mitigationMeasures: plan.mitigationMeasures,
      responsibleEntity: plan.responsibleEntity,
      coordinator: plan.coordinator,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (plan: ActionPlan) => {
    if (window.confirm(`Supprimer le plan "${plan.name}" ?`)) {
      try {
        await actionPlanService.deleteActionPlan(plan.id);
        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du plan');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingPlan) {
        await actionPlanService.updateActionPlan(editingPlan.id, formData);
      } else {
        await actionPlanService.createActionPlan(formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement du plan');
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

  const getStatusBadgeClass = (status: ActionPlanStatus) => {
    const statusMap: Record<ActionPlanStatus, string> = {
      [ActionPlanStatus.DRAFT]: 'draft',
      [ActionPlanStatus.VALIDATED]: 'validated',
      [ActionPlanStatus.IN_PROGRESS]: 'in-progress',
      [ActionPlanStatus.COMPLETED]: 'completed',
      [ActionPlanStatus.SUSPENDED]: 'suspended',
    };
    return statusMap[status] || 'draft';
  };

  const columns: Column<ActionPlan>[] = [
    {
      key: 'planCode',
      header: 'Code',
      width: '10%',
    },
    {
      key: 'name',
      header: 'Nom du Plan',
      width: '25%',
    },
    {
      key: 'ministry',
      header: 'Ministère',
      width: '15%',
      render: (item) => item.ministry?.name || '-',
    },
    {
      key: 'sectoralMeasure',
      header: 'Mesure Sectorielle',
      width: '15%',
      render: (item) => item.sectoralMeasure?.name || '-',
    },
    {
      key: 'totalCost',
      header: 'Coût Total',
      width: '12%',
      render: (item) => formatCurrency(item.totalCost),
    },
    {
      key: 'progress',
      header: 'Progression',
      width: '10%',
      render: (item) => `${Number(item.progress || 0).toFixed(0)}%`,
    },
    {
      key: 'status',
      header: 'Statut',
      width: '10%',
      render: (item) => (
        <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <div className="action-plans-page">
      <PageHeader
        title="Plans d'Action"
        subtitle="Plans de mise en œuvre des mesures sectorielles"
        action={
          <Button onClick={handleCreate} variant="primary">
            Nouveau Plan d'Action
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={(plan) => navigate(`/action-plans/${plan.id}`)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Modifier Plan d\'Action' : 'Nouveau Plan d\'Action'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-grid">
            <div className="form-group">
              <label>Code Plan *</label>
              <input
                type="text"
                value={formData.planCode}
                onChange={(e) => setFormData({ ...formData, planCode: e.target.value })}
                required
                disabled={!!editingPlan}
              />
            </div>

            <div className="form-group">
              <label>Nom du Plan *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <label>Mesure Sectorielle *</label>
              <select
                value={formData.sectoralMeasureId}
                onChange={(e) => setFormData({ ...formData, sectoralMeasureId: e.target.value })}
                required
              >
                <option value="">Sélectionner...</option>
                {sectoralMeasures
                  .filter((m) => !formData.ministryId || m.ministryId === formData.ministryId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.measureCode} - {m.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Année Fiscale *</label>
              <input
                type="number"
                value={formData.fiscalYear}
                onChange={(e) => setFormData({ ...formData, fiscalYear: Number(e.target.value) })}
                required
                min="2024"
                max="2050"
              />
            </div>

            <div className="form-group">
              <label>Durée (mois)</label>
              <input
                type="number"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Date de Début</label>
              <input
                type="date"
                value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label>Date de Fin</label>
              <input
                type="date"
                value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
              />
            </div>

            <div className="form-group full-width">
              <label>Objectifs</label>
              <textarea
                value={formData.objectives || ''}
                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                rows={3}
                placeholder="Objectifs du plan d'action..."
              />
            </div>

            <div className="form-group full-width">
              <label>Résultats Attendus</label>
              <textarea
                value={formData.expectedResults || ''}
                onChange={(e) => setFormData({ ...formData, expectedResults: e.target.value })}
                rows={3}
                placeholder="Résultats attendus..."
              />
            </div>

            <div className="form-group">
              <label>Entité Responsable</label>
              <input
                type="text"
                value={formData.responsibleEntity || ''}
                onChange={(e) => setFormData({ ...formData, responsibleEntity: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Coordinateur</label>
              <input
                type="text"
                value={formData.coordinator || ''}
                onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label>Ressources Humaines</label>
              <textarea
                value={formData.humanResources || ''}
                onChange={(e) => setFormData({ ...formData, humanResources: e.target.value })}
                rows={2}
                placeholder="Ressources humaines nécessaires..."
              />
            </div>

            <div className="form-group full-width">
              <label>Ressources Techniques</label>
              <textarea
                value={formData.technicalResources || ''}
                onChange={(e) => setFormData({ ...formData, technicalResources: e.target.value })}
                rows={2}
                placeholder="Ressources techniques nécessaires..."
              />
            </div>

            <div className="form-group full-width">
              <label>Support Institutionnel</label>
              <textarea
                value={formData.institutionalSupport || ''}
                onChange={(e) => setFormData({ ...formData, institutionalSupport: e.target.value })}
                rows={2}
                placeholder="Support institutionnel requis..."
              />
            </div>

            <div className="form-group full-width">
              <label>Mesures d'Atténuation des Risques</label>
              <textarea
                value={formData.mitigationMeasures || ''}
                onChange={(e) => setFormData({ ...formData, mitigationMeasures: e.target.value })}
                rows={2}
                placeholder="Mesures d'atténuation..."
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
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

export default ActionPlans;
