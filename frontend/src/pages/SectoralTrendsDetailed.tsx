import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface Ministry {
  id: string;
  code: string;
  name: string;
}

interface TrendProjection {
  id: string;
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  economicNatureId: string;
  natureCode: string;
  natureName: string;
  baseAmount: number;
  projectedAmount1: number;
  projectedAmount2: number;
  projectedAmount3: number;
  growthRate1: number;
  growthRate2: number;
  growthRate3: number;
}

interface MinistryGroup {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  projections: TrendProjection[];
  totals: {
    base: number;
    proj1: number;
    proj2: number;
    proj3: number;
  };
}

const NATURE_ORDER = [
  'SAL',  // Salaires
  'MAT',  // Matériels
  'TRF',  // Transferts
  'DAC',  // Dons affectés aux dépenses courantes
  'INV',  // Investissements Intérieurs
  'DPR',  // Dons Projets
  'EPR',  // Emprunts Projets
  'INT',  // Intérêts
  'AMO',  // Amortissements
  'AAI',  // Apurement arriérés intérieurs
];

const SectoralTrendsDetailed: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistry, setSelectedMinistry] = useState<string>('all');
  const [ministryGroups, setMinistryGroups] = useState<MinistryGroup[]>([]);
  const [expandedMinistries, setExpandedMinistries] = useState<Set<string>>(new Set());
  const [configId, setConfigId] = useState<string>('');
  const [baseYear, setBaseYear] = useState<number>(2025);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les ministères et la config
      const [ministriesRes, configsRes] = await Promise.all([
        apiClient.get('/ministries?limit=100'),
        apiClient.get('/trend-budgets?limit=10'),
      ]);

      const ministriesData = ministriesRes.data.data;
      setMinistries(Array.isArray(ministriesData) ? ministriesData : (ministriesData?.data || []));

      const configsData = configsRes.data.data;
      const configs = Array.isArray(configsData) ? configsData : (configsData?.data || []);

      if (configs.length > 0) {
        const config = configs[0];
        setConfigId(config.id);
        setBaseYear(config.fiscalYear || 2025);
        await loadProjections(config.id);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadProjections = async (cfgId: string) => {
    try {
      const res = await apiClient.get(`/trend-budgets/${cfgId}/projections?limit=500`);
      const projections = res.data.data?.data || res.data.data || [];

      // Grouper par ministère
      const groupMap = new Map<string, MinistryGroup>();

      projections.forEach((p: any) => {
        const ministryId = p.ministryId;
        if (!groupMap.has(ministryId)) {
          groupMap.set(ministryId, {
            ministryId,
            ministryCode: p.ministry?.code || 'N/A',
            ministryName: p.ministry?.name || 'Non défini',
            projections: [],
            totals: { base: 0, proj1: 0, proj2: 0, proj3: 0 },
          });
        }

        const group = groupMap.get(ministryId)!;
        const projection: TrendProjection = {
          id: p.id,
          ministryId,
          ministryCode: p.ministry?.code || 'N/A',
          ministryName: p.ministry?.name || 'Non défini',
          economicNatureId: p.economicNatureId,
          natureCode: p.economicNature?.code || 'N/A',
          natureName: p.economicNature?.name || 'Non défini',
          baseAmount: parseFloat(p.baseAmount) || 0,
          projectedAmount1: parseFloat(p.projectedAmount1) || 0,
          projectedAmount2: parseFloat(p.projectedAmount2) || 0,
          projectedAmount3: parseFloat(p.projectedAmount3) || 0,
          growthRate1: parseFloat(p.growthRate1) || 0,
          growthRate2: parseFloat(p.growthRate2) || 0,
          growthRate3: parseFloat(p.growthRate3) || 0,
        };

        group.projections.push(projection);
        group.totals.base += projection.baseAmount;
        group.totals.proj1 += projection.projectedAmount1;
        group.totals.proj2 += projection.projectedAmount2;
        group.totals.proj3 += projection.projectedAmount3;
      });

      // Trier les projections par nature économique
      groupMap.forEach((group) => {
        group.projections.sort((a, b) => {
          const indexA = NATURE_ORDER.indexOf(a.natureCode);
          const indexB = NATURE_ORDER.indexOf(b.natureCode);
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
      });

      // Convertir en tableau et trier par total
      const groups = Array.from(groupMap.values()).sort(
        (a, b) => b.totals.proj1 - a.totals.proj1
      );

      setMinistryGroups(groups);
    } catch (err: any) {
      console.error('Error loading projections:', err);
      setError('Erreur lors du chargement des projections');
    }
  };

  const toggleMinistry = (ministryId: string) => {
    const newExpanded = new Set(expandedMinistries);
    if (newExpanded.has(ministryId)) {
      newExpanded.delete(ministryId);
    } else {
      newExpanded.add(ministryId);
    }
    setExpandedMinistries(newExpanded);
  };

  const expandAll = () => {
    setExpandedMinistries(new Set(ministryGroups.map((g) => g.ministryId)));
  };

  const collapseAll = () => {
    setExpandedMinistries(new Set());
  };

  const formatAmount = (value: number) => {
    if (!isFinite(value) || isNaN(value)) return '0';
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value / 1e6);
  };

  const filteredGroups =
    selectedMinistry === 'all'
      ? ministryGroups
      : ministryGroups.filter((g) => g.ministryId === selectedMinistry);

  const grandTotals = filteredGroups.reduce(
    (acc, g) => ({
      base: acc.base + g.totals.base,
      proj1: acc.proj1 + g.totals.proj1,
      proj2: acc.proj2 + g.totals.proj2,
      proj3: acc.proj3 + g.totals.proj3,
    }),
    { base: 0, proj1: 0, proj2: 0, proj3: 0 }
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Tendanciels Sectoriels Détaillés"
        subtitle="Projections budgétaires par ministère et par nature économique"
        icon={<TrendingUpIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
        <FormControl sx={{ minWidth: 250 }} size="small">
          <InputLabel>Ministère</InputLabel>
          <Select
            value={selectedMinistry}
            label="Ministère"
            onChange={(e) => setSelectedMinistry(e.target.value)}
          >
            <MenuItem value="all">Tous les ministères ({ministryGroups.length})</MenuItem>
            {ministryGroups.map((g) => (
              <MenuItem key={g.ministryId} value={g.ministryId}>
                {g.ministryCode} - {g.ministryName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Chip
          label="Tout déplier"
          onClick={expandAll}
          variant="outlined"
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label="Tout replier"
          onClick={collapseAll}
          variant="outlined"
          sx={{ cursor: 'pointer' }}
        />
        <Box flexGrow={1} />
        <Typography variant="body2" color="text.secondary">
          Montants en millions DJF
        </Typography>
      </Box>

      {/* Totaux généraux */}
      <Paper sx={{ mb: 3, p: 2, bgcolor: '#1976d2', color: 'white' }}>
        <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="caption">TOTAL GÉNÉRAL</Typography>
            <Typography variant="h6">{filteredGroups.length} ministères</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption">Base {baseYear}</Typography>
            <Typography variant="h6">{formatAmount(grandTotals.base)} M</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption">{baseYear + 1}</Typography>
            <Typography variant="h6">{formatAmount(grandTotals.proj1)} M</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption">{baseYear + 2}</Typography>
            <Typography variant="h6">{formatAmount(grandTotals.proj2)} M</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption">{baseYear + 3}</Typography>
            <Typography variant="h6">{formatAmount(grandTotals.proj3)} M</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Liste des ministères */}
      {filteredGroups.map((group) => {
        const isExpanded = expandedMinistries.has(group.ministryId);
        const growthRate = group.totals.base > 0
          ? ((group.totals.proj3 - group.totals.base) / group.totals.base / 3) * 100
          : 0;

        return (
          <Card key={group.ministryId} sx={{ mb: 2 }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {/* En-tête du ministère */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  bgcolor: '#f5f5f5',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#eeeeee' },
                }}
                onClick={() => toggleMinistry(group.ministryId)}
              >
                <IconButton size="small">
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Box sx={{ ml: 1, flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {group.ministryCode} - {group.ministryName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {group.projections.length} natures économiques
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      Base {baseYear}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatAmount(group.totals.base)} M
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      {baseYear + 1}
                    </Typography>
                    <Typography variant="body2" fontWeight={500} color="primary">
                      {formatAmount(group.totals.proj1)} M
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      {baseYear + 2}
                    </Typography>
                    <Typography variant="body2" fontWeight={500} color="primary">
                      {formatAmount(group.totals.proj2)} M
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      {baseYear + 3}
                    </Typography>
                    <Typography variant="body2" fontWeight={500} color="primary">
                      {formatAmount(group.totals.proj3)} M
                    </Typography>
                  </Box>
                  <Chip
                    label={`${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%/an`}
                    size="small"
                    color={growthRate >= 0 ? 'success' : 'error'}
                  />
                </Box>
              </Box>

              {/* Détail par nature économique */}
              <Collapse in={isExpanded}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                        <TableCell width="30%">
                          <strong>Nature économique</strong>
                        </TableCell>
                        <TableCell align="right" width="14%">
                          <strong>Base {baseYear}</strong>
                        </TableCell>
                        <TableCell align="right" width="14%">
                          <strong>{baseYear + 1}</strong>
                        </TableCell>
                        <TableCell align="right" width="14%">
                          <strong>{baseYear + 2}</strong>
                        </TableCell>
                        <TableCell align="right" width="14%">
                          <strong>{baseYear + 3}</strong>
                        </TableCell>
                        <TableCell align="right" width="14%">
                          <strong>Taux {baseYear + 1}</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.projections.map((proj) => (
                        <TableRow key={proj.id} hover>
                          <TableCell>
                            <Typography variant="body2">{proj.natureName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {proj.natureCode}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{formatAmount(proj.baseAmount)}</TableCell>
                          <TableCell align="right" sx={{ color: '#1976d2' }}>
                            {formatAmount(proj.projectedAmount1)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#1976d2' }}>
                            {formatAmount(proj.projectedAmount2)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#1976d2' }}>
                            {formatAmount(proj.projectedAmount3)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${proj.growthRate1 >= 0 ? '+' : ''}${proj.growthRate1.toFixed(1)}%`}
                              size="small"
                              variant="outlined"
                              color={proj.growthRate1 > 0 ? 'success' : proj.growthRate1 < 0 ? 'error' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Ligne total */}
                      <TableRow sx={{ bgcolor: '#e8e8e8' }}>
                        <TableCell>
                          <strong>TOTAL {group.ministryCode}</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>{formatAmount(group.totals.base)}</strong>
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#1976d2' }}>
                          <strong>{formatAmount(group.totals.proj1)}</strong>
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#1976d2' }}>
                          <strong>{formatAmount(group.totals.proj2)}</strong>
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#1976d2' }}>
                          <strong>{formatAmount(group.totals.proj3)}</strong>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%/an`}
                            size="small"
                            color={growthRate >= 0 ? 'success' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </CardContent>
          </Card>
        );
      })}

      {filteredGroups.length === 0 && (
        <Alert severity="info">Aucune donnée tendancielle disponible.</Alert>
      )}
    </Box>
  );
};

export default SectoralTrendsDetailed;
