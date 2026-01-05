import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import CDMTGlobalService from '../services/cdmtGlobal.service';
import { CDMTGlobalScenario, ScenarioComparison } from '../types/cdmtGlobal.types';
import './CDMTGlobalScenarioComparison.css';

const CDMTGlobalScenarioComparison: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [availableScenarios, setAvailableScenarios] = useState<CDMTGlobalScenario[]>([]);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ScenarioComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeYear, setActiveYear] = useState<'Y1' | 'Y2' | 'Y3'>('Y1');

  useEffect(() => {
    loadAvailableScenarios();

    // Parse scenario IDs from URL params
    const scenariosParam = searchParams.get('scenarios');
    if (scenariosParam) {
      const ids = scenariosParam.split(',');
      setSelectedScenarioIds(ids);
    }
  }, []);

  useEffect(() => {
    if (selectedScenarioIds.length >= 2) {
      loadComparison();
    }
  }, [selectedScenarioIds]);

  const loadAvailableScenarios = async () => {
    try {
      const result = await CDMTGlobalService.getScenarios({ limit: 100 });
      setAvailableScenarios(result.scenarios);
    } catch (error: any) {
      console.error('Error loading scenarios:', error);
      alert('Erreur lors du chargement des scénarios');
    }
  };

  const loadComparison = async () => {
    try {
      setLoading(true);
      const data = await CDMTGlobalService.compareScenarios(selectedScenarioIds);
      setComparison(data);
    } catch (error: any) {
      console.error('Error loading comparison:', error);
      alert('Erreur lors de la comparaison');
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioToggle = (scenarioId: string) => {
    setSelectedScenarioIds((prev) => {
      if (prev.includes(scenarioId)) {
        return prev.filter((id) => id !== scenarioId);
      } else {
        if (prev.length >= 4) {
          alert('Vous pouvez comparer au maximum 4 scénarios');
          return prev;
        }
        return [...prev, scenarioId];
      }
    });
  };

  const handleCompare = () => {
    if (selectedScenarioIds.length < 2) {
      alert('Veuillez sélectionner au moins 2 scénarios');
      return;
    }
    loadComparison();
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateDifference = (amount1: number, amount2: number): number => {
    return amount1 - amount2;
  };

  const calculatePercentageDifference = (amount1: number, amount2: number): string => {
    if (amount2 === 0) return 'N/A';
    const diff = ((amount1 - amount2) / amount2) * 100;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const getYearIndex = (year: 'Y1' | 'Y2' | 'Y3'): number => {
    return { Y1: 0, Y2: 1, Y3: 2 }[year];
  };

  return (
    <div className="cdmt-global-scenario-comparison-page">
      <PageHeader
        title="Comparaison de scénarios CDMT Global"
        subtitle="Comparez plusieurs scénarios de répartition budgétaire"
        action={
          <Button variant="secondary" onClick={() => navigate('/cdmt-global')}>
            Retour
          </Button>
        }
      />

      {/* Scenario Selection */}
      <div className="selection-section">
        <h3>Sélection des scénarios ({selectedScenarioIds.length}/4)</h3>
        <div className="scenario-cards">
          {availableScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`scenario-card ${selectedScenarioIds.includes(scenario.id) ? 'selected' : ''}`}
              onClick={() => handleScenarioToggle(scenario.id)}
            >
              <div className="scenario-card-header">
                <input
                  type="checkbox"
                  checked={selectedScenarioIds.includes(scenario.id)}
                  onChange={() => {}}
                  onClick={(e) => e.stopPropagation()}
                />
                <div>
                  <div className="scenario-name">{scenario.name}</div>
                  <div className="scenario-code">{scenario.scenarioCode}</div>
                </div>
              </div>
              <div className="scenario-card-body">
                <div className="scenario-info">
                  <span className="label">Année:</span>
                  <span className="value">{scenario.fiscalYear}</span>
                </div>
                <div className="scenario-info">
                  <span className="label">Statut:</span>
                  <span className={`status-badge status-${scenario.status.toLowerCase()}`}>{scenario.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedScenarioIds.length >= 2 && selectedScenarioIds.length <= 4 && (
          <div className="compare-button-container">
            <Button variant="primary" onClick={handleCompare} disabled={loading}>
              {loading ? 'Comparaison en cours...' : 'Comparer les scénarios'}
            </Button>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="comparison-section">
          <div className="year-tabs">
            <button
              className={`year-tab ${activeYear === 'Y1' ? 'active' : ''}`}
              onClick={() => setActiveYear('Y1')}
            >
              Année Y1
            </button>
            <button
              className={`year-tab ${activeYear === 'Y2' ? 'active' : ''}`}
              onClick={() => setActiveYear('Y2')}
            >
              Année Y2
            </button>
            <button
              className={`year-tab ${activeYear === 'Y3' ? 'active' : ''}`}
              onClick={() => setActiveYear('Y3')}
            >
              Année Y3
            </button>
          </div>

          <div className="comparison-table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Ministère</th>
                  {comparison.scenarios.map((scenario, idx) => (
                    <th key={scenario.id}>
                      {scenario.name}
                      <br />
                      <small style={{ fontWeight: 400, fontSize: '12px', color: '#6b7280' }}>
                        ({scenario.scenarioCode})
                      </small>
                    </th>
                  ))}
                  {comparison.scenarios.length === 2 && (
                    <>
                      <th>Écart</th>
                      <th>% Écart</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {comparison.ministries.map((ministry) => {
                  const yearIndex = getYearIndex(activeYear);

                  return (
                    <tr key={ministry.ministryId}>
                      <td className="ministry-name">{ministry.ministryName}</td>
                      {ministry.scenarios.map((scenarioData, idx) => {
                        const ceiling = scenarioData.ceilings[yearIndex];
                        return (
                          <td key={idx} className="amount-cell">
                            {ceiling ? formatAmount(ceiling.ceiling) : '-'}
                          </td>
                        );
                      })}
                      {comparison.scenarios.length === 2 && (
                        <>
                          <td className="diff-cell">
                            {(() => {
                              const ceiling1 = ministry.scenarios[0]?.ceilings[yearIndex];
                              const ceiling2 = ministry.scenarios[1]?.ceilings[yearIndex];
                              if (!ceiling1 || !ceiling2) return '-';
                              const diff = calculateDifference(ceiling1.ceiling, ceiling2.ceiling);
                              return (
                                <span className={diff >= 0 ? 'positive' : 'negative'}>
                                  {diff > 0 && '+'}
                                  {formatAmount(diff)}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="percent-cell">
                            {(() => {
                              const ceiling1 = ministry.scenarios[0]?.ceilings[yearIndex];
                              const ceiling2 = ministry.scenarios[1]?.ceilings[yearIndex];
                              if (!ceiling1 || !ceiling2) return '-';
                              return calculatePercentageDifference(ceiling1.ceiling, ceiling2.ceiling);
                            })()}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td className="ministry-name">
                    <strong>TOTAL</strong>
                  </td>
                  {comparison.scenarios.map((_, idx: number) => {
                    const total = comparison.ministries.reduce((sum, m) => {
                      const ceiling = m.scenarios[idx]?.ceilings[getYearIndex(activeYear)];
                      return sum + (ceiling ? ceiling.ceiling : 0);
                    }, 0);
                    return (
                      <td key={idx} className="amount-cell">
                        <strong>{formatAmount(total)}</strong>
                      </td>
                    );
                  })}
                  {comparison.scenarios.length === 2 && (
                    <>
                      <td className="diff-cell">
                        {(() => {
                          const total1 = comparison.ministries.reduce((sum, m) => {
                            const ceiling = m.scenarios[0]?.ceilings[getYearIndex(activeYear)];
                            return sum + (ceiling ? ceiling.ceiling : 0);
                          }, 0);
                          const total2 = comparison.ministries.reduce((sum, m) => {
                            const ceiling = m.scenarios[1]?.ceilings[getYearIndex(activeYear)];
                            return sum + (ceiling ? ceiling.ceiling : 0);
                          }, 0);
                          const diff = calculateDifference(total1, total2);
                          return (
                            <strong className={diff >= 0 ? 'positive' : 'negative'}>
                              {diff > 0 && '+'}
                              {formatAmount(diff)}
                            </strong>
                          );
                        })()}
                      </td>
                      <td className="percent-cell">
                        {(() => {
                          const total1 = comparison.ministries.reduce((sum, m) => {
                            const ceiling = m.scenarios[0]?.ceilings[getYearIndex(activeYear)];
                            return sum + (ceiling ? ceiling.ceiling : 0);
                          }, 0);
                          const total2 = comparison.ministries.reduce((sum, m) => {
                            const ceiling = m.scenarios[1]?.ceilings[getYearIndex(activeYear)];
                            return sum + (ceiling ? ceiling.ceiling : 0);
                          }, 0);
                          return <strong>{calculatePercentageDifference(total1, total2)}</strong>;
                        })()}
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards">
            {comparison.scenarios.map((scenario) => (
              <div key={scenario.id} className="summary-card">
                <h4>{scenario.name}</h4>
                <div className="summary-details">
                  <div className="summary-item">
                    <span className="label">Code:</span>
                    <span className="value">{scenario.scenarioCode}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Année fiscale:</span>
                    <span className="value">{scenario.fiscalYear}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedScenarioIds.length < 2 && (
        <div className="empty-state">
          <p>Veuillez sélectionner au moins 2 scénarios pour commencer la comparaison.</p>
        </div>
      )}
    </div>
  );
};

export default CDMTGlobalScenarioComparison;
