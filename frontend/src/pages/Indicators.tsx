import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import programmaticService from '../services/programmatic.service';
import {
  Indicator,
  Objective,
  CreateIndicatorDto,
  UpdateIndicatorDto,
  UpdateActualValuesDto
} from '../types/programmatic.types';
import './Indicators.css';

const Indicators: React.FC = () => {
  const [searchParams] = useSearchParams();
  const objectiveIdFromUrl = searchParams.get('objectiveId');

  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActualsModalOpen, setIsActualsModalOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [viewingIndicator, setViewingIndicator] = useState<Indicator | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterObjectiveId, setFilterObjectiveId] = useState<string>(objectiveIdFromUrl || '');
  const [filterIndicatorType, setFilterIndicatorType] = useState<string>('');
  const [filterFrequency, setFilterFrequency] = useState<string>('');

  const [formData, setFormData] = useState<CreateIndicatorDto>({
    code: '',
    name: '',
    description: '',
    objectiveId: objectiveIdFromUrl || '',
    unit: '',
    dataSource: '',
    calculationMethod: '',
    baselineYear: new Date().getFullYear() - 1,
    baselineValue: 0,
    targetYear1: new Date().getFullYear() + 1,
    targetValue1: 0,
    targetYear2: new Date().getFullYear() + 2,
    targetValue2: 0,
    targetYear3: new Date().getFullYear() + 3,
    targetValue3: 0,
    indicatorType: 'OUTPUT',
    frequency: 'ANNUAL',
    responsibleParty: '',
    isActive: true
  });

  const [actualsData, setActualsData] = useState<UpdateActualValuesDto>({
    actualYear1: new Date().getFullYear() + 1,
    actualValue1: 0,
    actualYear2: new Date().getFullYear() + 2,
    actualValue2: 0,
    actualYear3: new Date().getFullYear() + 3,
    actualValue3: 0
  });

  useEffect(() => {
    loadIndicators();
    loadObjectives();
  }, [filterObjectiveId, filterIndicatorType, filterFrequency]);

  const loadIndicators = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterObjectiveId) filters.objectiveId = filterObjectiveId;
      if (filterIndicatorType) filters.indicatorType = filterIndicatorType;
      if (filterFrequency) filters.frequency = filterFrequency;

      const result = await programmaticService.getIndicators(filters);
      setIndicators(Array.isArray(result.indicators) ? result.indicators : []);
    } catch (error) {
      console.error('Erreur lors du chargement des indicateurs:', error);
      setIndicators([]);
    } finally {
      setLoading(false);
    }
  };

  const loadObjectives = async () => {
    try {
      const result = await programmaticService.getObjectives({});
      setObjectives(Array.isArray(result.objectives) ? result.objectives : []);
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs:', error);
      setObjectives([]);
    }
  };

  const handleCreate = () => {
    setEditingIndicator(null);
    setViewingIndicator(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      objectiveId: objectiveIdFromUrl || '',
      unit: '',
      dataSource: '',
      calculationMethod: '',
      baselineYear: new Date().getFullYear() - 1,
      baselineValue: 0,
      targetYear1: new Date().getFullYear() + 1,
      targetValue1: 0,
      targetYear2: new Date().getFullYear() + 2,
      targetValue2: 0,
      targetYear3: new Date().getFullYear() + 3,
      targetValue3: 0,
      indicatorType: 'OUTPUT',
      frequency: 'ANNUAL',
      responsibleParty: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleView = (indicator: Indicator) => {
    setViewingIndicator(indicator);
    setEditingIndicator(null);
    setFormData({
      code: indicator.code,
      name: indicator.name,
      description: indicator.description || '',
      objectiveId: indicator.objectiveId,
      unit: indicator.unit,
      dataSource: indicator.dataSource || '',
      calculationMethod: indicator.calculationMethod || '',
      baselineYear: indicator.baselineYear || new Date().getFullYear() - 1,
      baselineValue: indicator.baselineValue || 0,
      targetYear1: indicator.targetYear1 || new Date().getFullYear() + 1,
      targetValue1: indicator.targetValue1 || 0,
      targetYear2: indicator.targetYear2 || new Date().getFullYear() + 2,
      targetValue2: indicator.targetValue2 || 0,
      targetYear3: indicator.targetYear3 || new Date().getFullYear() + 3,
      targetValue3: indicator.targetValue3 || 0,
      indicatorType: indicator.indicatorType as any || 'OUTPUT',
      frequency: indicator.frequency as any || 'ANNUAL',
      responsibleParty: indicator.responsibleParty || '',
      isActive: indicator.isActive
    });
    setIsModalOpen(true);
  };

  const handleEdit = (indicator: Indicator) => {
    setEditingIndicator(indicator);
    setViewingIndicator(null);
    setFormData({
      code: indicator.code,
      name: indicator.name,
      description: indicator.description || '',
      objectiveId: indicator.objectiveId,
      unit: indicator.unit,
      dataSource: indicator.dataSource || '',
      calculationMethod: indicator.calculationMethod || '',
      baselineYear: indicator.baselineYear || new Date().getFullYear() - 1,
      baselineValue: indicator.baselineValue || 0,
      targetYear1: indicator.targetYear1 || new Date().getFullYear() + 1,
      targetValue1: indicator.targetValue1 || 0,
      targetYear2: indicator.targetYear2 || new Date().getFullYear() + 2,
      targetValue2: indicator.targetValue2 || 0,
      targetYear3: indicator.targetYear3 || new Date().getFullYear() + 3,
      targetValue3: indicator.targetValue3 || 0,
      indicatorType: indicator.indicatorType as any || 'OUTPUT',
      frequency: indicator.frequency as any || 'ANNUAL',
      responsibleParty: indicator.responsibleParty || '',
      isActive: indicator.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (indicator: Indicator) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'indicateur "${indicator.name}" ?`)) {
      try {
        await programmaticService.deleteIndicator(indicator.id);
        await loadIndicators();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'indicateur');
      }
    }
  };

  const handleUpdateActuals = (indicator: Indicator) => {
    setEditingIndicator(indicator);
    setActualsData({
      actualYear1: indicator.actualYear1 || new Date().getFullYear() + 1,
      actualValue1: indicator.actualValue1 || 0,
      actualYear2: indicator.actualYear2 || new Date().getFullYear() + 2,
      actualValue2: indicator.actualValue2 || 0,
      actualYear3: indicator.actualYear3 || new Date().getFullYear() + 3,
      actualValue3: indicator.actualValue3 || 0
    });
    setIsActualsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveIndicator();
  };

  const saveIndicator = async () => {
    setSubmitting(true);

    try {
      if (editingIndicator) {
        await programmaticService.updateIndicator(editingIndicator.id, formData);
      } else {
        await programmaticService.createIndicator(formData);
      }
      setIsModalOpen(false);
      await loadIndicators();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement de l\'indicateur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActualsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveActuals();
  };

  const saveActuals = async () => {
    if (!editingIndicator) return;

    setSubmitting(true);

    try {
      await programmaticService.updateActualValues(editingIndicator.id, actualsData);
      setIsActualsModalOpen(false);
      await loadIndicators();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour des valeurs réelles');
    } finally {
      setSubmitting(false);
    }
  };

  const getIndicatorTypeBadge = (indicatorType: string | null | undefined) => {
    if (!indicatorType) return '-';
    const badges: Record<string, { color: string; label: string }> = {
      OUTPUT: { color: 'primary', label: 'Extrant' },
      OUTCOME: { color: 'success', label: 'Résultat' },
      IMPACT: { color: 'warning', label: 'Impact' }
    };
    const badge = badges[indicatorType] || { color: 'secondary', label: indicatorType };
    return <span className={`badge badge-${badge.color}`}>{badge.label}</span>;
  };

  const getFrequencyBadge = (frequency: string | null | undefined) => {
    if (!frequency) return '-';
    const badges: Record<string, { color: string; label: string }> = {
      ANNUAL: { color: 'info', label: 'Annuel' },
      QUARTERLY: { color: 'info', label: 'Trimestriel' },
      MONTHLY: { color: 'info', label: 'Mensuel' }
    };
    const badge = badges[frequency] || { color: 'secondary', label: frequency };
    return <span className={`badge badge-${badge.color}`}>{badge.label}</span>;
  };

  const calculateAchievement = (target: number | null, actual: number | null): string => {
    if (!target || !actual) return '-';
    const achievement = (actual / target) * 100;
    return `${achievement.toFixed(1)}%`;
  };

  const getAchievementColor = (target: number | null, actual: number | null): string => {
    if (!target || !actual) return '';
    const achievement = (actual / target) * 100;
    if (achievement >= 100) return 'achievement-excellent';
    if (achievement >= 75) return 'achievement-good';
    if (achievement >= 50) return 'achievement-fair';
    return 'achievement-poor';
  };

  const columns: Column<Indicator>[] = [
    {
      key: 'code',
      header: 'Code',
      width: '10%'
    },
    {
      key: 'name',
      header: 'Nom',
      width: '22%'
    },
    {
      key: 'objective',
      header: 'Objectif',
      width: '18%',
      render: (item) => item.objective?.name || '-'
    },
    {
      key: 'unit',
      header: 'Unité',
      width: '8%'
    },
    {
      key: 'indicatorType',
      header: 'Type',
      width: '10%',
      render: (item) => getIndicatorTypeBadge(item.indicatorType)
    },
    {
      key: 'frequency',
      header: 'Fréquence',
      width: '10%',
      render: (item) => getFrequencyBadge(item.frequency)
    },
    {
      key: 'baseline',
      header: 'Baseline',
      width: '10%',
      render: (item) => item.baselineValue !== null && item.baselineValue !== undefined
        ? `${item.baselineValue} (${item.baselineYear})`
        : '-'
    },
    {
      key: 'isActive',
      header: 'Statut',
      width: '12%',
      render: (item) => (
        <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
          {item.isActive ? 'Actif' : 'Inactif'}
        </span>
      )
    }
  ];

  return (
    <div className="indicators-page">
      <PageHeader
        title="Gestion des Indicateurs"
        subtitle="Structure programmatique - Indicateurs de performance - REQ-PROG-02"
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
            Nouvel Indicateur
          </Button>
        }
      />

      <div className="filters-section">
        <div className="filter-group">
          <label>Objectif</label>
          <select value={filterObjectiveId} onChange={(e) => setFilterObjectiveId(e.target.value)}>
            <option value="">Tous</option>
            {objectives.map(objective => (
              <option key={objective.id} value={objective.id}>{objective.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Type d'indicateur</label>
          <select value={filterIndicatorType} onChange={(e) => setFilterIndicatorType(e.target.value)}>
            <option value="">Tous</option>
            <option value="OUTPUT">Extrant</option>
            <option value="OUTCOME">Résultat</option>
            <option value="IMPACT">Impact</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Fréquence</label>
          <select value={filterFrequency} onChange={(e) => setFilterFrequency(e.target.value)}>
            <option value="">Toutes</option>
            <option value="ANNUAL">Annuel</option>
            <option value="QUARTERLY">Trimestriel</option>
            <option value="MONTHLY">Mensuel</option>
          </select>
        </div>
      </div>

      <DataTable
        data={indicators}
        columns={columns}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Aucun indicateur enregistré"
        customActions={(item: Indicator) => (
          <button
            onClick={() => handleUpdateActuals(item)}
            className="btn-icon"
            title="Mettre à jour les valeurs réelles"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
      />

      {/* Main Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={viewingIndicator ? 'Détails de l\'Indicateur' : editingIndicator ? 'Modifier l\'Indicateur' : 'Nouvel Indicateur'}
        footer={
          viewingIndicator ? (
            <Button onClick={() => setIsModalOpen(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveIndicator} loading={submitting}>
                {editingIndicator ? 'Mettre à jour' : 'Créer'}
              </Button>
            </>
          )
        }
      >
        <form onSubmit={handleSubmit} className="indicator-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="code">Code *</label>
              <input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                placeholder="Ex: IND-001"
                disabled={!!viewingIndicator}
              />
            </div>

            <div className="form-group">
              <label htmlFor="unit">Unité *</label>
              <input
                id="unit"
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
                placeholder="Ex: %, nombre, jours"
                disabled={!!viewingIndicator}
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
              placeholder="Ex: Taux de vaccination infantile"
              disabled={!!viewingIndicator}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Description de l'indicateur..."
              disabled={!!viewingIndicator}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="objectiveId">Objectif *</label>
              <select
                id="objectiveId"
                value={formData.objectiveId}
                onChange={(e) => setFormData({ ...formData, objectiveId: e.target.value })}
                required
                disabled={!!viewingIndicator}
              >
                <option value="">Sélectionner un objectif</option>
                {objectives.map(objective => (
                  <option key={objective.id} value={objective.id}>{objective.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="responsibleParty">Responsable</label>
              <input
                id="responsibleParty"
                type="text"
                value={formData.responsibleParty}
                onChange={(e) => setFormData({ ...formData, responsibleParty: e.target.value })}
                placeholder="Responsable du suivi"
                disabled={!!viewingIndicator}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="indicatorType">Type d'indicateur *</label>
              <select
                id="indicatorType"
                value={formData.indicatorType}
                onChange={(e) => setFormData({ ...formData, indicatorType: e.target.value as any })}
                required
                disabled={!!viewingIndicator}
              >
                <option value="OUTPUT">Extrant (Output)</option>
                <option value="OUTCOME">Résultat (Outcome)</option>
                <option value="IMPACT">Impact</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="frequency">Fréquence *</label>
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                required
                disabled={!!viewingIndicator}
              >
                <option value="ANNUAL">Annuel</option>
                <option value="QUARTERLY">Trimestriel</option>
                <option value="MONTHLY">Mensuel</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dataSource">Source de données</label>
              <input
                id="dataSource"
                type="text"
                value={formData.dataSource}
                onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
                placeholder="Ex: Enquête nationale"
                disabled={!!viewingIndicator}
              />
            </div>

            <div className="form-group">
              <label htmlFor="calculationMethod">Méthode de calcul</label>
              <input
                id="calculationMethod"
                type="text"
                value={formData.calculationMethod}
                onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value })}
                placeholder="Ex: (A/B) * 100"
                disabled={!!viewingIndicator}
              />
            </div>
          </div>

          <div className="section-divider">
            <h4>Baseline</h4>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="baselineYear">Année baseline</label>
              <input
                id="baselineYear"
                type="number"
                value={formData.baselineYear}
                onChange={(e) => setFormData({ ...formData, baselineYear: parseInt(e.target.value) })}
                disabled={!!viewingIndicator}
              />
            </div>

            <div className="form-group">
              <label htmlFor="baselineValue">Valeur baseline</label>
              <input
                id="baselineValue"
                type="number"
                step="0.01"
                value={formData.baselineValue}
                onChange={(e) => setFormData({ ...formData, baselineValue: parseFloat(e.target.value) })}
                disabled={!!viewingIndicator}
              />
            </div>
          </div>

          <div className="section-divider">
            <h4>Cibles (Targets)</h4>
          </div>

          <div className="targets-grid">
            <div className="form-group">
              <label htmlFor="targetYear1">N+1 Année</label>
              <input
                id="targetYear1"
                type="number"
                value={formData.targetYear1}
                onChange={(e) => setFormData({ ...formData, targetYear1: parseInt(e.target.value) })}
                disabled={!!viewingIndicator}
              />
            </div>
            <div className="form-group">
              <label htmlFor="targetValue1">N+1 Cible</label>
              <input
                id="targetValue1"
                type="number"
                step="0.01"
                value={formData.targetValue1}
                onChange={(e) => setFormData({ ...formData, targetValue1: parseFloat(e.target.value) })}
                disabled={!!viewingIndicator}
              />
            </div>

            <div className="form-group">
              <label htmlFor="targetYear2">N+2 Année</label>
              <input
                id="targetYear2"
                type="number"
                value={formData.targetYear2}
                onChange={(e) => setFormData({ ...formData, targetYear2: parseInt(e.target.value) })}
                disabled={!!viewingIndicator}
              />
            </div>
            <div className="form-group">
              <label htmlFor="targetValue2">N+2 Cible</label>
              <input
                id="targetValue2"
                type="number"
                step="0.01"
                value={formData.targetValue2}
                onChange={(e) => setFormData({ ...formData, targetValue2: parseFloat(e.target.value) })}
                disabled={!!viewingIndicator}
              />
            </div>

            <div className="form-group">
              <label htmlFor="targetYear3">N+3 Année</label>
              <input
                id="targetYear3"
                type="number"
                value={formData.targetYear3}
                onChange={(e) => setFormData({ ...formData, targetYear3: parseInt(e.target.value) })}
                disabled={!!viewingIndicator}
              />
            </div>
            <div className="form-group">
              <label htmlFor="targetValue3">N+3 Cible</label>
              <input
                id="targetValue3"
                type="number"
                step="0.01"
                value={formData.targetValue3}
                onChange={(e) => setFormData({ ...formData, targetValue3: parseFloat(e.target.value) })}
                disabled={!!viewingIndicator}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={!!viewingIndicator}
              />
              Actif
            </label>
          </div>
        </form>
      </Modal>

      {/* Actuals Modal */}
      <Modal
        isOpen={isActualsModalOpen}
        onClose={() => setIsActualsModalOpen(false)}
        title="Mettre à jour les valeurs réelles"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsActualsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveActuals} loading={submitting}>
              Enregistrer
            </Button>
          </>
        }
      >
        <form onSubmit={handleActualsSubmit} className="actuals-form">
          <div className="section-info">
            <p><strong>Indicateur:</strong> {editingIndicator?.name}</p>
            <p><strong>Unité:</strong> {editingIndicator?.unit}</p>
          </div>

          <div className="targets-grid">
            <div className="form-group">
              <label htmlFor="actualYear1">N+1 Année</label>
              <input
                id="actualYear1"
                type="number"
                value={actualsData.actualYear1}
                onChange={(e) => setActualsData({ ...actualsData, actualYear1: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="actualValue1">N+1 Valeur</label>
              <input
                id="actualValue1"
                type="number"
                step="0.01"
                value={actualsData.actualValue1}
                onChange={(e) => setActualsData({ ...actualsData, actualValue1: parseFloat(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="actualYear2">N+2 Année</label>
              <input
                id="actualYear2"
                type="number"
                value={actualsData.actualYear2}
                onChange={(e) => setActualsData({ ...actualsData, actualYear2: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="actualValue2">N+2 Valeur</label>
              <input
                id="actualValue2"
                type="number"
                step="0.01"
                value={actualsData.actualValue2}
                onChange={(e) => setActualsData({ ...actualsData, actualValue2: parseFloat(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="actualYear3">N+3 Année</label>
              <input
                id="actualYear3"
                type="number"
                value={actualsData.actualYear3}
                onChange={(e) => setActualsData({ ...actualsData, actualYear3: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="actualValue3">N+3 Valeur</label>
              <input
                id="actualValue3"
                type="number"
                step="0.01"
                value={actualsData.actualValue3}
                onChange={(e) => setActualsData({ ...actualsData, actualValue3: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Indicators;
