import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import cbmtService from '../services/cbmt.service';
import { CBMTDocument } from '../types/cbmt.types';
import './CBMTList.css';

const CBMTList: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<CBMTDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [macroFrameworkId, setMacroFrameworkId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadDocuments();
  }, [fiscalYearFilter, statusFilter, currentPage]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (fiscalYearFilter) params.fiscalYear = parseInt(fiscalYearFilter);
      if (statusFilter) params.status = statusFilter;

      const result = await cbmtService.getCBMTDocuments(params);
      setDocuments(result.data);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error('Error loading CBMT documents:', error);
      alert(error.response?.data?.message || 'Erreur lors du chargement des documents CBMT');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromTOFE = async () => {
    if (!macroFrameworkId.trim()) {
      alert('Veuillez entrer un ID de cadre macroéconomique');
      return;
    }

    try {
      setSubmitting(true);
      const newDocument = await cbmtService.generateCBMTFromTOFE(macroFrameworkId);
      setIsGenerateModalOpen(false);
      setMacroFrameworkId('');
      alert('CBMT généré avec succès depuis le TOFE');
      await loadDocuments();
      navigate(`/macro/cbmt/${newDocument.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la génération du CBMT');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce document CBMT ?')) return;

    try {
      await cbmtService.deleteCBMTDocument(id);
      alert('Document supprimé avec succès');
      await loadDocuments();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const columns: Column<CBMTDocument>[] = [
    {
      key: 'documentCode',
      header: 'Code',
      render: (doc: CBMTDocument) => doc.documentCode,
    },
    {
      key: 'title',
      header: 'Titre',
      render: (doc: CBMTDocument) => doc.title,
    },
    {
      key: 'fiscalYear',
      header: 'Année fiscale',
      render: (doc: CBMTDocument) => doc.fiscalYear,
    },
    {
      key: 'scenarioName',
      header: 'Scénario',
      render: (doc: CBMTDocument) => doc.scenarioName,
    },
    {
      key: 'totalRevenueCeiling',
      header: 'Plafond Recettes',
      render: (doc: CBMTDocument) => (
        <span className="amount">{doc.totalRevenueCeiling.toLocaleString()} {doc.currency}</span>
      ),
    },
    {
      key: 'totalExpenseCeiling',
      header: 'Plafond Dépenses',
      render: (doc: CBMTDocument) => (
        <span className="amount">{doc.totalExpenseCeiling.toLocaleString()} {doc.currency}</span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (doc: CBMTDocument) => (
        <span className={`status-badge status-${doc.status.toLowerCase()}`}>
          {doc.status}
        </span>
      ),
    },
    {
      key: 'generatedAt',
      header: 'Date génération',
      render: (doc: CBMTDocument) => new Date(doc.generatedAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="cbmt-list-page">
      <PageHeader
        title="Documents CBMT"
        subtitle="Cadre Budgétaire à Moyen Terme"
        action={
          <Button
            variant="primary"
            onClick={() => setIsGenerateModalOpen(true)}
          >
            + Générer depuis TOFE
          </Button>
        }
      />

        <div className="filters-section">
          <div className="filters">
            <div className="filter-group">
              <label>Année fiscale</label>
              <input
                type="number"
                value={fiscalYearFilter}
                onChange={(e) => setFiscalYearFilter(e.target.value)}
                placeholder="Toutes"
              />
            </div>
            <div className="filter-group">
              <label>Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="DRAFT">Brouillon</option>
                <option value="VALIDATED">Validé</option>
                <option value="APPROVED">Approuvé</option>
              </select>
            </div>
            {(fiscalYearFilter || statusFilter) && (
              <button
                className="btn-clear-filters"
                onClick={() => {
                  setFiscalYearFilter('');
                  setStatusFilter('');
                }}
              >
                Effacer les filtres
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={documents}
          loading={loading}
          emptyMessage="Aucun document CBMT trouvé"
          customActions={(doc: CBMTDocument) => (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-view"
                onClick={() => navigate(`/macro/cbmt/${doc.id}`)}
              >
                Voir
              </button>
              {doc.status === 'DRAFT' && (
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteDocument(doc.id)}
                >
                  Supprimer
                </button>
              )}
            </div>
          )}
        />

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Précédent
            </button>
            <span>
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
            </button>
          </div>
        )}

        {/* Generate from TOFE Modal */}
        {isGenerateModalOpen && (
          <div className="modal-overlay" onClick={() => setIsGenerateModalOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Générer CBMT depuis TOFE</h2>
                <button className="modal-close" onClick={() => setIsGenerateModalOpen(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Entrez l'ID du cadre macroéconomique pour générer automatiquement un document CBMT
                  basé sur le TOFE associé.
                </p>
                <div className="form-group">
                  <label>ID Cadre Macroéconomique *</label>
                  <input
                    type="text"
                    value={macroFrameworkId}
                    onChange={(e) => setMacroFrameworkId(e.target.value)}
                    placeholder="UUID du cadre macro"
                  />
                </div>
                <div className="info-box">
                  <strong>Note:</strong> Le système générera automatiquement :
                  <ul>
                    <li>Les agrégats de recettes et dépenses depuis le TOFE</li>
                    <li>Une réserve pour imprévus (2% des dépenses totales)</li>
                    <li>Les plafonds budgétaires basés sur les projections</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setIsGenerateModalOpen(false)}>
                  Annuler
                </button>
                <button className="btn-primary" onClick={handleGenerateFromTOFE} disabled={submitting}>
                  {submitting ? 'Génération...' : 'Générer'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default CBMTList;
