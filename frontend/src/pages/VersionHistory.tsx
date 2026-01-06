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
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  History as HistoryIcon,
  Visibility as ViewIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface Version {
  id: string;
  versionNumber: number;
  documentType: string;
  documentId: string;
  documentCode: string;
  status: string;
  createdAt: string;
  createdBy: string;
  changes: string;
}

const VersionHistory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [documentType, setDocumentType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Attempt to load document versions if endpoint exists
      const response = await apiClient.get('/document-versions?limit=100').catch(() => ({ data: { data: [] } }));
      setVersions(response.data.data || []);
    } catch (err: any) {
      console.log('Versions endpoint not available');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CURRENT':
        return 'success';
      case 'ARCHIVED':
        return 'default';
      case 'DRAFT':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredVersions = documentType === 'all'
    ? versions
    : versions.filter(v => v.documentType === documentType);

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
        title="Historique des Versions"
        subtitle="Suivi des modifications et versions des documents"
        icon={<HistoryIcon />}
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
                Total versions
              </Typography>
              <Typography variant="h4" color="primary">
                {versions.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Versions courantes
              </Typography>
              <Typography variant="h4" color="success.main">
                {versions.filter(v => v.status === 'CURRENT').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Versions archivees
              </Typography>
              <Typography variant="h4">
                {versions.filter(v => v.status === 'ARCHIVED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Type de document</InputLabel>
            <Select
              value={documentType}
              label="Type de document"
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <MenuItem value="all">Tous les types</MenuItem>
              <MenuItem value="CBMT">CBMT</MenuItem>
              <MenuItem value="CDMT_GLOBAL">CDMT Global</MenuItem>
              <MenuItem value="CDMT_SECTORAL">CDMT Sectoriel</MenuItem>
              <MenuItem value="ACTION_PLAN">Plan d'action</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Version</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Document</TableCell>
                  <TableCell>Modifications</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVersions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        Aucun historique de version disponible
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVersions.map((version) => (
                    <TableRow key={version.id} hover>
                      <TableCell>
                        <Typography fontWeight={500}>V{version.versionNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={version.documentType} size="small" />
                      </TableCell>
                      <TableCell>{version.documentCode}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {version.changes || 'Aucune description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(version.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={version.status}
                          size="small"
                          color={getStatusColor(version.status) as any}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="Voir">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" title="Comparer">
                          <CompareIcon fontSize="small" />
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

export default VersionHistory;
