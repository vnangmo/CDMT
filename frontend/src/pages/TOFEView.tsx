import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import tofeService from '../services/tofe.service';
import macroService from '../services/macro.service';
import { TOFEDocument, TOFELine, TOFESummary } from '../types/tofe.types';
import { MacroFramework } from '../types/macro.types';
import PageHeader from '../components/common/PageHeader';
import './TOFEView.css';

const TOFEView: React.FC = () => {
  const { macroFrameworkId } = useParams<{ macroFrameworkId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [macroFramework, setMacroFramework] = useState<MacroFramework | null>(null);
  const [tofeDocument, setTofeDocument] = useState<TOFEDocument | null>(null);
  const [summary, setSummary] = useState<TOFESummary | null>(null);
  const [activeTab, setActiveTab] = useState<'document' | 'analysis'>('document');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (macroFrameworkId) {
      loadData();
    }
  }, [macroFrameworkId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load macro framework
      const macro = await macroService.getMacroFramework(macroFrameworkId!);
      setMacroFramework(macro);

      // Try to load existing TOFE document
      const existingTofe = await tofeService.getTOFEByMacroFrameworkAndYear(
        macroFrameworkId!,
        macro.budgetYear
      );

      if (existingTofe) {
        setTofeDocument(existingTofe);
        await loadSummary(existingTofe.id);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (tofeId: string) => {
    try {
      const summaryData = await tofeService.getTOFESummary(tofeId);
      setSummary(summaryData);
    } catch (error: any) {
      console.error('Error loading summary:', error);
    }
  };

  const handleGenerate = async () => {
    if (!macroFrameworkId) return;

    try {
      setGenerating(true);
      const newTofe = await tofeService.generateTOFE(macroFrameworkId);
      setTofeDocument(newTofe);
      await loadSummary(newTofe.id);
      alert('TOFE généré avec succès!');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la génération du TOFE');
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async () => {
    if (!tofeDocument) return;

    try {
      const updated = await tofeService.validateTOFEDocument(tofeDocument.id);
      setTofeDocument(updated);
      alert('TOFE validé avec succès!');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la validation du TOFE');
    }
  };

  const handleApprove = async () => {
    if (!tofeDocument) return;

    try {
      const updated = await tofeService.approveTOFEDocument(tofeDocument.id);
      setTofeDocument(updated);
      alert('TOFE approuvé avec succès!');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'approbation du TOFE');
    }
  };

  const handleExportExcel = async () => {
    if (!tofeDocument) return;

    try {
      setExporting(true);
      const blob = await tofeService.exportToExcel(tofeDocument.id);
      tofeService.downloadBlob(blob, `${tofeDocument.documentCode}.xlsx`);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!tofeDocument) return;

    try {
      setExporting(true);
      const blob = await tofeService.exportToPDF(tofeDocument.id);
      tofeService.downloadBlob(blob, `${tofeDocument.documentCode}.pdf`);
    } catch (error: any) {
      alert(error.message || 'Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  const formatAmount = (amount: string | number | undefined): string => {
    if (!amount) return '0.00';
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'DRAFT':
        return 'status-draft';
      case 'VALIDATED':
        return 'status-validated';
      case 'APPROVED':
        return 'status-approved';
      default:
        return '';
    }
  };

  const renderLineRow = (line: TOFELine) => {
    const indent = '  '.repeat(line.lineLevel);
    const className = `tofe-line ${line.isBold ? 'bold' : ''} ${
      line.section === 'BALANCE' ? 'balance-line' : ''
    } level-${line.lineLevel}`;

    return (
      <tr key={line.id} className={className}>
        <td className="line-code">{line.lineCode}</td>
        <td className="line-label">
          {indent}
          {line.lineLabel}
        </td>
        <td className="line-gfs">{line.gfsCode || '-'}</td>
        <td className="line-amount">{formatAmount(line.baseAmount)}</td>
        <td className="line-amount">{formatAmount(line.amount1)}</td>
        <td className="line-amount">{formatAmount(line.amount2)}</td>
        {line.amount3 !== undefined && (
          <td className="line-amount">{formatAmount(line.amount3)}</td>
        )}
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="tofe-view-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!macroFramework) {
    return (
      <div className="tofe-view-page">
        <div className="error-container">
          <p>Cadre macroéconomique non trouvé</p>
          <Link to="/macro/frameworks" className="btn btn-primary">
            Retour aux cadres macroéconomiques
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tofe-view-page">
      <PageHeader
        title={`TOFE Prévisionnel ${macroFramework.budgetYear}`}
        subtitle={`Cadre Macroéconomique ${macroFramework.year}-${macroFramework.budgetYear}`}
      />

      <div className="tofe-header-actions">
        <Link to="/macro/frameworks" className="btn btn-secondary">
          ← Retour
        </Link>

        {!tofeDocument && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-success"
          >
            {generating ? 'Génération...' : 'Générer le TOFE'}
          </button>
        )}

        {tofeDocument && (
          <>
            {tofeDocument.status === 'DRAFT' && (
              <button onClick={handleValidate} className="btn btn-primary">
                Valider
              </button>
            )}

            {tofeDocument.status === 'VALIDATED' && (
              <button onClick={handleApprove} className="btn btn-success">
                Approuver
              </button>
            )}

            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="btn btn-secondary"
            >
              {exporting ? 'Export...' : 'Export Excel'}
            </button>

            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="btn btn-secondary"
            >
              {exporting ? 'Export...' : 'Export PDF'}
            </button>
          </>
        )}
      </div>

      {tofeDocument && (
        <>
          <div className="tofe-info-card">
            <div className="info-row">
              <div className="info-item">
                <label>Code</label>
                <p>{tofeDocument.documentCode}</p>
              </div>
              <div className="info-item">
                <label>Titre</label>
                <p>{tofeDocument.title}</p>
              </div>
              <div className="info-item">
                <label>Année fiscale</label>
                <p>{tofeDocument.fiscalYear}</p>
              </div>
              <div className="info-item">
                <label>Statut</label>
                <p>
                  <span className={`status-badge ${getStatusBadgeClass(tofeDocument.status)}`}>
                    {tofeDocument.status}
                  </span>
                </p>
              </div>
              <div className="info-item">
                <label>Unité</label>
                <p>
                  {tofeDocument.unit} {tofeDocument.currency}
                </p>
              </div>
            </div>
          </div>

          <div className="tofe-tabs">
            <button
              className={`tab-button ${activeTab === 'document' ? 'active' : ''}`}
              onClick={() => setActiveTab('document')}
            >
              Document TOFE
            </button>
            <button
              className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              Analyse & Cohérence
            </button>
          </div>

          {activeTab === 'document' && (
            <div className="tofe-document-section">
              <div className="tofe-table-container">
                <table className="tofe-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Code</th>
                      <th style={{ width: '400px' }}>Libellé</th>
                      <th style={{ width: '80px' }}>GFS</th>
                      <th style={{ width: '120px' }}>
                        {tofeDocument.lines?.[0]?.baseYear || 'N'}
                      </th>
                      <th style={{ width: '120px' }}>
                        {tofeDocument.lines?.[0]?.projectionYear1 || 'N+1'}
                      </th>
                      <th style={{ width: '120px' }}>
                        {tofeDocument.lines?.[0]?.projectionYear2 || 'N+2'}
                      </th>
                      {tofeDocument.lines?.[0]?.projectionYear3 && (
                        <th style={{ width: '120px' }}>
                          {tofeDocument.lines[0].projectionYear3}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tofeDocument.lines?.map((line) => renderLineRow(line))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && summary && (
            <div className="tofe-analysis-section">
              {/* Soldes budgétaires */}
              <div className="analysis-card">
                <h3>Soldes Budgétaires</h3>
                <div className="balance-grid">
                  {summary.balances.map((balance) => (
                    <div key={balance.year} className="balance-card">
                      <h4>Année {balance.year}</h4>
                      <div className="balance-details">
                        <div className="balance-row">
                          <span className="balance-label">Recettes</span>
                          <span className="balance-amount revenue">
                            {formatAmount(balance.revenue)}
                          </span>
                        </div>
                        <div className="balance-row">
                          <span className="balance-label">Dépenses</span>
                          <span className="balance-amount expense">
                            {formatAmount(balance.expense)}
                          </span>
                        </div>
                        <div className="balance-row total">
                          <span className="balance-label">Solde</span>
                          <span
                            className={`balance-amount ${
                              balance.type === 'SURPLUS'
                                ? 'surplus'
                                : balance.type === 'DEFICIT'
                                ? 'deficit'
                                : 'balanced'
                            }`}
                          >
                            {formatAmount(balance.balance)}
                          </span>
                        </div>
                        <div className="balance-type">
                          <span className={`type-badge ${balance.type.toLowerCase()}`}>
                            {balance.type === 'SURPLUS'
                              ? 'EXCÉDENT'
                              : balance.type === 'DEFICIT'
                              ? 'DÉFICIT'
                              : 'ÉQUILIBRÉ'}
                          </span>
                          <span className="balance-ratio">{balance.balanceRatio}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ratios budgétaires */}
              <div className="analysis-card">
                <h3>Ratios Budgétaires</h3>
                <table className="ratios-table">
                  <thead>
                    <tr>
                      <th>Année</th>
                      <th>Croissance Recettes</th>
                      <th>Croissance Dépenses</th>
                      <th>Dépenses/Recettes</th>
                      <th>Solde/Recettes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.ratios.map((ratio) => (
                      <tr key={ratio.year}>
                        <td>{ratio.year}</td>
                        <td className="ratio-value">{ratio.revenueGrowth}</td>
                        <td className="ratio-value">{ratio.expenseGrowth}</td>
                        <td className="ratio-value">{ratio.expenseToRevenueRatio}</td>
                        <td className="ratio-value">{ratio.balanceToRevenueRatio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cohérence */}
              <div className="analysis-card">
                <h3>Vérification de Cohérence</h3>
                <div className="consistency-status">
                  <span
                    className={`consistency-badge ${
                      summary.consistency.isConsistent ? 'success' : 'error'
                    }`}
                  >
                    {summary.consistency.isConsistent ? 'COHÉRENT' : 'ERREURS DÉTECTÉES'}
                  </span>
                </div>

                {summary.consistency.errors.length > 0 && (
                  <div className="consistency-messages errors">
                    <h4>Erreurs</h4>
                    <ul>
                      {summary.consistency.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.consistency.warnings.length > 0 && (
                  <div className="consistency-messages warnings">
                    <h4>Avertissements</h4>
                    <ul>
                      {summary.consistency.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.consistency.isConsistent &&
                  summary.consistency.warnings.length === 0 && (
                    <p className="no-issues">Aucune erreur ou avertissement détecté.</p>
                  )}
              </div>
            </div>
          )}
        </>
      )}

      {!tofeDocument && (
        <div className="tofe-empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <h3>Aucun document TOFE</h3>
          <p>
            Cliquez sur "Générer le TOFE" pour créer automatiquement le document à partir du
            cadre macroéconomique.
          </p>
        </div>
      )}
    </div>
  );
};

export default TOFEView;
