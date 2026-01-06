import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  PieChart as PieChartIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface MinistryAllocation {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  ceiling: number;
  baseline: number;
  newMeasures: number;
  percentageOfTotal: number;
  isPriority: boolean;
}

const IntersectoralAllocation: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<MinistryAllocation[]>([]);
  const [totalCeiling, setTotalCeiling] = useState(0);
  const currentYear = new Date().getFullYear() + 1;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/ministerial-ceilings?year=${currentYear}`);
      const ceilings = response.data.data || [];

      const total = ceilings.reduce((sum: number, c: any) => sum + Number(c.ceiling || 0), 0);
      setTotalCeiling(total);

      const allocs: MinistryAllocation[] = ceilings.map((c: any) => ({
        ministryId: c.ministryId,
        ministryCode: c.ministry?.code || 'N/A',
        ministryName: c.ministry?.name || 'Non defini',
        ceiling: Number(c.ceiling || 0),
        baseline: Number(c.baseline || 0),
        newMeasures: Number(c.newMeasures || 0),
        percentageOfTotal: total > 0 ? (Number(c.ceiling || 0) / total) * 100 : 0,
        isPriority: c.ministry?.isPriority || false,
      }));

      // Sort by ceiling descending
      allocs.sort((a, b) => b.ceiling - a.ceiling);
      setAllocations(allocs);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const priorityCount = allocations.filter(a => a.isPriority).length;
  const priorityTotal = allocations.filter(a => a.isPriority).reduce((sum, a) => sum + a.ceiling, 0);

  return (
    <Box>
      <PageHeader
        title="Repartition Intersectorielle"
        subtitle="Allocation des ressources entre ministeres"
        icon={<PieChartIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Enveloppe totale {currentYear}
              </Typography>
              <Typography variant="h4" color="primary">
                {formatAmount(totalCeiling)} M
              </Typography>
              <Typography variant="caption">FDJ</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Ministeres
              </Typography>
              <Typography variant="h4">
                {allocations.length}
              </Typography>
              <Typography variant="caption">Institutions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Secteurs prioritaires
              </Typography>
              <Typography variant="h4" color="success.main">
                {priorityCount}
              </Typography>
              <Typography variant="caption">{formatAmount(priorityTotal)} M FDJ</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Part prioritaires
              </Typography>
              <Typography variant="h4" color="warning.main">
                {totalCeiling > 0 ? ((priorityTotal / totalCeiling) * 100).toFixed(1) : 0}%
              </Typography>
              <Typography variant="caption">Du budget total</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Repartition par ministere - {currentYear}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ministere</TableCell>
                  <TableCell align="right">Plafond</TableCell>
                  <TableCell align="right">Tendanciel</TableCell>
                  <TableCell align="right">Mesures nouvelles</TableCell>
                  <TableCell align="right">Part (%)</TableCell>
                  <TableCell width="150">Repartition</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allocations.map((alloc) => (
                  <TableRow key={alloc.ministryId} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {alloc.ministryCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alloc.ministryName}
                          </Typography>
                        </Box>
                        {alloc.isPriority && (
                          <Chip label="Prioritaire" size="small" color="success" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={500}>{formatAmount(alloc.ceiling)} M</Typography>
                    </TableCell>
                    <TableCell align="right">{formatAmount(alloc.baseline)} M</TableCell>
                    <TableCell align="right">
                      <Typography color={alloc.newMeasures > 0 ? 'success.main' : 'text.secondary'}>
                        {formatAmount(alloc.newMeasures)} M
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={500}>{alloc.percentageOfTotal.toFixed(1)}%</Typography>
                    </TableCell>
                    <TableCell>
                      <LinearProgress
                        variant="determinate"
                        value={alloc.percentageOfTotal}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={alloc.isPriority ? 'success' : 'primary'}
                      />
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

export default IntersectoralAllocation;
