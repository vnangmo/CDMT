import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import sectoralMeasureService from '../services/sectoralMeasure.service';
import referentielService from '../services/referentiel.service';
import {
  ValidationReport,
  CeilingValidation,
  AvailableMargin,
  IntegrationStatus,
  IntegrationPreview,
} from '../types/sectoralMeasure.types';
import { Ministry } from '../types/referentiel.types';

const SectoralMeasureValidation: React.FC = () => {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistry, setSelectedMinistry] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [ceilingValidation, setCeilingValidation] = useState<CeilingValidation | null>(null);
  const [availableMargin, setAvailableMargin] = useState<AvailableMargin | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [integrationPreview, setIntegrationPreview] = useState<IntegrationPreview | null>(null);

  useEffect(() => {
    loadMinistries();
  }, []);

  const loadMinistries = async () => {
    try {
      const data = await referentielService.getMinistries();
      setMinistries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const handleValidate = async () => {
    if (!selectedMinistry) {
      alert('Veuillez sélectionner un ministère');
      return;
    }

    try {
      setLoading(true);
      const [report, ceiling, margin, status, preview] = await Promise.all([
        sectoralMeasureService.generateValidationReport(selectedMinistry, fiscalYear),
        sectoralMeasureService.validateMinisteryCeiling(selectedMinistry, fiscalYear),
        sectoralMeasureService.calculateAvailableMargin(selectedMinistry, fiscalYear),
        sectoralMeasureService.getIntegrationStatus(selectedMinistry, fiscalYear),
        sectoralMeasureService.previewIntegration(selectedMinistry, fiscalYear),
      ]);

      setValidationReport(report);
      setCeilingValidation(ceiling);
      setAvailableMargin(margin);
      setIntegrationStatus(status);
      setIntegrationPreview(preview);
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert('Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrate = async () => {
    if (!selectedMinistry) return;

    if (!ceilingValidation?.isValid) {
      alert('Impossible d\'intégrer: des dépassements de plafond ont été détectés');
      return;
    }

    if (window.confirm('Intégrer les mesures validées dans les plafonds ministériels ?')) {
      try {
        setActionLoading(true);
        const result = await sectoralMeasureService.integrateMinistryMeasures(
          selectedMinistry,
          fiscalYear
        );

        if (result.success) {
          alert(`Intégration réussie: ${result.measuresIntegrated} mesure(s) intégrée(s)`);
          handleValidate(); // Refresh data
        } else {
          alert(`Erreurs lors de l'intégration:\n${result.errors.join('\n')}`);
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'intégration');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRollback = async () => {
    if (!selectedMinistry) return;

    if (window.confirm('Annuler l\'intégration des mesures ?')) {
      try {
        setActionLoading(true);
        const result = await sectoralMeasureService.rollbackIntegration(selectedMinistry, fiscalYear);
        alert(`Rollback réussi: ${result.measuresRolledBack} mesure(s) restaurée(s)`);
        handleValidate(); // Refresh data
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du rollback');
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="sectoral-validation-page">
      <PageHeader
        title="Validation et Intégration"
        subtitle="Contrôle des plafonds et intégration des mesures sectorielles"
      />

      <div className="validation-controls">
        <div className="form-group">
          <label>Ministère *</label>
          <select
            value={selectedMinistry}
            onChange={(e) => setSelectedMinistry(e.target.value)}
          >
            <option value="">Sélectionner un ministère...</option>
            {ministries.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Année Fiscale</label>
          <input
            type="number"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(Number(e.target.value))}
            min="2024"
            max="2050"
          />
        </div>

        <Button
          onClick={handleValidate}
          variant="primary"
          disabled={!selectedMinistry || loading}
        >
          {loading ? 'Validation en cours...' : 'Valider'}
        </Button>
      </div>

      {ceilingValidation && (
        <div className="validation-results">
          {/* Overall Status */}
          <div className={`validation-status-card ${ceilingValidation.isValid ? 'valid' : 'invalid'}`}>
            <div className="status-icon">
              {ceilingValidation.isValid ? '✓' : '⚠'}
            </div>
            <div className="status-content">
              <h2>{ceilingValidation.isValid ? 'Validation Réussie' : 'Dépassements Détectés'}</h2>
              <p>
                {ceilingValidation.isValid
                  ? 'Toutes les mesures respectent les plafonds ministériels'
                  : `${ceilingValidation.totalExceedances} dépassement(s) de plafond détecté(s)`}
              </p>
            </div>
          </div>

          {/* Ceiling Exceedances */}
          {ceilingValidation.hasExceedances && (
            <div className="detail-card exceedances-card">
              <h2>Dépassements de Plafond</h2>
              <div className="exceedances-table">
                <table>
                  <thead>
                    <tr>
                      <th>Année</th>
                      <th>Plafond</th>
                      <th>Montant Projeté</th>
                      <th>Dépassement</th>
                      <th>%</th>
                      <th>Sévérité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ceilingValidation.exceedances.map((exc, index) => (
                      <tr key={index} className={exc.severity.toLowerCase()}>
                        <td>{exc.year}</td>
                        <td>{formatCurrency(exc.ceiling)}</td>
                        <td>{formatCurrency(exc.projectedAmount)}</td>
                        <td className="exceedance-amount">{formatCurrency(exc.exceedance)}</td>
                        <td>{formatPercentage(exc.exceedancePercentage)}</td>
                        <td>
                          <span className={`severity-badge ${exc.severity.toLowerCase()}`}>
                            {exc.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Available Margin */}
          {availableMargin && (
            <div className="detail-card margin-card">
              <h2>Marges Disponibles</h2>
              <div className="margin-grid">
                <div className="margin-item">
                  <h3>Année N+1</h3>
                  <div className="margin-details">
                    <div className="margin-row">
                      <label>Plafond:</label>
                      <span>{formatCurrency(availableMargin.year1.ceiling)}</span>
                    </div>
                    <div className="margin-row">
                      <label>Utilisé:</label>
                      <span>{formatCurrency(availableMargin.year1.used)}</span>
                    </div>
                    <div className="margin-row total">
                      <label>Disponible:</label>
                      <span className={availableMargin.year1.available < 0 ? 'negative' : 'positive'}>
                        {formatCurrency(availableMargin.year1.available)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, (availableMargin.year1.used / availableMargin.year1.ceiling) * 100)}%`,
                          backgroundColor: availableMargin.year1.available < 0 ? '#e74c3c' : '#3498db',
                        }}
                      />
                      <span className="progress-text">
                        {formatPercentage((availableMargin.year1.used / availableMargin.year1.ceiling) * 100)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="margin-item">
                  <h3>Année N+2</h3>
                  <div className="margin-details">
                    <div className="margin-row">
                      <label>Plafond:</label>
                      <span>{formatCurrency(availableMargin.year2.ceiling)}</span>
                    </div>
                    <div className="margin-row">
                      <label>Utilisé:</label>
                      <span>{formatCurrency(availableMargin.year2.used)}</span>
                    </div>
                    <div className="margin-row total">
                      <label>Disponible:</label>
                      <span className={availableMargin.year2.available < 0 ? 'negative' : 'positive'}>
                        {formatCurrency(availableMargin.year2.available)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, (availableMargin.year2.used / availableMargin.year2.ceiling) * 100)}%`,
                          backgroundColor: availableMargin.year2.available < 0 ? '#e74c3c' : '#3498db',
                        }}
                      />
                      <span className="progress-text">
                        {formatPercentage((availableMargin.year2.used / availableMargin.year2.ceiling) * 100)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="margin-item">
                  <h3>Année N+3</h3>
                  <div className="margin-details">
                    <div className="margin-row">
                      <label>Plafond:</label>
                      <span>{formatCurrency(availableMargin.year3.ceiling)}</span>
                    </div>
                    <div className="margin-row">
                      <label>Utilisé:</label>
                      <span>{formatCurrency(availableMargin.year3.used)}</span>
                    </div>
                    <div className="margin-row total">
                      <label>Disponible:</label>
                      <span className={availableMargin.year3.available < 0 ? 'negative' : 'positive'}>
                        {formatCurrency(availableMargin.year3.available)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, (availableMargin.year3.used / availableMargin.year3.ceiling) * 100)}%`,
                          backgroundColor: availableMargin.year3.available < 0 ? '#e74c3c' : '#3498db',
                        }}
                      />
                      <span className="progress-text">
                        {formatPercentage((availableMargin.year3.used / availableMargin.year3.ceiling) * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integration Status */}
          {integrationStatus && (
            <div className="detail-card integration-status-card">
              <h2>Statut d'Intégration</h2>
              <div className="status-grid">
                <div className="status-item">
                  <label>Total Mesures</label>
                  <span className="status-value">{integrationStatus.total}</span>
                </div>
                <div className="status-item">
                  <label>Brouillon</label>
                  <span className="status-value draft">{integrationStatus.byStatus.draft}</span>
                </div>
                <div className="status-item">
                  <label>Proposées</label>
                  <span className="status-value proposed">{integrationStatus.byStatus.proposed}</span>
                </div>
                <div className="status-item">
                  <label>Validées</label>
                  <span className="status-value validated">{integrationStatus.byStatus.validated}</span>
                </div>
                <div className="status-item">
                  <label>Intégrées</label>
                  <span className="status-value integrated">{integrationStatus.byStatus.integrated}</span>
                </div>
                <div className="status-item">
                  <label>Rejetées</label>
                  <span className="status-value rejected">{integrationStatus.byStatus.rejected}</span>
                </div>
              </div>

              <div className="integration-actions">
                {integrationStatus.status.canIntegrate && (
                  <Button
                    onClick={handleIntegrate}
                    variant="primary"
                    disabled={!ceilingValidation.isValid || actionLoading}
                  >
                    Intégrer ({integrationStatus.byStatus.validated} mesure(s))
                  </Button>
                )}
                {integrationStatus.status.canRollback && (
                  <Button
                    onClick={handleRollback}
                    variant="danger"
                    disabled={actionLoading}
                  >
                    Annuler l'Intégration
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Integration Preview */}
          {integrationPreview && integrationPreview.canProceed && (
            <div className="detail-card preview-card">
              <h2>Aperçu de l'Intégration</h2>
              <p className="preview-message">{integrationPreview.message}</p>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>Année</th>
                      <th>Plafond Actuel</th>
                      <th>Nouvelles Mesures</th>
                      <th>Nouveau Plafond</th>
                      <th>Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integrationPreview.impact.map((imp, index) => (
                      <tr key={index}>
                        <td>{imp.year}</td>
                        <td>{formatCurrency(imp.currentCeiling)}</td>
                        <td className="new-measures">{formatCurrency(imp.newMeasuresAmount)}</td>
                        <td className="font-bold">{formatCurrency(imp.updatedCeiling)}</td>
                        <td className={imp.delta >= 0 ? 'positive' : 'negative'}>
                          {imp.delta >= 0 ? '+' : ''}{formatCurrency(imp.delta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warnings and Errors */}
          {(ceilingValidation.warnings.length > 0 || ceilingValidation.errors.length > 0) && (
            <div className="detail-card messages-card">
              {ceilingValidation.errors.length > 0 && (
                <div className="messages-section errors">
                  <h3>Erreurs</h3>
                  <ul>
                    {ceilingValidation.errors.map((err, index) => (
                      <li key={index} className="error-message">{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ceilingValidation.warnings.length > 0 && (
                <div className="messages-section warnings">
                  <h3>Avertissements</h3>
                  <ul>
                    {ceilingValidation.warnings.map((warn, index) => (
                      <li key={index} className="warning-message">{warn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SectoralMeasureValidation;
