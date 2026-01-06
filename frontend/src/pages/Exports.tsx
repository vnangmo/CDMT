import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon,
  Description as WordIcon,
  Code as JsonIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  format: string;
}

const Exports: React.FC = () => {
  const [documentType, setDocumentType] = useState<string>('');
  const [format, setFormat] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear() + 1);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeComments, setIncludeComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportOptions: ExportOption[] = [
    {
      id: 'pdf',
      label: 'PDF',
      description: 'Document formate pour impression',
      icon: <PdfIcon sx={{ fontSize: 40, color: '#f44336' }} />,
      format: 'pdf',
    },
    {
      id: 'excel',
      label: 'Excel',
      description: 'Tableur avec donnees editables',
      icon: <ExcelIcon sx={{ fontSize: 40, color: '#4caf50' }} />,
      format: 'xlsx',
    },
    {
      id: 'word',
      label: 'Word',
      description: 'Document texte modifiable',
      icon: <WordIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
      format: 'docx',
    },
    {
      id: 'json',
      label: 'JSON',
      description: 'Donnees brutes pour integration',
      icon: <JsonIcon sx={{ fontSize: 40, color: '#ff9800' }} />,
      format: 'json',
    },
  ];

  const documentTypes = [
    { value: 'cbmt', label: 'CBMT - Cadre Budgetaire a Moyen Terme' },
    { value: 'cdmt-global', label: 'CDMT Global' },
    { value: 'cdmt-sectoral', label: 'CDMT Sectoriel' },
    { value: 'tofe', label: 'TOFE Previsionnel' },
    { value: 'action-plan', label: "Plans d'action" },
    { value: 'ministerial-ceilings', label: 'Plafonds ministeriels' },
    { value: 'pie-projects', label: 'Projets PIE' },
    { value: 'pip-projects', label: 'Projets PIP' },
  ];

  const handleExport = async () => {
    if (!documentType || !format) {
      setError('Veuillez selectionner un type de document et un format');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Simulate export - in real implementation, call API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In real implementation:
      // const response = await apiClient.get(`/exports/${documentType}`, {
      //   params: { format, year, includeCharts, includeComments },
      //   responseType: 'blob',
      // });
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `${documentType}_${year}.${format}`);
      // document.body.appendChild(link);
      // link.click();

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Exports"
        subtitle="Exporter les documents budgetaires dans differents formats"
        icon={<DownloadIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
          Export genere avec succes!
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Selection du document
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Type de document</InputLabel>
                    <Select
                      value={documentType}
                      label="Type de document"
                      onChange={(e) => setDocumentType(e.target.value)}
                    >
                      {documentTypes.map((dt) => (
                        <MenuItem key={dt.value} value={dt.value}>
                          {dt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
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
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Format d'export
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                {exportOptions.map((option) => (
                  <Grid size={{ xs: 6, md: 3 }} key={option.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: format === option.format ? 2 : 1,
                        borderColor: format === option.format ? 'primary.main' : 'divider',
                        bgcolor: format === option.format ? 'primary.50' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                        },
                      }}
                      onClick={() => setFormat(option.format)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        {option.icon}
                        <Typography variant="subtitle1" fontWeight={500} sx={{ mt: 1 }}>
                          {option.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Options
              </Typography>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                    />
                  }
                  label="Inclure les graphiques"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeComments}
                      onChange={(e) => setIncludeComments(e.target.checked)}
                    />
                  }
                  label="Inclure les commentaires"
                />
              </FormGroup>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                  onClick={handleExport}
                  disabled={loading || !documentType || !format}
                >
                  {loading ? 'Generation en cours...' : 'Generer l\'export'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Exports recents
              </Typography>
              <Box textAlign="center" py={4}>
                <DownloadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  Aucun export recent
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Aide
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>PDF:</strong> Ideal pour l'impression et le partage officiel.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Excel:</strong> Permet de modifier les donnees et effectuer des analyses.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Word:</strong> Pour les rapports necessitant des modifications textuelles.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>JSON:</strong> Pour l'integration avec d'autres systemes informatiques.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Exports;
