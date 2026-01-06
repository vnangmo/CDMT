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
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface MacroFramework {
  id: string;
  year: number;
  budgetYear: number;
  status: string;
  createdAt: string;
}

const TOFEList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frameworks, setFrameworks] = useState<MacroFramework[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/macro-frameworks');
      setFrameworks(response.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALIDATED':
      case 'APPROVED':
        return 'success';
      case 'SUBMITTED':
        return 'warning';
      case 'DRAFT':
        return 'default';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      SUBMITTED: 'Soumis',
      VALIDATED: 'Valide',
      APPROVED: 'Approuve',
      REJECTED: 'Rejete',
    };
    return labels[status] || status;
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
        title="TOFE Previsionnel"
        subtitle="Tableau des Operations Financieres de l'Etat"
        icon={<DocumentIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Exercice</TableCell>
                  <TableCell>Annee budgetaire</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date de creation</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {frameworks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        Aucun cadre macroeconomique disponible
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  frameworks.map((framework) => (
                    <TableRow key={framework.id} hover>
                      <TableCell>
                        <Typography fontWeight={500}>{framework.year}</Typography>
                      </TableCell>
                      <TableCell>{framework.budgetYear}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(framework.status)}
                          color={getStatusColor(framework.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(framework.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => navigate(`/macro/tofe/${framework.id}`)}
                          title="Voir le TOFE"
                        >
                          <ViewIcon />
                        </IconButton>
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

export default TOFEList;
