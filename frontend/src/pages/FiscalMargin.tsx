import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Equalizer as EqualizerIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface MarginData {
  year: number;
  totalCeiling: number;
  totalBaseline: number;
  fiscalMargin: number;
  allocatedMargin: number;
  remainingMargin: number;
}

const FiscalMargin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marginData, setMarginData] = useState<MarginData[]>([]);
  const [scenarioId, setScenarioId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Get active scenario
      const scenariosRes = await apiClient.get('/cdmt-global/scenarios?isActive=true');
      const activeScenario = scenariosRes.data.data?.data?.[0];

      if (activeScenario) {
        setScenarioId(activeScenario.id);
        // Calculate margin data from scenario
        setMarginData([
          {
            year: activeScenario.fiscalYear,
            totalCeiling: Number(activeScenario.totalCeilingY1) || 0,
            totalBaseline: Number(activeScenario.totalBaselineY1) || 0,
            fiscalMargin: Number(activeScenario.fiscalMarginY1) || 0,
            allocatedMargin: Number(activeScenario.totalAllocatedY1) || 0,
            remainingMargin: (Number(activeScenario.fiscalMarginY1) || 0) - (Number(activeScenario.totalAllocatedY1) || 0),
          },
          {
            year: activeScenario.fiscalYear + 1,
            totalCeiling: Number(activeScenario.totalCeilingY2) || 0,
            totalBaseline: Number(activeScenario.totalBaselineY2) || 0,
            fiscalMargin: Number(activeScenario.fiscalMarginY2) || 0,
            allocatedMargin: Number(activeScenario.totalAllocatedY2) || 0,
            remainingMargin: (Number(activeScenario.fiscalMarginY2) || 0) - (Number(activeScenario.totalAllocatedY2) || 0),
          },
          {
            year: activeScenario.fiscalYear + 2,
            totalCeiling: Number(activeScenario.totalCeilingY3) || 0,
            totalBaseline: Number(activeScenario.totalBaselineY3) || 0,
            fiscalMargin: Number(activeScenario.fiscalMarginY3) || 0,
            allocatedMargin: Number(activeScenario.totalAllocatedY3) || 0,
            remainingMargin: (Number(activeScenario.fiscalMarginY3) || 0) - (Number(activeScenario.totalAllocatedY3) || 0),
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
  };

  const getMarginPercentage = (data: MarginData) => {
    if (data.fiscalMargin === 0) return 0;
    return (data.allocatedMargin / data.fiscalMargin) * 100;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const totalMargin = marginData.reduce((sum, d) => sum + d.fiscalMargin, 0);
  const totalAllocated = marginData.reduce((sum, d) => sum + d.allocatedMargin, 0);
  const totalRemaining = marginData.reduce((sum, d) => sum + d.remainingMargin, 0);

  return (
    <Box>
      <PageHeader
        title="Marge de Manoeuvre"
        subtitle="Calcul et suivi de la marge de manoeuvre budgetaire"
        icon={<EqualizerIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon />
                <Typography variant="subtitle2">Marge totale</Typography>
              </Box>
              <Typography variant="h4">
                {formatAmount(totalMargin)} M
              </Typography>
              <Typography variant="caption">FDJ sur 3 ans</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingDownIcon />
                <Typography variant="subtitle2">Marge allouee</Typography>
              </Box>
              <Typography variant="h4">
                {formatAmount(totalAllocated)} M
              </Typography>
              <Typography variant="caption">FDJ sur 3 ans</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ bgcolor: totalRemaining >= 0 ? 'success.main' : 'error.main', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EqualizerIcon />
                <Typography variant="subtitle2">Marge disponible</Typography>
              </Box>
              <Typography variant="h4">
                {formatAmount(totalRemaining)} M
              </Typography>
              <Typography variant="caption">FDJ sur 3 ans</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detail par annee
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Annee</TableCell>
                  <TableCell align="right">Plafond total</TableCell>
                  <TableCell align="right">Budget tendanciel</TableCell>
                  <TableCell align="right">Marge fiscale</TableCell>
                  <TableCell align="right">Marge allouee</TableCell>
                  <TableCell align="right">Marge restante</TableCell>
                  <TableCell width="200">Utilisation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {marginData.map((data) => (
                  <TableRow key={data.year}>
                    <TableCell>
                      <Typography fontWeight={600}>{data.year}</Typography>
                    </TableCell>
                    <TableCell align="right">{formatAmount(data.totalCeiling)} M</TableCell>
                    <TableCell align="right">{formatAmount(data.totalBaseline)} M</TableCell>
                    <TableCell align="right">
                      <Typography color="primary.main" fontWeight={500}>
                        {formatAmount(data.fiscalMargin)} M
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="warning.main">
                        {formatAmount(data.allocatedMargin)} M
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={data.remainingMargin >= 0 ? 'success.main' : 'error.main'} fontWeight={500}>
                        {formatAmount(data.remainingMargin)} M
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(getMarginPercentage(data), 100)}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          color={getMarginPercentage(data) > 100 ? 'error' : 'primary'}
                        />
                        <Typography variant="caption" sx={{ minWidth: 40 }}>
                          {getMarginPercentage(data).toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FiscalMargin;
