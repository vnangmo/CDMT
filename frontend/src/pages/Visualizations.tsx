import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

const Visualizations: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [year, setYear] = useState<number>(new Date().getFullYear() + 1);
  const [ministryData, setMinistryData] = useState<ChartData[]>([]);
  const [sectorData, setSectorData] = useState<ChartData[]>([]);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load ministerial ceilings for visualizations
      const response = await apiClient.get(`/ministerial-ceilings?year=${year}`);
      const ceilings = response.data.data || [];

      // Transform data for charts
      const mData: ChartData[] = ceilings
        .slice(0, 10) // Top 10 ministries
        .map((c: any) => ({
          label: c.ministry?.code || 'N/A',
          value: Number(c.ceiling || 0),
        }))
        .sort((a: ChartData, b: ChartData) => b.value - a.value);

      setMinistryData(mData);

      // Group by sector (simulated - using first letter of code)
      const sectorMap = new Map<string, number>();
      ceilings.forEach((c: any) => {
        const sector = (c.ministry?.code || 'X').charAt(0);
        sectorMap.set(sector, (sectorMap.get(sector) || 0) + Number(c.ceiling || 0));
      });

      const sData: ChartData[] = Array.from(sectorMap.entries()).map(([label, value]) => ({
        label: `Secteur ${label}`,
        value,
      }));

      setSectorData(sData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
  };

  const totalBudget = ministryData.reduce((sum, d) => sum + d.value, 0);
  const maxValue = Math.max(...ministryData.map(d => d.value), 1);

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
        title="Visualisations"
        subtitle="Graphiques et tableaux de bord interactifs"
        icon={<BarChartIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Annee</InputLabel>
            <Select
              value={year}
              label="Annee"
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Budget total
              </Typography>
              <Typography variant="h5" color="primary">
                {formatAmount(totalBudget)} M FDJ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Ministeres
              </Typography>
              <Typography variant="h5">
                {ministryData.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Moyenne
              </Typography>
              <Typography variant="h5" color="success.main">
                {formatAmount(totalBudget / (ministryData.length || 1))} M
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mb: 3 }}>
            <Tab icon={<BarChartIcon />} label="Barres" />
            <Tab icon={<PieChartIcon />} label="Secteurs" />
            <Tab icon={<LineChartIcon />} label="Evolution" />
            <Tab icon={<TableIcon />} label="Tableau" />
          </Tabs>

          {selectedTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Repartition budgetaire par ministere - {year}
              </Typography>
              <Box sx={{ mt: 3 }}>
                {ministryData.map((item, index) => (
                  <Box key={item.label} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" fontWeight={500}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatAmount(item.value)} M ({((item.value / totalBudget) * 100).toFixed(1)}%)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 24,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${(item.value / maxValue) * 100}%`,
                          bgcolor: `hsl(${210 + index * 15}, 70%, 50%)`,
                          borderRadius: 1,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {selectedTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Distribution par secteur - {year}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {sectorData.map((item, index) => {
                  const percentage = (item.value / totalBudget) * 100;
                  return (
                    <Grid size={{ xs: 12, md: 6 }} key={item.label}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                bgcolor: `hsl(${index * 45}, 60%, 50%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Typography variant="h6" color="white">
                                {percentage.toFixed(0)}%
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={500}>
                                {item.label}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatAmount(item.value)} M FDJ
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Evolution pluriannuelle
              </Typography>
              <Box textAlign="center" py={6}>
                <LineChartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  Graphique d'evolution en cours de developpement
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Les donnees pluriannuelles seront affichees ici
                </Typography>
              </Box>
            </Box>
          )}

          {selectedTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Donnees tabulaires - {year}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="subtitle2" fontWeight={600}>Ministere</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} sx={{ textAlign: "right" }}>
                    <Typography variant="subtitle2" fontWeight={600}>Plafond (M FDJ)</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} sx={{ textAlign: "right" }}>
                    <Typography variant="subtitle2" fontWeight={600}>Part (%)</Typography>
                  </Grid>
                </Grid>
                {ministryData.map((item, index) => (
                  <Grid
                    container
                    key={item.label}
                    sx={{
                      p: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: index % 2 === 0 ? 'background.paper' : 'grey.50',
                    }}
                  >
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="body2">{item.label}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }} sx={{ textAlign: "right" }}>
                      <Typography variant="body2">{formatAmount(item.value)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }} sx={{ textAlign: "right" }}>
                      <Typography variant="body2">
                        {((item.value / totalBudget) * 100).toFixed(2)}%
                      </Typography>
                    </Grid>
                  </Grid>
                ))}
                <Grid container sx={{ bgcolor: 'primary.50', p: 1, borderRadius: 1, mt: 1 }}>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="subtitle2" fontWeight={600}>Total</Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} sx={{ textAlign: "right" }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {formatAmount(totalBudget)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} sx={{ textAlign: "right" }}>
                    <Typography variant="subtitle2" fontWeight={600}>100%</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Visualizations;
