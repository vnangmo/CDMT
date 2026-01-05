import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Typography, Grid, Divider, CircularProgress } from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { WorkflowActions, WorkflowTimeline, CommentSection, StatusBadge } from '../components/workflow';
import sectoralMeasureService from '../services/sectoralMeasure.service';
import { SectoralMeasure, SectoralMeasureStatus } from '../types/sectoralMeasure.types';
import { WorkflowStatus } from '../types/workflow.types';

const SectoralMeasureDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [measure, setMeasure] = useState<SectoralMeasure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadMeasure();
    }
  }, [id]);

  const loadMeasure = async () => {
    try {
      setLoading(true);
      const data = await sectoralMeasureService.getSectoralMeasure(id!);
      setMeasure(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      alert('Erreur lors du chargement de la mesure');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = () => {
    loadMeasure();
  };

  const handleExportPdf = async () => {
    try {
      await sectoralMeasureService.exportToPdf(id!);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      await sectoralMeasureService.exportToExcel(id!);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  const handleExportCsv = async () => {
    try {
      await sectoralMeasureService.exportToCsv(id!);
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      alert('Erreur lors de l\'export CSV');
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!measure) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6" color="error">
          Mesure non trouvée
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {measure.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Code: {measure.measureCode}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <StatusBadge status={measure.status as unknown as WorkflowStatus} size="medium" />
          <Button onClick={handleExportPdf} variant="secondary" size="small">
            Export PDF
          </Button>
          <Button onClick={handleExportExcel} variant="secondary" size="small">
            Export Excel
          </Button>
          <Button onClick={handleExportCsv} variant="secondary" size="small">
            Export CSV
          </Button>
          <Button onClick={() => navigate('/sectoral-measures')} variant="secondary">
            Retour
          </Button>
        </Box>
      </Box>

      {/* Workflow Actions */}
      <Box mb={3}>
        <WorkflowActions
          documentType="SECTORAL_MEASURE"
          documentId={measure.id}
          currentStatus={measure.status as unknown as WorkflowStatus}
          onStatusChange={handleStatusChange}
        />
      </Box>

      <div className="detail-content">
        <div className="detail-card">
          <h2>Informations Générales</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Code Mesure</label>
              <span>{measure.measureCode}</span>
            </div>
            <div className="detail-item">
              <label>Nom</label>
              <span>{measure.name}</span>
            </div>
            <div className="detail-item">
              <label>Ministère</label>
              <span>{measure.ministry?.name || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Type d'Entité</label>
              <span>{measure.entityType}</span>
            </div>
            <div className="detail-item">
              <label>Année Fiscale</label>
              <span>{measure.fiscalYear}</span>
            </div>
            <div className="detail-item">
              <label>Statut</label>
              <span className={`status-badge ${measure.status.toLowerCase()}`}>
                {measure.status}
              </span>
            </div>
            <div className="detail-item">
              <label>Catégorie</label>
              <span>{measure.category || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Priorité</label>
              <span>{measure.priority || '-'}</span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>Coûts Multi-Années</h2>
          <div className="cost-table">
            <table>
              <thead>
                <tr>
                  <th>Année</th>
                  <th>Quantité</th>
                  <th>Coût Unitaire</th>
                  <th>Coût Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>N+1</td>
                  <td>{measure.quantityY1}</td>
                  <td>{formatCurrency(measure.unitCostY1)}</td>
                  <td className="font-bold">{formatCurrency(measure.totalCostY1)}</td>
                </tr>
                <tr>
                  <td>N+2</td>
                  <td>{measure.quantityY2}</td>
                  <td>{formatCurrency(measure.unitCostY2)}</td>
                  <td className="font-bold">{formatCurrency(measure.totalCostY2)}</td>
                </tr>
                <tr>
                  <td>N+3</td>
                  <td>{measure.quantityY3}</td>
                  <td>{formatCurrency(measure.unitCostY3)}</td>
                  <td className="font-bold">{formatCurrency(measure.totalCostY3)}</td>
                </tr>
                <tr className="total-row">
                  <td colSpan={3}>TOTAL</td>
                  <td className="font-bold">{formatCurrency(measure.totalCost)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="detail-card">
          <h2>Classification</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Nature Économique</label>
              <span>{measure.economicNature?.name || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Source de Financement</label>
              <span>{measure.fundingSource?.name || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Programme</label>
              <span>{measure.program?.name || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Action</label>
              <span>{measure.action?.name || '-'}</span>
            </div>
            {measure.activity && (
              <div className="detail-item">
                <label>Activité</label>
                <span>{measure.activity.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-card">
          <h2>Justification et Impact</h2>
          <div className="detail-section">
            <div className="detail-item full-width">
              <label>Justification</label>
              <p className="text-content">{measure.justification || '-'}</p>
            </div>
            <div className="detail-item full-width">
              <label>Impact Attendu</label>
              <p className="text-content">{measure.expectedImpact || '-'}</p>
            </div>
            <div className="detail-item full-width">
              <label>Indicateur de Performance</label>
              <p className="text-content">{measure.performanceIndicator || '-'}</p>
            </div>
            <div className="detail-item full-width">
              <label>Description</label>
              <p className="text-content">{measure.description || '-'}</p>
            </div>
          </div>
        </div>

        {/* Workflow Timeline */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Historique du Workflow
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <WorkflowTimeline documentType="SECTORAL_MEASURE" documentId={measure.id} />
        </Paper>

        {/* Comments Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <CommentSection documentType="SECTORAL_MEASURE" documentId={measure.id} allowInternal />
        </Paper>

        <div className="detail-card">
          <h2>Métadonnées</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Créé le</label>
              <span>{formatDate(measure.createdAt)}</span>
            </div>
            <div className="detail-item">
              <label>Créé par</label>
              <span>{measure.createdBy || '-'}</span>
            </div>
            <div className="detail-item">
              <label>Modifié le</label>
              <span>{formatDate(measure.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default SectoralMeasureDetail;
