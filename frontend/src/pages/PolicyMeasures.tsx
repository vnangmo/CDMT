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
  Chip,
  CircularProgress,
  Alert,
  Button,
  Grid,
} from '@mui/material';
import {
  Tune as TuneIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface PolicyMeasure {
  id: string;
  measureCode: string;
  name: string;
  measureType: string;
  category: string;
  amountY1: number;
  amountY2: number;
  amountY3: number;
  status: string;
}

const PolicyMeasures: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [measures, setMeasures] = useState<PolicyMeasure[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Try to fetch policy measures if endpoint exists
      const response = await apiClient.get('/cdmt-global/policy-measures').catch(() => ({ data: { data: [] } }));
      const resData = response.data.data; setMeasures(Array.isArray(resData) ? resData : (resData?.data || []));
    } catch (err: any) {
      console.log('No policy measures endpoint available');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SALARY':
        return 'primary';
      case 'INVESTMENT':
        return 'success';
      case 'TRANSFER':
        return 'warning';
      default:
        return 'default';
    }
  };

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
        title="Mesures Nouvelles Centrales"
        subtitle="Gestion des mesures budgetaires au niveau central"
        icon={<TuneIcon />}
        action={
          <Button variant="contained" startIcon={<AddIcon />}>
            Nouvelle mesure
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Mesures de personnel
              </Typography>
              <Typography variant="h4" color="primary">
                {measures.filter(m => m.category === 'SALARY').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Mesures d'investissement
              </Typography>
              <Typography variant="h4" color="success.main">
                {measures.filter(m => m.category === 'INVESTMENT').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total mesures
              </Typography>
              <Typography variant="h4">
                {measures.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Categorie</TableCell>
                  <TableCell align="right">N+1</TableCell>
                  <TableCell align="right">N+2</TableCell>
                  <TableCell align="right">N+3</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {measures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        Aucune mesure nouvelle centrale enregistree
                      </Typography>
                      <Button variant="outlined" startIcon={<AddIcon />}>
                        Ajouter une mesure
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  measures.map((measure) => (
                    <TableRow key={measure.id} hover>
                      <TableCell>
                        <Typography fontWeight={500}>{measure.measureCode}</Typography>
                      </TableCell>
                      <TableCell>{measure.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={measure.category}
                          color={getCategoryColor(measure.category) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{formatAmount(measure.amountY1)}</TableCell>
                      <TableCell align="right">{formatAmount(measure.amountY2)}</TableCell>
                      <TableCell align="right">{formatAmount(measure.amountY3)}</TableCell>
                      <TableCell>
                        <Chip label={measure.status} size="small" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PolicyMeasures;
