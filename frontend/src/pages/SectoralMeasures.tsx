import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import sectoralMeasureService from '../services/sectoralMeasure.service';
import referentielService from '../services/referentiel.service';
import {
  SectoralMeasure,
  CreateSectoralMeasureDto,
  EntityType,
  SectoralMeasureStatus,
} from '../types/sectoralMeasure.types';
import { Ministry, EconomicNature, FundingSource } from '../types/referentiel.types';

const SectoralMeasures: React.FC = () => {
  const navigate = useNavigate();
  const [measures, setMeasures] = useState<SectoralMeasure[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [economicNatures, setEconomicNatures] = useState<EconomicNature[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeasure, setEditingMeasure] = useState<SectoralMeasure | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateSectoralMeasureDto>({
    measureCode: '',
    name: '',
    description: '',
    entityType: EntityType.ACTION,
    ministryId: '',
    fiscalYear: new Date().getFullYear(),
    quantityY1: 0,
    unitCostY1: 0,
    quantityY2: 0,
    unitCostY2: 0,
    quantityY3: 0,
    unitCostY3: 0,
  });

  // Computed totals
  const totalCostY1 = formData.quantityY1! * formData.unitCostY1!;
  const totalCostY2 = formData.quantityY2! * formData.unitCostY2!;
  const totalCostY3 = formData.quantityY3! * formData.unitCostY3!;
  const totalCost = totalCostY1 + totalCostY2 + totalCostY3;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [measuresData, ministriesData, economicNaturesData, fundingSourcesData] = await Promise.all([
        sectoralMeasureService.getSectoralMeasures(),
        referentielService.getMinistries(),
        referentielService.getEconomicNatures(),
        referentielService.getFundingSources(),
      ]);
      setMeasures(Array.isArray(measuresData) ? measuresData : []);
      setMinistries(Array.isArray(ministriesData) ? ministriesData : []);
      setEconomicNatures(Array.isArray(economicNaturesData) ? economicNaturesData : []);
      setFundingSources(Array.isArray(fundingSourcesData) ? fundingSourcesData : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingMeasure(null);
    setFormData({
      measureCode: '',
      name: '',
      description: '',
      entityType: EntityType.ACTION,
      ministryId: '',
      fiscalYear: new Date().getFullYear(),
      quantityY1: 0,
      unitCostY1: 0,
      quantityY2: 0,
      unitCostY2: 0,
      quantityY3: 0,
      unitCostY3: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (measure: SectoralMeasure) => {
    setEditingMeasure(measure);
    setFormData({
      measureCode: measure.measureCode,
      name: measure.name,
      nameAr: measure.nameAr,
      nameEn: measure.nameEn,
      description: measure.description,
      entityType: measure.entityType,
      ministryId: measure.ministryId,
      programId: measure.programId,
      actionId: measure.actionId,
      activityId: measure.activityId,
      category: measure.category,
      priority: measure.priority,
      quantityY1: measure.quantityY1,
      unitCostY1: measure.unitCostY1,
      quantityY2: measure.quantityY2,
      unitCostY2: measure.unitCostY2,
      quantityY3: measure.quantityY3,
      unitCostY3: measure.unitCostY3,
      economicNatureId: measure.economicNatureId,
      fundingSourceId: measure.fundingSourceId,
      justification: measure.justification,
      expectedImpact: measure.expectedImpact,
      performanceIndicator: measure.performanceIndicator,
      fiscalYear: measure.fiscalYear,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (measure: SectoralMeasure) => {
    if (window.confirm(`Supprimer la mesure "${measure.name}" ?`)) {
      try {
        await sectoralMeasureService.deleteSectoralMeasure(measure.id);
        await loadData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la mesure');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingMeasure) {
        await sectoralMeasureService.updateSectoralMeasure(editingMeasure.id, formData);
      } else {
        await sectoralMeasureService.createSectoralMeasure(formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de l\'enregistrement de la mesure');
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

  const getStatusBadgeClass = (status: SectoralMeasureStatus) => {
    const statusMap: Record<SectoralMeasureStatus, string> = {
      [SectoralMeasureStatus.DRAFT]: 'draft',
      [SectoralMeasureStatus.PROPOSED]: 'proposed',
      [SectoralMeasureStatus.VALIDATED]: 'validated',
      [SectoralMeasureStatus.INTEGRATED]: 'integrated',
      [SectoralMeasureStatus.REJECTED]: 'rejected',
    };
    return statusMap[status] || 'draft';
  };

  const columns: Column<SectoralMeasure>[] = [
    {
      key: 'measureCode',
      header: 'Code',
      width: '10%',
    },
    {
      key: 'name',
      header: 'Nom de la Mesure',
      width: '25%',
    },
    {
      key: 'ministry',
      header: 'Ministère',
      width: '15%',
      render: (item) => item.ministry?.name || '-',
    },
    {
      key: 'entityType',
      header: 'Type',
      width: '10%',
    },
    {
      key: 'totalCost',
      header: 'Coût Total',
      width: '12%',
      render: (item) => formatCurrency(item.totalCost),
    },
    {
      key: 'fiscalYear',
      header: 'Année',
      width: '8%',
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
    <div className="sectoral-measures-page">
      <PageHeader
        title="Mesures Nouvelles Sectorielles"
        subtitle="Propositions de nouvelles mesures par ministère"
        action={
          <Button onClick={handleCreate} variant="primary">
            Nouvelle Mesure
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={measures}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={(measure) => navigate(`/sectoral-measures/${measure.id}`)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMeasure ? 'Modifier Mesure Sectorielle' : 'Nouvelle Mesure Sectorielle'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="form">
          <div className="form-grid">
            <div className="form-group">
              <label>Code Mesure *</label>
              <input
                type="text"
                value={formData.measureCode}
                onChange={(e) => setFormData({ ...formData, measureCode: e.target.value })}
                required
                disabled={!!editingMeasure}
              />
            </div>

            <div className="form-group">
              <label>Nom de la Mesure *</label>
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
              <label>Type d'Entité *</label>
              <select
                value={formData.entityType}
                onChange={(e) => setFormData({ ...formData, entityType: e.target.value as EntityType })}
                required
              >
                <option value={EntityType.ACTION}>Action</option>
                <option value={EntityType.ACTIVITY}>Activité</option>
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
              <label>Nature Économique</label>
              <select
                value={formData.economicNatureId || ''}
                onChange={(e) => setFormData({ ...formData, economicNatureId: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                {economicNatures.map((en) => (
                  <option key={en.id} value={en.id}>
                    {en.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Source de Financement</label>
              <select
                value={formData.fundingSourceId || ''}
                onChange={(e) => setFormData({ ...formData, fundingSourceId: e.target.value })}
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
              <label>Catégorie</label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: PERSONNEL, FONCTIONNEMENT, INVESTISSEMENT"
              />
            </div>

            {/* Year 1 Costing */}
            <div className="form-group-header full-width">
              <h3>Année N+1 (Coûts)</h3>
            </div>

            <div className="form-group">
              <label>Quantité N+1</label>
              <input
                type="number"
                value={formData.quantityY1}
                onChange={(e) => setFormData({ ...formData, quantityY1: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Coût Unitaire N+1 (DJF)</label>
              <input
                type="number"
                value={formData.unitCostY1}
                onChange={(e) => setFormData({ ...formData, unitCostY1: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Coût Total N+1</label>
              <input
                type="text"
                value={formatCurrency(totalCostY1)}
                disabled
                className="calculated-field"
              />
            </div>

            {/* Year 2 Costing */}
            <div className="form-group-header full-width">
              <h3>Année N+2 (Coûts)</h3>
            </div>

            <div className="form-group">
              <label>Quantité N+2</label>
              <input
                type="number"
                value={formData.quantityY2}
                onChange={(e) => setFormData({ ...formData, quantityY2: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Coût Unitaire N+2 (DJF)</label>
              <input
                type="number"
                value={formData.unitCostY2}
                onChange={(e) => setFormData({ ...formData, unitCostY2: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Coût Total N+2</label>
              <input
                type="text"
                value={formatCurrency(totalCostY2)}
                disabled
                className="calculated-field"
              />
            </div>

            {/* Year 3 Costing */}
            <div className="form-group-header full-width">
              <h3>Année N+3 (Coûts)</h3>
            </div>

            <div className="form-group">
              <label>Quantité N+3</label>
              <input
                type="number"
                value={formData.quantityY3}
                onChange={(e) => setFormData({ ...formData, quantityY3: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Coût Unitaire N+3 (DJF)</label>
              <input
                type="number"
                value={formData.unitCostY3}
                onChange={(e) => setFormData({ ...formData, unitCostY3: Number(e.target.value) })}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Coût Total N+3</label>
              <input
                type="text"
                value={formatCurrency(totalCostY3)}
                disabled
                className="calculated-field"
              />
            </div>

            {/* Total Cost Summary */}
            <div className="form-group-header full-width">
              <h3>Coût Total: {formatCurrency(totalCost)}</h3>
            </div>

            {/* Justification Section */}
            <div className="form-group full-width">
              <label>Justification</label>
              <textarea
                value={formData.justification || ''}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                rows={3}
                placeholder="Justification de la mesure nouvelle..."
              />
            </div>

            <div className="form-group full-width">
              <label>Impact Attendu</label>
              <textarea
                value={formData.expectedImpact || ''}
                onChange={(e) => setFormData({ ...formData, expectedImpact: e.target.value })}
                rows={3}
                placeholder="Impact attendu de la mesure..."
              />
            </div>

            <div className="form-group full-width">
              <label>Indicateur de Performance</label>
              <input
                type="text"
                value={formData.performanceIndicator || ''}
                onChange={(e) => setFormData({ ...formData, performanceIndicator: e.target.value })}
                placeholder="Ex: Taux d'achèvement, nombre de bénéficiaires..."
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

export default SectoralMeasures;
