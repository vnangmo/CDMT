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
  Button,
  Tab,
  Tabs,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShowChart as ChartIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface MacroFramework {
  id: string;
  year: number;
  budgetYear: number;
  gdpGrowthRate: number;
  inflationRate: number;
  nominalGDP: number;
  nominalGDPYear1: number;
  nominalGDPYear2: number;
  nominalGDPYear3: number;
  status: string;
}

const MacroProjections: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frameworks, setFrameworks] = useState<MacroFramework[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/macro-frameworks');
      // Handle both response formats: { data: [...] } or { data: { data: [...], pagination: {...} } }
      const data = response.data.data;
      const frameworksArray = Array.isArray(data) ? data : (data?.data || []);
      setFrameworks(frameworksArray);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };

  const latestFramework = frameworks.find(f => f.status === 'VALIDATED') || frameworks[0];

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
        title="Projections des Agregats"
        subtitle="PIB, recettes et depenses previsionnelles"
        icon={<TrendingUpIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mb: 3 }}>
        <Tab label="PIB et Croissance" />
        <Tab label="Recettes" />
        <Tab label="Depenses" />
      </Tabs>

      {selectedTab === 0 && latestFramework && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ChartIcon color="primary" />
                  <Typography variant="h6">Croissance PIB</Typography>
                </Box>
                <Typography variant="h3" color="primary">
                  {latestFramework.gdpGrowthRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taux de croissance prevu
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TrendingUpIcon color="warning" />
                  <Typography variant="h6">Inflation</Typography>
                </Box>
                <Typography variant="h3" color="warning.main">
                  {latestFramework.inflationRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taux d'inflation prevu
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AccountBalanceIcon color="success" />
                  <Typography variant="h6">PIB Nominal</Typography>
                </Box>
                <Typography variant="h3" color="success.main">
                  {formatNumber(latestFramework.nominalGDP)} M
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  En millions FDJ
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Projection du PIB sur 3 ans
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Indicateur</TableCell>
                        <TableCell align="right">Annee de base</TableCell>
                        <TableCell align="right">N+1</TableCell>
                        <TableCell align="right">N+2</TableCell>
                        <TableCell align="right">N+3</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>PIB Nominal (M FDJ)</TableCell>
                        <TableCell align="right">{formatNumber(latestFramework.nominalGDP)}</TableCell>
                        <TableCell align="right">{formatNumber(latestFramework.nominalGDPYear1)}</TableCell>
                        <TableCell align="right">{formatNumber(latestFramework.nominalGDPYear2)}</TableCell>
                        <TableCell align="right">{formatNumber(latestFramework.nominalGDPYear3)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Croissance (%)</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">{latestFramework.gdpGrowthRate}%</TableCell>
                        <TableCell align="right">{latestFramework.gdpGrowthRate}%</TableCell>
                        <TableCell align="right">{latestFramework.gdpGrowthRate}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Projections des Recettes
            </Typography>
            <Button
              variant="contained"
              onClick={() => latestFramework && navigate(`/macro/revenues/${latestFramework.id}`)}
              disabled={!latestFramework}
            >
              Voir les details des recettes
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Projections des Depenses
            </Typography>
            <Button
              variant="contained"
              onClick={() => latestFramework && navigate(`/macro/expenses/${latestFramework.id}`)}
              disabled={!latestFramework}
            >
              Voir les details des depenses
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MacroProjections;
