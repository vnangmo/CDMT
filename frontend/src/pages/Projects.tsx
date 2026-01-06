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
  Button,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Folder as FolderIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface Project {
  id: string;
  projectCode: string;
  name: string;
  projectType: 'PIE' | 'PIP';
  ministryId: string;
  ministryCode?: string;
  totalCost: number;
  amountY1: number;
  amountY2: number;
  amountY3: number;
  status: string;
  fundingSource?: string;
}

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Try to load PIE and PIP projects
      const [pieRes, pipRes] = await Promise.all([
        apiClient.get('/pie-projects?limit=100').catch(() => ({ data: { data: [] } })),
        apiClient.get('/pip-projects?limit=100').catch(() => ({ data: { data: [] } })),
      ]);

      const pieProjects = (pieRes.data.data || []).map((p: any) => ({
        ...p,
        projectType: 'PIE' as const,
      }));

      const pipProjects = (pipRes.data.data || []).map((p: any) => ({
        ...p,
        projectType: 'PIP' as const,
      }));

      setProjects([...pieProjects, ...pipProjects]);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value || 0);
  };

  const filteredProjects = selectedTab === 0
    ? projects
    : selectedTab === 1
      ? projects.filter(p => p.projectType === 'PIE')
      : projects.filter(p => p.projectType === 'PIP');

  const pieTotal = projects.filter(p => p.projectType === 'PIE').reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const pipTotal = projects.filter(p => p.projectType === 'PIP').reduce((sum, p) => sum + (p.totalCost || 0), 0);

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
        title="Projets PIE/PIP"
        subtitle="Gestion des projets d'investissement et d'equipement"
        icon={<FolderIcon />}
        action={
          <Button variant="contained" startIcon={<AddIcon />}>
            Nouveau projet
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
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Projets PIE
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {projects.filter(p => p.projectType === 'PIE').length}
              </Typography>
              <Typography variant="caption">
                Total: {formatAmount(pieTotal)} M FDJ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AccountBalanceIcon color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Projets PIP
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {projects.filter(p => p.projectType === 'PIP').length}
              </Typography>
              <Typography variant="caption">
                Total: {formatAmount(pipTotal)} M FDJ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <FolderIcon color="warning" />
                <Typography variant="subtitle2" color="text.secondary">
                  Total projets
                </Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {projects.length}
              </Typography>
              <Typography variant="caption">
                Total: {formatAmount(pieTotal + pipTotal)} M FDJ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)} sx={{ mb: 2 }}>
            <Tab label={`Tous (${projects.length})`} />
            <Tab label={`PIE (${projects.filter(p => p.projectType === 'PIE').length})`} />
            <Tab label={`PIP (${projects.filter(p => p.projectType === 'PIP').length})`} />
          </Tabs>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Cout total</TableCell>
                  <TableCell align="right">N+1</TableCell>
                  <TableCell align="right">N+2</TableCell>
                  <TableCell align="right">N+3</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        Aucun projet enregistre
                      </Typography>
                      <Button variant="outlined" startIcon={<AddIcon />}>
                        Ajouter un projet
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project) => (
                    <TableRow key={project.id} hover>
                      <TableCell>
                        <Typography fontWeight={500}>{project.projectCode}</Typography>
                      </TableCell>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={project.projectType}
                          size="small"
                          color={project.projectType === 'PIE' ? 'primary' : 'success'}
                        />
                      </TableCell>
                      <TableCell align="right">{formatAmount(project.totalCost)} M</TableCell>
                      <TableCell align="right">{formatAmount(project.amountY1)} M</TableCell>
                      <TableCell align="right">{formatAmount(project.amountY2)} M</TableCell>
                      <TableCell align="right">{formatAmount(project.amountY3)} M</TableCell>
                      <TableCell>
                        <Chip label={project.status || 'DRAFT'} size="small" />
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

export default Projects;
