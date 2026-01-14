import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Equalizer as EqualizerIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import macroService from '../services/macro.service';
import referentielService from '../services/referentiel.service';
import fiscalMarginService, {
  ReserveRate,
  AvailableFiscalMargin,
  NewMeasureRate,
  NewMeasure,
  DistributionKey,
  MinistryMargin,
} from '../services/fiscalMargin.service';
import { MacroFramework } from '../types/macro.types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Catégories de dépenses pour les marges
const EXPENSE_CATEGORIES = [
  { code: 'PERSONNEL', name: 'Dépenses de personnel' },
  { code: 'BIENS_SERVICES', name: 'Biens et services' },
  { code: 'TRANSFERTS', name: 'Transferts' },
  { code: 'INVESTISSEMENT', name: 'Investissement' },
];

interface Ministry {
  id: string;
  code: string;
  name: string;
}

const FiscalMargins: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Data states
  const [macroFrameworks, setMacroFrameworks] = useState<MacroFramework[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>('');
  const [ministries, setMinistries] = useState<Ministry[]>([]);

  // Fiscal margin data
  const [reserveRates, setReserveRates] = useState<ReserveRate[]>([]);
  const [availableMargins, setAvailableMargins] = useState<AvailableFiscalMargin[]>([]);
  const [newMeasureRates, setNewMeasureRates] = useState<NewMeasureRate[]>([]);
  const [newMeasures, setNewMeasures] = useState<NewMeasure[]>([]);
  const [distributionKeys, setDistributionKeys] = useState<DistributionKey[]>([]);
  const [ministryMargins, setMinistryMargins] = useState<MinistryMargin[]>([]);

  // Filter states
  const [selectedMinistryFilter, setSelectedMinistryFilter] = useState<string>('');

  // Dialog states
  const [newMeasureDialog, setNewMeasureDialog] = useState(false);
  const [editingMeasure, setEditingMeasure] = useState<NewMeasure | null>(null);
  const [measureForm, setMeasureForm] = useState({
    measureName: '',
    expenseCategory: '',
    categoryCode: '',
    description: '',
    amountY1: 0,
    amountY2: 0,
    amountY3: 0,
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load fiscal margin data when framework changes
  useEffect(() => {
    if (selectedFrameworkId) {
      loadFiscalMarginData();
    }
  }, [selectedFrameworkId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [frameworksData, ministriesData] = await Promise.all([
        macroService.getMacroFrameworks(),
        referentielService.getMinistries(),
      ]);

      setMacroFrameworks(frameworksData);
      setMinistries(ministriesData);

      // Select first approved or validated framework
      const activeFramework = frameworksData.find(
        (f: MacroFramework) => f.status === 'APPROVED' || f.status === 'VALIDATED'
      ) || frameworksData[0];

      if (activeFramework) {
        setSelectedFrameworkId(activeFramework.id);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadFiscalMarginData = useCallback(async () => {
    if (!selectedFrameworkId) return;

    try {
      setLoading(true);
      const [rates, margins, measureRates, measures, keys, minMargins] = await Promise.all([
        fiscalMarginService.getReserveRates(selectedFrameworkId),
        fiscalMarginService.getAvailableFiscalMargins(selectedFrameworkId),
        fiscalMarginService.getNewMeasureRates(selectedFrameworkId),
        fiscalMarginService.getNewMeasures(selectedFrameworkId),
        fiscalMarginService.getDistributionKeys(selectedFrameworkId),
        fiscalMarginService.getMinistryMargins(selectedFrameworkId),
      ]);

      setReserveRates(rates);
      setAvailableMargins(margins);
      setNewMeasureRates(measureRates);
      setNewMeasures(measures);
      setDistributionKeys(keys);
      setMinistryMargins(minMargins);
    } catch (err: any) {
      console.error('Error loading fiscal margin data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFrameworkId]);

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${Number(value).toFixed(2)}%`;
  };

  // Reserve Rates handlers
  const handleReserveRateChange = (index: number, field: string, value: number) => {
    const updatedRates = [...reserveRates];
    (updatedRates[index] as any)[field] = value;
    setReserveRates(updatedRates);
  };

  const saveReserveRates = async () => {
    try {
      setSaving(true);
      await fiscalMarginService.upsertReserveRates(selectedFrameworkId, reserveRates);
      setSuccess('Taux des réserves enregistrés avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const initializeReserveRates = async () => {
    const newRates = EXPENSE_CATEGORIES.map((cat) => ({
      macroFrameworkId: selectedFrameworkId,
      expenseCategory: cat.name,
      categoryCode: cat.code,
      contingencyRateY1: 2,
      programmingRateY1: 1,
      contingencyRateY2: 2,
      programmingRateY2: 1,
      contingencyRateY3: 2,
      programmingRateY3: 1,
      isActive: true,
    }));

    try {
      setSaving(true);
      await fiscalMarginService.upsertReserveRates(selectedFrameworkId, newRates);
      await loadFiscalMarginData();
      setSuccess('Taux des réserves initialisés avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'initialisation');
    } finally {
      setSaving(false);
    }
  };

  // Available Margins handlers
  const calculateMargins = async () => {
    try {
      setSaving(true);
      await fiscalMarginService.calculateAvailableFiscalMargins(selectedFrameworkId);
      await loadFiscalMarginData();
      setSuccess('Marges disponibles calculées avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul');
    } finally {
      setSaving(false);
    }
  };

  // New Measure Rates handlers
  const handleMeasureRateChange = (index: number, field: string, value: number) => {
    const updatedRates = [...newMeasureRates];
    (updatedRates[index] as any)[field] = value;
    setNewMeasureRates(updatedRates);
  };

  const saveMeasureRates = async () => {
    try {
      setSaving(true);
      await fiscalMarginService.upsertNewMeasureRates(selectedFrameworkId, newMeasureRates);
      setSuccess('Taux des mesures nouvelles enregistrés avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const initializeMeasureRates = async () => {
    const newRates = EXPENSE_CATEGORIES.map((cat) => ({
      macroFrameworkId: selectedFrameworkId,
      expenseCategory: cat.name,
      categoryCode: cat.code,
      rateY1: 0,
      rateY2: 0,
      rateY3: 0,
      isActive: true,
    }));

    try {
      setSaving(true);
      await fiscalMarginService.upsertNewMeasureRates(selectedFrameworkId, newRates);
      await loadFiscalMarginData();
      setSuccess('Taux des mesures nouvelles initialisés avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'initialisation');
    } finally {
      setSaving(false);
    }
  };

  // New Measures handlers
  const handleOpenMeasureDialog = (measure?: NewMeasure) => {
    if (measure) {
      setEditingMeasure(measure);
      setMeasureForm({
        measureName: measure.measureName,
        expenseCategory: measure.expenseCategory,
        categoryCode: measure.categoryCode,
        description: measure.description || '',
        amountY1: measure.amountY1,
        amountY2: measure.amountY2,
        amountY3: measure.amountY3,
      });
    } else {
      setEditingMeasure(null);
      setMeasureForm({
        measureName: '',
        expenseCategory: '',
        categoryCode: '',
        description: '',
        amountY1: 0,
        amountY2: 0,
        amountY3: 0,
      });
    }
    setNewMeasureDialog(true);
  };

  const handleSaveMeasure = async () => {
    try {
      setSaving(true);
      if (editingMeasure) {
        await fiscalMarginService.updateNewMeasure(editingMeasure.id, measureForm);
      } else {
        await fiscalMarginService.createNewMeasure({
          ...measureForm,
          macroFrameworkId: selectedFrameworkId,
        });
      }
      setNewMeasureDialog(false);
      await loadFiscalMarginData();
      setSuccess('Mesure nouvelle enregistrée avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeasure = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette mesure ?')) return;

    try {
      await fiscalMarginService.deleteNewMeasure(id);
      await loadFiscalMarginData();
      setSuccess('Mesure supprimée avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  // Distribution Keys handlers
  const handleDistributionKeyChange = (index: number, field: string, value: number) => {
    const updatedKeys = [...distributionKeys];
    (updatedKeys[index] as any)[field] = value;
    setDistributionKeys(updatedKeys);
  };

  const saveDistributionKeys = async () => {
    try {
      setSaving(true);
      await fiscalMarginService.upsertDistributionKeys(selectedFrameworkId, distributionKeys);
      setSuccess('Clés de répartition enregistrées avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const initializeDistributionKeys = async () => {
    const equalRate = 100 / ministries.length;
    const newKeys = ministries.map((ministry) => ({
      macroFrameworkId: selectedFrameworkId,
      ministryId: ministry.id,
      rateY1: equalRate,
      rateY2: equalRate,
      rateY3: equalRate,
      isActive: true,
    }));

    try {
      setSaving(true);
      await fiscalMarginService.upsertDistributionKeys(selectedFrameworkId, newKeys);
      await loadFiscalMarginData();
      setSuccess('Clés de répartition initialisées avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'initialisation');
    } finally {
      setSaving(false);
    }
  };

  // Ministry Margins handlers
  const calculateMinistryMargins = async () => {
    try {
      setSaving(true);
      await fiscalMarginService.calculateMinistryMargins(selectedFrameworkId);
      await loadFiscalMarginData();
      setSuccess('Marges par ministère calculées avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedFramework = () => {
    return macroFrameworks.find((f) => f.id === selectedFrameworkId);
  };

  const getYearLabels = () => {
    const framework = getSelectedFramework();
    if (!framework) return { y1: 'Année 1', y2: 'Année 2', y3: 'Année 3' };
    return {
      y1: `${framework.budgetYear}`,
      y2: `${framework.budgetYear + 1}`,
      y3: `${framework.budgetYear + 2}`,
    };
  };

  const years = getYearLabels();

  if (loading && macroFrameworks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Marges de Manoeuvre"
        subtitle="Gestion des taux de réserves, marges disponibles, mesures nouvelles et clés de répartition"
        icon={<EqualizerIcon />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Framework selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Cadre Macroéconomique</InputLabel>
                <Select
                  value={selectedFrameworkId}
                  onChange={(e) => setSelectedFrameworkId(e.target.value)}
                  label="Cadre Macroéconomique"
                >
                  {macroFrameworks.map((fw) => (
                    <MenuItem key={fw.id} value={fw.id}>
                      {fw.year} - {fw.budgetYear} ({fw.status})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadFiscalMarginData}
                disabled={loading}
              >
                Actualiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Taux des réserves" />
          <Tab label="Marges disponibles" />
          <Tab label="Mesures nouvelles" />
          <Tab label="Clé de répartition" />
          <Tab label="Marge par ministère" />
        </Tabs>
      </Paper>

      {/* Tab 0: Reserve Rates */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Taux des réserves par catégorie de dépense</Typography>
              <Box>
                {reserveRates.length === 0 && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={initializeReserveRates}
                    sx={{ mr: 1 }}
                  >
                    Initialiser
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveReserveRates}
                  disabled={saving || reserveRates.length === 0}
                >
                  Enregistrer
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell rowSpan={2}>Catégorie</TableCell>
                    <TableCell colSpan={2} align="center">{years.y1}</TableCell>
                    <TableCell colSpan={2} align="center">{years.y2}</TableCell>
                    <TableCell colSpan={2} align="center">{years.y3}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell align="center">Imprévus (%)</TableCell>
                    <TableCell align="center">Prog. (%)</TableCell>
                    <TableCell align="center">Imprévus (%)</TableCell>
                    <TableCell align="center">Prog. (%)</TableCell>
                    <TableCell align="center">Imprévus (%)</TableCell>
                    <TableCell align="center">Prog. (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reserveRates.map((rate, index) => (
                    <TableRow key={rate.id || index}>
                      <TableCell>{rate.expenseCategory}</TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={rate.contingencyRateY1}
                          onChange={(e) =>
                            handleReserveRateChange(index, 'contingencyRateY1', parseFloat(e.target.value) || 0)
                          }
                          inputProps={{ step: 0.1, min: 0, max: 100, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={rate.programmingRateY1}
                          onChange={(e) =>
                            handleReserveRateChange(index, 'programmingRateY1', parseFloat(e.target.value) || 0)
                          }
                          inputProps={{ step: 0.1, min: 0, max: 100, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={rate.contingencyRateY2}
                          onChange={(e) =>
                            handleReserveRateChange(index, 'contingencyRateY2', parseFloat(e.target.value) || 0)
                          }
                          inputProps={{ step: 0.1, min: 0, max: 100, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={rate.programmingRateY2}
                          onChange={(e) =>
                            handleReserveRateChange(index, 'programmingRateY2', parseFloat(e.target.value) || 0)
                          }
                          inputProps={{ step: 0.1, min: 0, max: 100, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={rate.contingencyRateY3}
                          onChange={(e) =>
                            handleReserveRateChange(index, 'contingencyRateY3', parseFloat(e.target.value) || 0)
                          }
                          inputProps={{ step: 0.1, min: 0, max: 100, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={rate.programmingRateY3}
                          onChange={(e) =>
                            handleReserveRateChange(index, 'programmingRateY3', parseFloat(e.target.value) || 0)
                          }
                          inputProps={{ step: 0.1, min: 0, max: 100, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {reserveRates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Aucun taux de réserve défini. Cliquez sur "Initialiser" pour créer les taux par défaut.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 1: Available Margins */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Marges de manoeuvre disponibles</Typography>
              <Button
                variant="contained"
                startIcon={<CalculateIcon />}
                onClick={calculateMargins}
                disabled={saving}
              >
                Calculer les marges
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Catégorie</TableCell>
                    <TableCell align="right">CBMT {years.y1}</TableCell>
                    <TableCell align="right">Tendanciel {years.y1}</TableCell>
                    <TableCell align="right">Marge brute {years.y1}</TableCell>
                    <TableCell align="right">Rés. imprévus</TableCell>
                    <TableCell align="right">Rés. prog.</TableCell>
                    <TableCell align="right">Marge dispo.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableMargins.map((margin) => (
                    <TableRow key={margin.id}>
                      <TableCell>{margin.expenseCategory}</TableCell>
                      <TableCell align="right">{formatAmount(margin.cbmtAmountY1)}</TableCell>
                      <TableCell align="right">{formatAmount(margin.trendAmountY1)}</TableCell>
                      <TableCell align="right">{formatAmount(margin.marginBeforeReservesY1)}</TableCell>
                      <TableCell align="right">{formatAmount(margin.contingencyReservesY1)}</TableCell>
                      <TableCell align="right">{formatAmount(margin.programmingReservesY1)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatAmount(margin.availableMarginY1)}
                          color={margin.availableMarginY1 >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {availableMargins.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Aucune marge calculée. Cliquez sur "Calculer les marges" pour générer les données.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {availableMargins.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Récapitulatif sur 3 ans
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: years.y1, y: 'Y1' },
                    { label: years.y2, y: 'Y2' },
                    { label: years.y3, y: 'Y3' },
                  ].map(({ label, y }) => {
                    const totalAvailable = availableMargins.reduce(
                      (sum, m) => sum + (m[`availableMargin${y}` as keyof AvailableFiscalMargin] as number || 0),
                      0
                    );
                    return (
                      <Grid size={{ xs: 12, md: 4 }} key={y}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                              {label}
                            </Typography>
                            <Typography variant="h5" color={totalAvailable >= 0 ? 'success.main' : 'error.main'}>
                              {formatAmount(totalAvailable)} M FDJ
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 2: New Measures */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* New Measure Rates */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Taux mesures nouvelles par catégorie</Typography>
                  <Box>
                    {newMeasureRates.length === 0 && (
                      <Button
                        startIcon={<AddIcon />}
                        onClick={initializeMeasureRates}
                        sx={{ mr: 1 }}
                      >
                        Initialiser
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={saveMeasureRates}
                      disabled={saving || newMeasureRates.length === 0}
                    >
                      Enregistrer
                    </Button>
                  </Box>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Catégorie</TableCell>
                        <TableCell align="center">{years.y1} (%)</TableCell>
                        <TableCell align="center">{years.y2} (%)</TableCell>
                        <TableCell align="center">{years.y3} (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {newMeasureRates.map((rate, index) => (
                        <TableRow key={rate.id || index}>
                          <TableCell>{rate.expenseCategory}</TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={rate.rateY1}
                              onChange={(e) =>
                                handleMeasureRateChange(index, 'rateY1', parseFloat(e.target.value) || 0)
                              }
                              inputProps={{ step: 0.1, min: 0, max: 100, style: { textAlign: 'center' } }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={rate.rateY2}
                              onChange={(e) =>
                                handleMeasureRateChange(index, 'rateY2', parseFloat(e.target.value) || 0)
                              }
                              inputProps={{ step: 0.1, min: 0, max: 100, style: { textAlign: 'center' } }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={rate.rateY3}
                              onChange={(e) =>
                                handleMeasureRateChange(index, 'rateY3', parseFloat(e.target.value) || 0)
                              }
                              inputProps={{ step: 0.1, min: 0, max: 100, style: { textAlign: 'center' } }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {newMeasureRates.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            Aucun taux défini.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* New Measures List */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Mesures nouvelles centrales</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenMeasureDialog()}
                  >
                    Ajouter
                  </Button>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Mesure</TableCell>
                        <TableCell>Catégorie</TableCell>
                        <TableCell align="right">{years.y1}</TableCell>
                        <TableCell align="right">{years.y2}</TableCell>
                        <TableCell align="right">{years.y3}</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {newMeasures.map((measure) => (
                        <TableRow key={measure.id}>
                          <TableCell>{measure.measureName}</TableCell>
                          <TableCell>{measure.expenseCategory}</TableCell>
                          <TableCell align="right">{formatAmount(measure.amountY1)}</TableCell>
                          <TableCell align="right">{formatAmount(measure.amountY2)}</TableCell>
                          <TableCell align="right">{formatAmount(measure.amountY3)}</TableCell>
                          <TableCell align="center">
                            <Tooltip title="Modifier">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenMeasureDialog(measure)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteMeasure(measure.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {newMeasures.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            Aucune mesure nouvelle définie.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {newMeasures.length > 0 && (
                  <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
                    <Typography variant="subtitle2">
                      Total: {formatAmount(newMeasures.reduce((sum, m) => sum + m.amountY1, 0))} /
                      {formatAmount(newMeasures.reduce((sum, m) => sum + m.amountY2, 0))} /
                      {formatAmount(newMeasures.reduce((sum, m) => sum + m.amountY3, 0))} M FDJ
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 3: Distribution Keys */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Clé de répartition par ministère</Typography>
              <Box>
                {distributionKeys.length === 0 && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={initializeDistributionKeys}
                    sx={{ mr: 1 }}
                  >
                    Initialiser
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveDistributionKeys}
                  disabled={saving || distributionKeys.length === 0}
                >
                  Enregistrer
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Ministère</TableCell>
                    <TableCell align="center">{years.y1} (%)</TableCell>
                    <TableCell align="center">{years.y2} (%)</TableCell>
                    <TableCell align="center">{years.y3} (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {distributionKeys.map((key, index) => (
                    <TableRow key={key.id || index}>
                      <TableCell>{key.ministry?.code || '-'}</TableCell>
                      <TableCell>{key.ministry?.name || '-'}</TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={key.rateY1}
                          onChange={(e) =>
                            handleDistributionKeyChange(index, 'rateY1', parseFloat(e.target.value) || 0)
                          }
                          inputProps={{ step: 0.01, min: 0, max: 100, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={key.rateY2}
                          onChange={(e) =>
                            handleDistributionKeyChange(index, 'rateY2', parseFloat(e.target.value) || 0)
                          }
                          inputProps={{ step: 0.01, min: 0, max: 100, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={key.rateY3}
                          onChange={(e) =>
                            handleDistributionKeyChange(index, 'rateY3', parseFloat(e.target.value) || 0)
                          }
                          inputProps={{ step: 0.01, min: 0, max: 100, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {distributionKeys.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Aucune clé de répartition définie.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {distributionKeys.length > 0 && (
              <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
                <Typography variant="subtitle2">
                  Total: {formatPercentage(distributionKeys.reduce((sum, k) => sum + k.rateY1, 0))} /
                  {formatPercentage(distributionKeys.reduce((sum, k) => sum + k.rateY2, 0))} /
                  {formatPercentage(distributionKeys.reduce((sum, k) => sum + k.rateY3, 0))}
                </Typography>
                {Math.abs(distributionKeys.reduce((sum, k) => sum + k.rateY1, 0) - 100) > 0.01 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    La somme des taux doit être égale à 100%
                  </Alert>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 4: Ministry Margins */}
      <TabPanel value={tabValue} index={4}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Marge par ministère</Typography>
              <Button
                variant="contained"
                startIcon={<CalculateIcon />}
                onClick={calculateMinistryMargins}
                disabled={saving}
              >
                Calculer les marges
              </Button>
            </Box>

            {/* Filter by Ministry */}
            <Box mb={3}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Filtrer par ministère</InputLabel>
                    <Select
                      value={selectedMinistryFilter}
                      onChange={(e) => setSelectedMinistryFilter(e.target.value)}
                      label="Filtrer par ministère"
                    >
                      <MenuItem value="">
                        <em>Tous les ministères</em>
                      </MenuItem>
                      {/* Get unique ministries from margins */}
                      {Array.from(
                        new Map(
                          ministryMargins
                            .filter((m) => m.ministry)
                            .map((m) => [m.ministry!.id, m.ministry!])
                        ).values()
                      )
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((ministry) => (
                          <MenuItem key={ministry.id} value={ministry.id}>
                            {ministry.code} - {ministry.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  {selectedMinistryFilter && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedMinistryFilter('')}
                    >
                      Effacer le filtre
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Ministère</TableCell>
                    <TableCell>Catégorie</TableCell>
                    <TableCell align="right">{years.y1}</TableCell>
                    <TableCell align="right">{years.y2}</TableCell>
                    <TableCell align="right">{years.y3}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ministryMargins
                    .filter((margin) =>
                      !selectedMinistryFilter || margin.ministryId === selectedMinistryFilter
                    )
                    .map((margin) => (
                      <TableRow key={margin.id}>
                        <TableCell>{margin.ministry?.code || '-'}</TableCell>
                        <TableCell>{margin.ministry?.name || '-'}</TableCell>
                        <TableCell>{margin.expenseCategory}</TableCell>
                        <TableCell align="right">{formatAmount(margin.marginY1)}</TableCell>
                        <TableCell align="right">{formatAmount(margin.marginY2)}</TableCell>
                        <TableCell align="right">{formatAmount(margin.marginY3)}</TableCell>
                      </TableRow>
                    ))}
                  {ministryMargins.filter((margin) =>
                    !selectedMinistryFilter || margin.ministryId === selectedMinistryFilter
                  ).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {selectedMinistryFilter
                          ? 'Aucune marge pour ce ministère.'
                          : 'Aucune marge par ministère calculée.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {ministryMargins.length > 0 && (
              <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
                <Typography variant="subtitle2">
                  {selectedMinistryFilter ? 'Total (filtré): ' : 'Total: '}
                  {formatAmount(
                    ministryMargins
                      .filter((m) => !selectedMinistryFilter || m.ministryId === selectedMinistryFilter)
                      .reduce((sum, m) => sum + m.marginY1, 0)
                  )} /
                  {formatAmount(
                    ministryMargins
                      .filter((m) => !selectedMinistryFilter || m.ministryId === selectedMinistryFilter)
                      .reduce((sum, m) => sum + m.marginY2, 0)
                  )} /
                  {formatAmount(
                    ministryMargins
                      .filter((m) => !selectedMinistryFilter || m.ministryId === selectedMinistryFilter)
                      .reduce((sum, m) => sum + m.marginY3, 0)
                  )} M FDJ
                </Typography>
                {selectedMinistryFilter && (
                  <Typography variant="caption" color="text.secondary">
                    {ministryMargins.filter((m) => m.ministryId === selectedMinistryFilter).length} catégorie(s) affichée(s)
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* New Measure Dialog */}
      <Dialog open={newMeasureDialog} onClose={() => setNewMeasureDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMeasure ? 'Modifier la mesure' : 'Nouvelle mesure'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nom de la mesure"
                value={measureForm.measureName}
                onChange={(e) => setMeasureForm({ ...measureForm, measureName: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Catégorie de dépense</InputLabel>
                <Select
                  value={measureForm.categoryCode}
                  onChange={(e) => {
                    const cat = EXPENSE_CATEGORIES.find((c) => c.code === e.target.value);
                    setMeasureForm({
                      ...measureForm,
                      categoryCode: e.target.value,
                      expenseCategory: cat?.name || '',
                    });
                  }}
                  label="Catégorie de dépense"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.code} value={cat.code}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={measureForm.description}
                onChange={(e) => setMeasureForm({ ...measureForm, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={`Montant ${years.y1}`}
                value={measureForm.amountY1}
                onChange={(e) => setMeasureForm({ ...measureForm, amountY1: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={`Montant ${years.y2}`}
                value={measureForm.amountY2}
                onChange={(e) => setMeasureForm({ ...measureForm, amountY2: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={`Montant ${years.y3}`}
                value={measureForm.amountY3}
                onChange={(e) => setMeasureForm({ ...measureForm, amountY3: parseFloat(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewMeasureDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSaveMeasure}
            disabled={saving || !measureForm.measureName || !measureForm.categoryCode}
          >
            {editingMeasure ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FiscalMargins;
