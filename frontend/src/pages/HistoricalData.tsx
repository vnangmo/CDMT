import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../components/common/PageHeader';
import DataTable, { Column } from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import apiClient from '../services/api.service';
import './HistoricalData.css';

interface Ministry {
  id: string;
  code: string;
  name: string;
}

interface Program {
  id: string;
  code: string;
  name: string;
  ministryId: string;
}

interface EconomicNature {
  id: string;
  code: string;
  name: string;
  type: 'REVENUE' | 'EXPENSE';
}

interface HistoricalBudget {
  id: string;
  ministryId: string;
  programId?: string;
  economicNatureId?: string;
  fiscalYear: number;
  budgetAmount: number;
  executedAmount?: number;
  isTemporary: boolean;
  isExceptional: boolean;
  exceptionalReason?: string;
  notes?: string;
  importSource?: string;
  ministry?: Ministry;
  program?: Program;
  economicNature?: EconomicNature;
  createdAt: string;
  updatedAt: string;
}

interface BaseYearData {
  year: number;
  label: string;
  type: 'N-2' | 'N-1' | 'N';
  budgetTotal: number;
  executedTotal: number;
  count: number;
}

type TabType = 'saisie' | 'base' | 'correction';

const HistoricalData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('base');
  const [loading, setLoading] = useState(true);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [economicNatures, setEconomicNatures] = useState<EconomicNature[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalBudget[]>([]);
  const [baseYear, setBaseYear] = useState<number>(new Date().getFullYear());
  const [selectedMinistry, setSelectedMinistry] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HistoricalBudget | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    ministryId: '',
    programId: '',
    economicNatureId: '',
    fiscalYear: baseYear - 1,
    budgetAmount: 0,
    executedAmount: 0,
    isTemporary: false,
    isExceptional: false,
    exceptionalReason: '',
    notes: ''
  });

  const baseYears = useMemo(() => {
    return [
      { year: baseYear - 2, label: 'N-2', type: 'N-2' as const },
      { year: baseYear - 1, label: 'N-1', type: 'N-1' as const },
      { year: baseYear, label: 'N', type: 'N' as const }
    ];
  }, [baseYear]);

  const baseYearStats = useMemo<BaseYearData[]>(() => {
    return baseYears.map(by => {
      const yearData = historicalData.filter(h => h.fiscalYear === by.year);
      return {
        ...by,
        budgetTotal: yearData.reduce((sum, h) => sum + (h.budgetAmount || 0), 0),
        executedTotal: yearData.reduce((sum, h) => sum + (h.executedAmount || 0), 0),
        count: yearData.length
      };
    });
  }, [baseYears, historicalData]);

  const expenseNatures = useMemo(() => {
    return economicNatures.filter(n => n.type === 'EXPENSE');
  }, [economicNatures]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (selectedMinistry) { loadPrograms(selectedMinistry); }
  }, [selectedMinistry]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ministriesRes, economicNaturesRes, historicalRes] = await Promise.all([
        apiClient.get('/ministries?limit=100'),
        apiClient.get('/economic-natures?limit=100'),
        apiClient.get('/trend-budgets/historical?limit=500')
      ]);
      setMinistries(ministriesRes.data.data?.data || ministriesRes.data.data || []);
      setEconomicNatures(economicNaturesRes.data.data?.data || economicNaturesRes.data.data || []);
      setHistoricalData(historicalRes.data.data?.data || historicalRes.data.data || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async (ministryId: string) => {
    try {
      const res = await apiClient.get(`/programs?ministryId=${ministryId}&limit=100`);
      setPrograms(res.data.data?.data || res.data.data || []);
    } catch (error) {
      console.error('Erreur chargement programmes:', error);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      ministryId: '',
      programId: '',
      economicNatureId: '',
      fiscalYear: baseYear - 1,
      budgetAmount: 0,
      executedAmount: 0,
      isTemporary: false,
      isExceptional: false,
      exceptionalReason: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: HistoricalBudget) => {
    setEditingItem(item);
    setSelectedMinistry(item.ministryId);
    setFormData({
      ministryId: item.ministryId,
      programId: item.programId || '',
      economicNatureId: item.economicNatureId || '',
      fiscalYear: item.fiscalYear,
      budgetAmount: item.budgetAmount,
      executedAmount: item.executedAmount || 0,
      isTemporary: item.isTemporary,
      isExceptional: item.isExceptional,
      exceptionalReason: item.exceptionalReason || '',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: HistoricalBudget) => {
    if (window.confirm('Supprimer cette donnee historique ?')) {
      try {
        await apiClient.delete(`/trend-budgets/historical/${item.id}`);
        await loadData();
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await apiClient.put(`/trend-budgets/historical/${editingItem.id}`, formData);
      } else {
        await apiClient.post('/trend-budgets/historical', formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Erreur soumission:', error);
      alert('Erreur lors de enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
  };

  const filteredData = useMemo(() => {
    const baseYearValues = baseYears.map(b => b.year);
    return historicalData.filter(h => baseYearValues.includes(h.fiscalYear));
  }, [historicalData, baseYears]);

  const correctionData = useMemo(() => {
    return historicalData.filter(h => h.isExceptional || h.isTemporary);
  }, [historicalData]);

  const columns: Column<HistoricalBudget>[] = [
    { key: 'fiscalYear', header: 'Annee', width: '8%', render: (item) => <strong>{item.fiscalYear}</strong> },
    { key: 'ministry', header: 'Ministere', width: '12%', render: (item) => item.ministry?.code || '-' },
    { key: 'program', header: 'Programme', width: '10%', render: (item) => item.program?.code || '-' },
    { key: 'economicNature', header: 'Nature Depense', width: '20%', render: (item) => item.economicNature ? `${item.economicNature.code} - ${item.economicNature.name}` : '-' },
    { key: 'budgetAmount', header: 'Budget (M FDJ)', width: '12%', render: (item) => formatAmount(item.budgetAmount) },
    { key: 'executedAmount', header: 'Execute (M FDJ)', width: '12%', render: (item) => formatAmount(item.executedAmount || 0) },
    { key: 'isExceptional', header: 'Type', width: '10%', render: (item) => (
      <span className={`type-badge ${item.isExceptional ? 'exceptional' : item.isTemporary ? 'temporary' : 'normal'}`}>
        {item.isExceptional ? 'Except.' : item.isTemporary ? 'Temp.' : 'Normal'}
      </span>
    )}
  ];

  return (
    <div className="historical-data-page">
      <PageHeader
        title="Donnees Historiques par Nature de Depenses"
        subtitle="Saisie et gestion des donnees historiques (N-2, N-1, N) par nature economique - Modele CDMT"
        action={
          <Button onClick={handleCreate} icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>
            Nouvelle Saisie
          </Button>
        }
      />

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'saisie' ? 'active' : ''}`} onClick={() => setActiveTab('saisie')}>Saisie Donnees Historiques</button>
        <button className={`tab-btn ${activeTab === 'base' ? 'active' : ''}`} onClick={() => setActiveTab('base')}>Base de Donnees (N-2, N-1, N)</button>
        <button className={`tab-btn ${activeTab === 'correction' ? 'active' : ''}`} onClick={() => setActiveTab('correction')}>Correction Donnees</button>
      </div>

      <div className="year-selector-bar">
        <label>Annee de reference (N) :</label>
        <select value={baseYear} onChange={(e) => setBaseYear(parseInt(e.target.value))}>
          {[...Array(10)].map((_, i) => {
            const year = new Date().getFullYear() - 3 + i;
            return <option key={year} value={year}>{year}</option>;
          })}
        </select>
        <span className="nature-info">Saisie par nature de depenses</span>
      </div>

      {activeTab === 'base' && (
        <div className="base-data-section">
          <div className="base-years-summary">
            {baseYearStats.map((stat) => (
              <div key={stat.label} className={`base-year-summary-card ${stat.type.toLowerCase().replace('-', '')}`}>
                <div className="summary-header">
                  <span className="year-label">{stat.label}</span>
                  <span className="year-value">{stat.year}</span>
                </div>
                <div className="summary-stats">
                  <div className="stat-item"><span className="stat-label">Budget</span><span className="stat-value">{formatAmount(stat.budgetTotal)} M</span></div>
                  <div className="stat-item"><span className="stat-label">Execute</span><span className="stat-value">{formatAmount(stat.executedTotal)} M</span></div>
                  <div className="stat-item"><span className="stat-label">Lignes</span><span className="stat-value">{stat.count}</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="data-table-section">
            <h3>Donnees historiques par nature de depenses ({baseYear - 2} - {baseYear})</h3>
            <DataTable data={filteredData} columns={columns} loading={loading} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="Aucune donnee historique enregistree" />
          </div>
        </div>
      )}

      {activeTab === 'saisie' && (
        <div className="saisie-section">
          <div className="saisie-info">
            <h3>Saisie des Donnees Historiques par Nature de Depenses</h3>
            <p>Saisissez les donnees historiques par nature economique de depenses pour les annees N-2, N-1 et N.</p>
            <ul>
              <li><strong>N-2 ({baseYear - 2})</strong> : Donnees d execution cloturee</li>
              <li><strong>N-1 ({baseYear - 1})</strong> : Donnees d execution en cours</li>
              <li><strong>N ({baseYear})</strong> : Donnees LFI (Loi de Finances Initiale)</li>
            </ul>
          </div>
          <div className="quick-entry-grid">
            {baseYears.map((by) => (
              <div key={by.label} className="quick-entry-card">
                <h4>{by.label} - {by.year}</h4>
                <p>{by.type === 'N-2' ? 'Execution cloturee' : by.type === 'N-1' ? 'Execution en cours' : 'LFI'}</p>
                <Button onClick={() => { setFormData(prev => ({ ...prev, fiscalYear: by.year })); setIsModalOpen(true); }}>Saisir {by.label}</Button>
              </div>
            ))}
          </div>
          <DataTable data={historicalData} columns={columns} loading={loading} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="Aucune donnee historique" />
        </div>
      )}

      {activeTab === 'correction' && (
        <div className="correction-section">
          <div className="correction-info">
            <h3>Correction des Donnees Historiques</h3>
            <p>Cette section permet de corriger les donnees exceptionnelles ou temporaires qui doivent etre exclues des projections tendancielles.</p>
          </div>
          <div className="correction-stats">
            <div className="stat-card exceptional"><span className="stat-number">{correctionData.filter(d => d.isExceptional).length}</span><span className="stat-text">Donnees exceptionnelles</span></div>
            <div className="stat-card temporary"><span className="stat-number">{correctionData.filter(d => d.isTemporary).length}</span><span className="stat-text">Donnees temporaires</span></div>
          </div>
          <DataTable data={correctionData} columns={[...columns, { key: 'exceptionalReason', header: 'Raison', width: '15%', render: (item) => item.exceptionalReason || '-' }]} loading={loading} onEdit={handleEdit} onDelete={handleDelete} emptyMessage="Aucune donnee a corriger" />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Modifier Donnee Historique' : 'Nouvelle Donnee Historique par Nature'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={() => handleSubmit({} as React.FormEvent)} loading={submitting}>{editingItem ? 'Mettre a jour' : 'Creer'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="historical-form">
          <div className="form-row">
            <div className="form-group">
              <label>Annee Fiscale *</label>
              <select value={formData.fiscalYear} onChange={(e) => setFormData({ ...formData, fiscalYear: parseInt(e.target.value) })} required>
                {baseYears.map(by => (<option key={by.year} value={by.year}>{by.label} - {by.year}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label>Ministere *</label>
              <select value={formData.ministryId} onChange={(e) => { setFormData({ ...formData, ministryId: e.target.value, programId: '' }); setSelectedMinistry(e.target.value); }} required>
                <option value="">Selectionner...</option>
                {ministries.map(m => (<option key={m.id} value={m.id}>{m.code} - {m.name}</option>))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Programme</label>
              <select value={formData.programId} onChange={(e) => setFormData({ ...formData, programId: e.target.value })}>
                <option value="">Tous les programmes</option>
                {programs.map(p => (<option key={p.id} value={p.id}>{p.code} - {p.name}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label>Nature de Depenses *</label>
              <select value={formData.economicNatureId} onChange={(e) => setFormData({ ...formData, economicNatureId: e.target.value })} required>
                <option value="">Selectionner une nature...</option>
                {expenseNatures.map(n => (<option key={n.id} value={n.id}>{n.code} - {n.name}</option>))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Montant Budget (M FDJ) *</label>
              <input type="number" value={formData.budgetAmount} onChange={(e) => setFormData({ ...formData, budgetAmount: parseFloat(e.target.value) })} required min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label>Montant Execute (M FDJ)</label>
              <input type="number" value={formData.executedAmount} onChange={(e) => setFormData({ ...formData, executedAmount: parseFloat(e.target.value) })} min="0" step="0.01" />
            </div>
          </div>
          <div className="form-row checkboxes">
            <label className="checkbox-label"><input type="checkbox" checked={formData.isTemporary} onChange={(e) => setFormData({ ...formData, isTemporary: e.target.checked })} /><span>Donnee Temporaire</span></label>
            <label className="checkbox-label"><input type="checkbox" checked={formData.isExceptional} onChange={(e) => setFormData({ ...formData, isExceptional: e.target.checked })} /><span>Donnee Exceptionnelle</span></label>
          </div>
          {formData.isExceptional && (
            <div className="form-group">
              <label>Raison (si exceptionnelle)</label>
              <input type="text" value={formData.exceptionalReason} onChange={(e) => setFormData({ ...formData, exceptionalReason: e.target.value })} placeholder="Ex: Depense COVID-19, Investissement exceptionnel..." />
            </div>
          )}
          <div className="form-group">
            <label>Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} placeholder="Notes additionnelles..." />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HistoricalData;
