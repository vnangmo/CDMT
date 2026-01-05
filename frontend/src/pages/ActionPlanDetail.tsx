import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import actionPlanService from '../services/actionPlan.service';
import {
  ActionPlan,
  ActionPlanActivity,
  CreateActivityDto,
  ActivityStatus,
} from '../types/actionPlan.types';

const ActionPlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [activities, setActivities] = useState<ActionPlanActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActionPlanActivity | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateActivityDto>({
    activityCode: '',
    name: '',
    description: '',
    quantityY1: 0,
    unitCostY1: 0,
    quantityY2: 0,
    unitCostY2: 0,
    quantityY3: 0,
    unitCostY3: 0,
  });

  // Computed totals
  const totalCostY1 = (formData.quantityY1 || 0) * (formData.unitCostY1 || 0);
  const totalCostY2 = (formData.quantityY2 || 0) * (formData.unitCostY2 || 0);
  const totalCostY3 = (formData.quantityY3 || 0) * (formData.unitCostY3 || 0);
  const totalCost = totalCostY1 + totalCostY2 + totalCostY3;

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [planData, activitiesData] = await Promise.all([
        actionPlanService.getActionPlan(id!),
        actionPlanService.getActivitiesByPlan(id!),
      ]);
      setPlan(planData);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      alert('Erreur lors du chargement du plan');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      await actionPlanService.exportToPdf(id!);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      await actionPlanService.exportToExcel(id!);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  const handleExportCsv = async () => {
    try {
      await actionPlanService.exportToCsv(id!);
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      alert('Erreur lors de l\'export CSV');
    }
  };

  const handleCreateActivity = () => {
    setEditingActivity(null);
    setFormData({
      activityCode: '',
      name: '',
      description: '',
      quantityY1: 0,
      unitCostY1: 0,
      quantityY2: 0,
      unitCostY2: 0,
      quantityY3: 0,
      unitCostY3: 0,
    });
    setIsModalOpen(true);
  };

  const handleEditActivity = (activity: ActionPlanActivity) => {
    setEditingActivity(activity);
    setFormData({
      activityCode: activity.activityCode,
      name: activity.name,
      description: activity.description,
      orderIndex: activity.orderIndex,
      dependencies: activity.dependencies,
      plannedStartDate: activity.plannedStartDate,
      plannedEndDate: activity.plannedEndDate,
      quantityY1: activity.quantityY1,
      unitCostY1: activity.unitCostY1,
      quantityY2: activity.quantityY2,
      unitCostY2: activity.unitCostY2,
      quantityY3: activity.quantityY3,
      unitCostY3: activity.unitCostY3,
      assignedTo: activity.assignedTo,
      resourceType: activity.resourceType,
      deliverables: activity.deliverables,
    });
    setIsModalOpen(true);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (window.confirm('Supprimer cette activité ?')) {
      try {
        await actionPlanService.deleteActivity(activityId);
        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'activité');
      }
    }
  };

  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingActivity) {
        await actionPlanService.updateActivity(editingActivity.id, formData);
      } else {
        await actionPlanService.createActivity(id!, formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement de l\'activité');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartActivity = async (activityId: string) => {
    try {
      setActionLoading(true);
      await actionPlanService.startActivity(activityId);
      await loadData();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du démarrage de l\'activité');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteActivity = async (activityId: string) => {
    try {
      setActionLoading(true);
      await actionPlanService.completeActivity(activityId);
      await loadData();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la complétion de l\'activité');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidatePlan = async () => {
    if (!plan) return;

    if (window.confirm('Valider ce plan d\'action ?')) {
      try {
        setActionLoading(true);
        await actionPlanService.validateActionPlan(plan.id);
        await loadData();
        alert('Plan validé avec succès');
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la validation');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DJF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getActivityStatusBadgeClass = (status: ActivityStatus) => {
    const statusMap: Record<ActivityStatus, string> = {
      [ActivityStatus.PLANNED]: 'planned',
      [ActivityStatus.IN_PROGRESS]: 'in-progress',
      [ActivityStatus.COMPLETED]: 'completed',
      [ActivityStatus.DELAYED]: 'delayed',
      [ActivityStatus.SUSPENDED]: 'suspended',
    };
    return statusMap[status] || 'planned';
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!plan) {
    return <div className="error">Plan d'action non trouvé</div>;
  }

  return (
    <div className="action-plan-detail-page">
      <PageHeader
        title={plan.name}
        subtitle={`Code: ${plan.planCode}`}
        action={
          <div className="action-buttons">
            {plan.status === 'DRAFT' && (
              <Button
                onClick={handleValidatePlan}
                variant="primary"
                disabled={actionLoading || activities.length === 0}
              >
                Valider le Plan
              </Button>
            )}
            <Button onClick={handleExportPdf} variant="secondary" size="small">
              Export PDF
            </Button>
            <Button onClick={handleExportExcel} variant="secondary" size="small">
              Export Excel
            </Button>
            <Button onClick={handleExportCsv} variant="secondary" size="small">
              Export CSV
            </Button>
            <Button onClick={() => navigate('/action-plans')} variant="secondary">
              Retour
            </Button>
          </div>
        }
      />

      <div className="detail-content">
        {/* Plan Information */}
        <div className="detail-card">
          <h2>Informations du Plan</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Ministère</label>
              <span>{plan.ministry?.name || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Mesure Sectorielle</label>
              <span>{plan.sectoralMeasure?.name || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Année Fiscale</label>
              <span>{plan.fiscalYear}</span>
            </div>
            <div className="detail-item">
              <label>Durée</label>
              <span>{plan.duration ? `${plan.duration} mois` : '-'}</span>
            </div>
            <div className="detail-item">
              <label>Date Début</label>
              <span>{formatDate(plan.startDate)}</span>
            </div>
            <div className="detail-item">
              <label>Date Fin</label>
              <span>{formatDate(plan.endDate)}</span>
            </div>
            <div className="detail-item">
              <label>Statut</label>
              <span className={`status-badge ${plan.status.toLowerCase()}`}>
                {plan.status}
              </span>
            </div>
            <div className="detail-item">
              <label>Progression</label>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${plan.progress || 0}%` }}
                />
                <span className="progress-text">{Number(plan.progress || 0).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="detail-card">
          <h2>Coûts Agrégés</h2>
          <div className="cost-summary-grid">
            <div className="cost-item">
              <label>Année N+1</label>
              <span className="cost-value">{formatCurrency(plan.totalCostY1)}</span>
            </div>
            <div className="cost-item">
              <label>Année N+2</label>
              <span className="cost-value">{formatCurrency(plan.totalCostY2)}</span>
            </div>
            <div className="cost-item">
              <label>Année N+3</label>
              <span className="cost-value">{formatCurrency(plan.totalCostY3)}</span>
            </div>
            <div className="cost-item total">
              <label>Coût Total</label>
              <span className="cost-value">{formatCurrency(plan.totalCost)}</span>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="detail-card">
          <div className="card-header">
            <h2>Activités ({activities.length})</h2>
            <Button onClick={handleCreateActivity} variant="primary" size="small">
              Ajouter Activité
            </Button>
          </div>

          {activities.length === 0 ? (
            <div className="empty-state">
              <p>Aucune activité définie</p>
              <Button onClick={handleCreateActivity} variant="primary">
                Créer la première activité
              </Button>
            </div>
          ) : (
            <div className="activities-table">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Nom</th>
                    <th>Statut</th>
                    <th>Progression</th>
                    <th>Coût Y1</th>
                    <th>Coût Y2</th>
                    <th>Coût Y3</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id}>
                      <td>{activity.activityCode}</td>
                      <td className="activity-name">{activity.name}</td>
                      <td>
                        <span className={`status-badge ${getActivityStatusBadgeClass(activity.status)}`}>
                          {activity.status}
                        </span>
                      </td>
                      <td>
                        <div className="progress-mini">
                          {Number(activity.progress || 0).toFixed(0)}%
                        </div>
                      </td>
                      <td>{formatCurrency(activity.totalCostY1)}</td>
                      <td>{formatCurrency(activity.totalCostY2)}</td>
                      <td>{formatCurrency(activity.totalCostY3)}</td>
                      <td className="font-bold">{formatCurrency(activity.totalCost)}</td>
                      <td className="action-cell">
                        {activity.status === ActivityStatus.PLANNED && (
                          <button
                            onClick={() => handleStartActivity(activity.id)}
                            className="btn-action btn-start"
                            disabled={actionLoading}
                            title="Démarrer"
                          >
                            ▶
                          </button>
                        )}
                        {activity.status === ActivityStatus.IN_PROGRESS && (
                          <button
                            onClick={() => handleCompleteActivity(activity.id)}
                            className="btn-action btn-complete"
                            disabled={actionLoading}
                            title="Terminer"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleEditActivity(activity)}
                          className="btn-action btn-edit"
                          title="Modifier"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="btn-action btn-delete"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Plan Details */}
        <div className="detail-card">
          <h2>Détails du Plan</h2>
          <div className="detail-section">
            <div className="detail-item full-width">
              <label>Objectifs</label>
              <p className="text-content">{plan.objectives || '-'}</p>
            </div>
            <div className="detail-item full-width">
              <label>Résultats Attendus</label>
              <p className="text-content">{plan.expectedResults || '-'}</p>
            </div>
            <div className="detail-item full-width">
              <label>Description</label>
              <p className="text-content">{plan.description || '-'}</p>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="detail-card">
          <h2>Ressources</h2>
          <div className="detail-section">
            <div className="detail-item full-width">
              <label>Ressources Humaines</label>
              <p className="text-content">{plan.humanResources || '-'}</p>
            </div>
            <div className="detail-item full-width">
              <label>Ressources Techniques</label>
              <p className="text-content">{plan.technicalResources || '-'}</p>
            </div>
            <div className="detail-item full-width">
              <label>Support Institutionnel</label>
              <p className="text-content">{plan.institutionalSupport || '-'}</p>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        {plan.mitigationMeasures && (
          <div className="detail-card">
            <h2>Gestion des Risques</h2>
            <div className="detail-section">
              <div className="detail-item full-width">
                <label>Mesures d'Atténuation</label>
                <p className="text-content">{plan.mitigationMeasures}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingActivity ? 'Modifier Activité' : 'Nouvelle Activité'}
        size="large"
      >
        <form onSubmit={handleSubmitActivity} className="form">
          <div className="form-grid">
            <div className="form-group">
              <label>Code Activité *</label>
              <input
                type="text"
                value={formData.activityCode}
                onChange={(e) => setFormData({ ...formData, activityCode: e.target.value })}
                required
                disabled={!!editingActivity}
              />
            </div>

            <div className="form-group">
              <label>Nom de l'Activité *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Date Début Prévue</label>
              <input
                type="date"
                value={formData.plannedStartDate ? new Date(formData.plannedStartDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, plannedStartDate: new Date(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label>Date Fin Prévue</label>
              <input
                type="date"
                value={formData.plannedEndDate ? new Date(formData.plannedEndDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, plannedEndDate: new Date(e.target.value) })}
              />
            </div>

            {/* Year 1 */}
            <div className="form-group-header full-width">
              <h3>Année N+1</h3>
            </div>
            <div className="form-group">
              <label>Quantité Y1</label>
              <input
                type="number"
                value={formData.quantityY1}
                onChange={(e) => setFormData({ ...formData, quantityY1: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Coût Unitaire Y1</label>
              <input
                type="number"
                value={formData.unitCostY1}
                onChange={(e) => setFormData({ ...formData, unitCostY1: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Total Y1</label>
              <input
                type="text"
                value={formatCurrency(totalCostY1)}
                disabled
                className="calculated-field"
              />
            </div>

            {/* Year 2 */}
            <div className="form-group-header full-width">
              <h3>Année N+2</h3>
            </div>
            <div className="form-group">
              <label>Quantité Y2</label>
              <input
                type="number"
                value={formData.quantityY2}
                onChange={(e) => setFormData({ ...formData, quantityY2: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Coût Unitaire Y2</label>
              <input
                type="number"
                value={formData.unitCostY2}
                onChange={(e) => setFormData({ ...formData, unitCostY2: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Total Y2</label>
              <input
                type="text"
                value={formatCurrency(totalCostY2)}
                disabled
                className="calculated-field"
              />
            </div>

            {/* Year 3 */}
            <div className="form-group-header full-width">
              <h3>Année N+3</h3>
            </div>
            <div className="form-group">
              <label>Quantité Y3</label>
              <input
                type="number"
                value={formData.quantityY3}
                onChange={(e) => setFormData({ ...formData, quantityY3: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Coût Unitaire Y3</label>
              <input
                type="number"
                value={formData.unitCostY3}
                onChange={(e) => setFormData({ ...formData, unitCostY3: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Total Y3</label>
              <input
                type="text"
                value={formatCurrency(totalCostY3)}
                disabled
                className="calculated-field"
              />
            </div>

            <div className="form-group-header full-width">
              <h3>Coût Total: {formatCurrency(totalCost)}</h3>
            </div>

            <div className="form-group">
              <label>Assigné à</label>
              <input
                type="text"
                value={formData.assignedTo || ''}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Type de Ressource</label>
              <input
                type="text"
                value={formData.resourceType || ''}
                onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-group full-width">
              <label>Dépendances (IDs séparés par virgule)</label>
              <input
                type="text"
                value={formData.dependencies || ''}
                onChange={(e) => setFormData({ ...formData, dependencies: e.target.value })}
                placeholder="activity-id-1, activity-id-2"
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

export default ActionPlanDetail;
