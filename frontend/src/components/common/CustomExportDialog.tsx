import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Stack,
  TextField,
  SelectChangeEvent,
} from '@mui/material';
import {
  Download,
  FilePresent,
  TableChart,
  PictureAsPdf,
} from '@mui/icons-material';
import CustomExportService, { ExportColumn, ExportFilter } from '../../services/customExport.service';

interface CustomExportDialogProps {
  open: boolean;
  onClose: () => void;
  defaultEntityType?: string;
  defaultFilters?: ExportFilter[];
  fiscalYear?: number;
  ministryId?: string;
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  SectoralMeasure: 'Mesures Sectorielles',
  ActionPlan: 'Plans d\'Action',
  MinisterialCeiling: 'Plafonds Ministériels',
  CBMTDocument: 'Documents CBMT',
  CDMTGlobalScenario: 'Scénarios CDMT Global',
};

const FORMAT_OPTIONS = [
  { value: 'excel', label: 'Excel (.xlsx)', icon: <TableChart /> },
  { value: 'csv', label: 'CSV (.csv)', icon: <FilePresent /> },
  { value: 'pdf', label: 'PDF (.pdf)', icon: <PictureAsPdf /> },
];

const CustomExportDialog: React.FC<CustomExportDialogProps> = ({
  open,
  onClose,
  defaultEntityType,
  defaultFilters = [],
  fiscalYear,
  ministryId,
}) => {
  const [entityType, setEntityType] = useState<string>(defaultEntityType || '');
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ExportColumn[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [format, setFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [title, setTitle] = useState<string>('');
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingColumns, setLoadingColumns] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load entity types
  useEffect(() => {
    const loadEntityTypes = async () => {
      try {
        const types = await CustomExportService.getEntityTypes();
        setEntityTypes(types);
      } catch (err) {
        console.error('Error loading entity types:', err);
      }
    };
    loadEntityTypes();
  }, []);

  // Load columns when entity type changes
  useEffect(() => {
    const loadColumns = async () => {
      if (!entityType) {
        setAvailableColumns([]);
        setSelectedColumns([]);
        return;
      }

      setLoadingColumns(true);
      try {
        const columns = await CustomExportService.getColumns(entityType);
        setAvailableColumns(columns);
        // Select all columns by default
        setSelectedColumns(columns.map((c) => c.key));
        // Set default title
        setTitle(`Export ${ENTITY_TYPE_LABELS[entityType] || entityType}`);
      } catch (err) {
        console.error('Error loading columns:', err);
        setError('Erreur lors du chargement des colonnes');
      } finally {
        setLoadingColumns(false);
      }
    };
    loadColumns();
  }, [entityType]);

  // Set default entity type when provided
  useEffect(() => {
    if (defaultEntityType && open) {
      setEntityType(defaultEntityType);
    }
  }, [defaultEntityType, open]);

  const handleEntityTypeChange = (event: SelectChangeEvent<string>) => {
    setEntityType(event.target.value);
    setError(null);
  };

  const handleFormatChange = (event: SelectChangeEvent<string>) => {
    setFormat(event.target.value as 'excel' | 'csv' | 'pdf');
  };

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((c) => c !== columnKey)
        : [...prev, columnKey]
    );
  };

  const handleSelectAllColumns = () => {
    if (selectedColumns.length === availableColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(availableColumns.map((c) => c.key));
    }
  };

  const handleExport = async () => {
    if (!entityType || selectedColumns.length === 0) {
      setError('Veuillez sélectionner un type et au moins une colonne');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await CustomExportService.exportAndDownload({
        entityType,
        columns: selectedColumns,
        filters: defaultFilters,
        format,
        title: title || undefined,
        includeHeaders,
        fiscalYear,
        ministryId,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  // Group columns by category (based on prefix)
  const groupedColumns = availableColumns.reduce((acc, col) => {
    const parts = col.key.split('.');
    const group = parts.length > 1 ? parts[0] : 'principal';
    if (!acc[group]) acc[group] = [];
    acc[group].push(col);
    return acc;
  }, {} as Record<string, ExportColumn[]>);

  const GROUP_LABELS: Record<string, string> = {
    principal: 'Champs principaux',
    ministry: 'Ministère',
    program: 'Programme',
    action: 'Action',
    economicNature: 'Nature économique',
    fundingSource: 'Source de financement',
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Download />
          <Typography variant="h6">Export Personnalisé</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Entity Type Selection */}
          <FormControl fullWidth disabled={!!defaultEntityType}>
            <InputLabel>Type de données</InputLabel>
            <Select value={entityType} onChange={handleEntityTypeChange} label="Type de données">
              {entityTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {ENTITY_TYPE_LABELS[type] || type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Format Selection */}
          <FormControl fullWidth>
            <InputLabel>Format d'export</InputLabel>
            <Select value={format} onChange={handleFormatChange} label="Format d'export">
              {FORMAT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {opt.icon}
                    {opt.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Title */}
          <TextField
            fullWidth
            label="Titre du document (optionnel)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre personnalisé pour l'export"
          />

          {/* Options */}
          <FormControlLabel
            control={
              <Checkbox
                checked={includeHeaders}
                onChange={(e) => setIncludeHeaders(e.target.checked)}
              />
            }
            label="Inclure les en-têtes de colonnes"
          />

          {/* Column Selection */}
          {entityType && (
            <>
              <Divider />

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Colonnes à exporter
                  </Typography>
                  <Button size="small" onClick={handleSelectAllColumns}>
                    {selectedColumns.length === availableColumns.length
                      ? 'Désélectionner tout'
                      : 'Sélectionner tout'}
                  </Button>
                </Box>

                {loadingColumns ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary">
                        {selectedColumns.length} colonne(s) sélectionnée(s) sur {availableColumns.length}
                      </Typography>
                    </Box>

                    {Object.entries(groupedColumns).map(([group, columns]) => (
                      <Box key={group} mb={2}>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}
                        >
                          {GROUP_LABELS[group] || group}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {columns.map((col) => (
                            <Chip
                              key={col.key}
                              label={col.label}
                              onClick={() => handleColumnToggle(col.key)}
                              color={selectedColumns.includes(col.key) ? 'primary' : 'default'}
                              variant={selectedColumns.includes(col.key) ? 'filled' : 'outlined'}
                              size="small"
                              sx={{ cursor: 'pointer' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={loading || !entityType || selectedColumns.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <Download />}
        >
          {loading ? 'Export en cours...' : 'Exporter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomExportDialog;
