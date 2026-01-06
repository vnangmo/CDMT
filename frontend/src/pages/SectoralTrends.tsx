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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface Ministry {
  id: string;
  code: string;
  name: string;
}

interface TrendData {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  baselineY1: number;
  baselineY2: number;
  baselineY3: number;
  growthRate: number;
}

const SectoralTrends: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistry, setSelectedMinistry] = useState<string>('all');
  const [trends, setTrends] = useState<TrendData[]>([]);
  const currentYear = new Date().getFullYear() + 1;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load ministries
      const ministriesRes = await apiClient.get('/ministries?limit=100');
      setMinistries(ministriesRes.data.data || []);

      // Load ceilings for multiple years to calculate trends
      const [y1Res, y2Res, y3Res] = await Promise.all([
        apiClient.get(`/ministerial-ceilings?year=${currentYear}`),
        apiClient.get(`/ministerial-ceilings?year=${currentYear + 1}`),
        apiClient.get(`/ministerial-ceilings?year=${currentYear + 2}`),
      ]);

      const y1Data = y1Res.data.data || [];
      const y2Data = y2Res.data.data || [];
      const y3Data = y3Res.data.data || [];

      // Combine data by ministry
      const trendMap = new Map<string, TrendData>();

      y1Data.forEach((c: any) => {
        trendMap.set(c.ministryId, {
          ministryId: c.ministryId,
          ministryCode: c.ministry?.code || 'N/A',
          ministryName: c.ministry?.name || 'Non defini',
          baselineY1: Number(c.baseline || 0),
          baselineY2: 0,
          baselineY3: 0,
          growthRate: 0,
        });
      });

      y2Data.forEach((c: any) => {
        const existing = trendMap.get(c.ministryId);
        if (existing) {
          existing.baselineY2 = Number(c.baseline || 0);
        }
      });

      y3Data.forEach((c: any) => {
        const existing = trendMap.get(c.ministryId);
        if (existing) {
          existing.baselineY3 = Number(c.baseline || 0);
          // Calculate average growth rate
          if (existing.baselineY1 > 0) {
            const totalGrowth = ((existing.baselineY3 - existing.baselineY1) / existing.baselineY1) * 100;
            existing.growthRate = totalGrowth / 2; // Average over 2 years
          }
        }
      });

      setTrends(Array.from(trendMap.values()));
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
  };

  const filteredTrends = selectedMinistry === 'all'
    ? trends
    : trends.filter(t => t.ministryId === selectedMinistry);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const totalY1 = trends.reduce((sum, t) => sum + t.baselineY1, 0);
  const totalY3 = trends.reduce((sum, t) => sum + t.baselineY3, 0);
  const avgGrowth = totalY1 > 0 ? ((totalY3 - totalY1) / totalY1 / 2) * 100 : 0;

  return (
    <Box>
      <PageHeader
        title="Tendanciels Sectoriels"
        subtitle="Projection des budgets tendanciels par ministere"
        icon={<TrendingUpIcon />}
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
                Total tendanciel {currentYear}
              </Typography>
              <Typography variant="h4" color="primary">
                {formatAmount(totalY1)} M
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total tendanciel {currentYear + 2}
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatAmount(totalY3)} M
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Croissance moyenne
              </Typography>
              <Typography variant="h4" color={avgGrowth >= 0 ? 'success.main' : 'error.main'}>
                {avgGrowth.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Ministere</InputLabel>
            <Select
              value={selectedMinistry}
              label="Ministere"
              onChange={(e) => setSelectedMinistry(e.target.value)}
            >
              <MenuItem value="all">Tous les ministeres</MenuItem>
              {ministries.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Budgets tendanciels {currentYear} - {currentYear + 2}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Ministere</TableCell>
                  <TableCell align="right">{currentYear}</TableCell>
                  <TableCell align="right">{currentYear + 1}</TableCell>
                  <TableCell align="right">{currentYear + 2}</TableCell>
                  <TableCell align="right">Croissance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrends.map((trend) => (
                  <TableRow key={trend.ministryId} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {trend.ministryCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {trend.ministryName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatAmount(trend.baselineY1)} M</TableCell>
                    <TableCell align="right">{formatAmount(trend.baselineY2)} M</TableCell>
                    <TableCell align="right">{formatAmount(trend.baselineY3)} M</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${trend.growthRate >= 0 ? '+' : ''}${trend.growthRate.toFixed(1)}%`}
                        size="small"
                        color={trend.growthRate >= 0 ? 'success' : 'error'}
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

export default SectoralTrends;
