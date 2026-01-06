import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Divider, IconButton, Collapse, Tooltip, Chip,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Alert, Paper, TextField, FormControlLabel, Checkbox, Snackbar,
} from '@mui/material';
import {
  ListAlt as ListIcon, AccountTree as ProgramIcon, Flag as ObjectiveIcon,
  Speed as IndicatorIcon, Category as CategoryIcon, ArrowForward as ArrowIcon,
  ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
  Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon,
  Assignment as ActionIcon, PlayArrow as ActivityIcon, Business as MinistryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import api from '../config/api';

interface Ministry { id: string; code: string; name: string; }
interface Activity { id: string; code: string; name: string; nameEn?: string; description?: string; isActive: boolean; }
interface Action { id: string; code: string; name: string; nameEn?: string; description?: string; isActive: boolean; activities: Activity[]; }
interface Objective { id: string; code: string; name: string; programId: string; }
interface Indicator { id: string; code: string; name: string; objectiveId?: string; }
interface Program {
  id: string; code: string; name: string; nameEn?: string; description?: string; objective?: string;
  isActive: boolean; ministryId: string; ministry?: Ministry; actions: Action[];
  objectives?: Objective[]; _count?: { objectives?: number; indicators?: number; };
}
interface NomenclatureItem { path: string; label: string; description: string; icon: React.ReactNode; color: string; }

const Nomenclatures: React.FC = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [viewDialog, setViewDialog] = useState<{ open: boolean; type: string; item: any }>({ open: false, type: '', item: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; item: any; loading: boolean; error: string | null; constraints: any }>({ open: false, type: '', item: null, loading: false, error: null, constraints: null });
  const [editDialog, setEditDialog] = useState<{ open: boolean; type: string; item: any; loading: boolean; error: string | null }>({ open: false, type: '', item: null, loading: false, error: null });
  const [editForm, setEditForm] = useState({ code: '', name: '', description: '', isActive: true });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/programmatic-structure/programs?isActive=true&include=actions.activities,ministry,objectives');
      if (response.data.status === 'success') {
        setPrograms(response.data.data.data || response.data.data || []);
      }
    } catch (err) {
      setError((err as Error).message || 'Erreur lors du chargement des programmes');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpanded(newExpanded);
  };

  const handleView = (type: string, item: any) => {
    setViewDialog({ open: true, type, item });
  };

  const handleEdit = (type: string, item: any) => {
    setEditForm({
      code: item.code || '',
      name: item.name || '',
      description: item.description || '',
      isActive: item.isActive !== false
    });
    setEditDialog({ open: true, type, item, loading: false, error: null });
  };

  const handleDelete = async (type: string, item: any) => {
    setDeleteDialog({ open: true, type, item, loading: false, error: null, constraints: null });

    // Check constraints for programs
    if (type === 'program') {
      try {
        // Fetch objectives count for this program
        const objectivesRes = await api.get(`/objectives?programId=${item.id}&limit=1`);
        const objectivesCount = objectivesRes.data.data?.pagination?.total || objectivesRes.data.data?.data?.length || 0;

        // Fetch indicators count (through objectives)
        let indicatorsCount = 0;
        if (objectivesCount > 0) {
          const indicatorsRes = await api.get(`/indicators?programId=${item.id}&limit=1`);
          indicatorsCount = indicatorsRes.data.data?.pagination?.total || indicatorsRes.data.data?.data?.length || 0;
        }

        setDeleteDialog(prev => ({
          ...prev,
          constraints: {
            actions: item.actions?.length || 0,
            objectives: objectivesCount,
            indicators: indicatorsCount
          }
        }));
      } catch (err) {
        // If API fails, use local data
        setDeleteDialog(prev => ({
          ...prev,
          constraints: {
            actions: item.actions?.length || 0,
            objectives: item.objectives?.length || item._count?.objectives || 0,
            indicators: item._count?.indicators || 0
          }
        }));
      }
    }
  };

  const getErrorMessage = (err: any, operation: string, type: string): string => {
    const typeName = type === 'program' ? 'programme' : type === 'action' ? 'action' : 'activite';

    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;

      if (status === 400 || status === 409 || status === 500) {
        const msg = data?.message?.toLowerCase() || '';
        if (msg.includes('constraint') || msg.includes('foreign') || msg.includes('reference') || msg.includes('violates')) {
          if (type === 'program') {
            return 'Impossible de supprimer ce programme car il est lie a des elements (actions, objectifs, indicateurs). Supprimez d\'abord ces elements.';
          } else if (type === 'action') {
            return 'Impossible de supprimer cette action car elle contient des activites ou est liee a des budgets. Supprimez d\'abord ces elements.';
          }
          return 'Impossible de supprimer: cet element est utilise ailleurs dans le systeme.';
        }
        return data?.message || `Erreur lors de la ${operation} du ${typeName}`;
      }

      if (status === 404) {
        return `${typeName.charAt(0).toUpperCase() + typeName.slice(1)} non trouve(e). Il a peut-etre deja ete supprime.`;
      }

      if (status === 403) {
        return `Vous n'avez pas les permissions necessaires pour ${operation === 'suppression' ? 'supprimer' : 'modifier'} ce ${typeName}.`;
      }

      return data?.message || `Erreur ${status} lors de la ${operation} du ${typeName}`;
    }

    if (err.message === 'Network Error') {
      return 'Erreur de connexion au serveur. Verifiez votre connexion internet.';
    }

    return err.message || `Erreur lors de la ${operation} du ${typeName}`;
  };

  const confirmEdit = async () => {
    const { type, item } = editDialog;
    setEditDialog(prev => ({ ...prev, loading: true, error: null }));

    try {
      const endpoint = type === 'program' ? `/programmatic-structure/programs/${item.id}`
        : type === 'action' ? `/programmatic-structure/actions/${item.id}`
        : `/programmatic-structure/activities/${item.id}`;

      await api.put(endpoint, editForm);
      const typeName = type === 'program' ? 'Programme' : type === 'action' ? 'Action' : 'Activite';
      setSnackbar({ open: true, message: `${typeName} modifie(e) avec succes`, severity: 'success' });
      setEditDialog({ open: false, type: '', item: null, loading: false, error: null });
      fetchPrograms();
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, 'modification', type);
      setEditDialog(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  };

  const confirmDelete = async () => {
    const { type, item } = deleteDialog;
    setDeleteDialog(prev => ({ ...prev, loading: true, error: null }));

    try {
      const endpoint = type === 'program' ? `/programmatic-structure/programs/${item.id}`
        : type === 'action' ? `/programmatic-structure/actions/${item.id}`
        : `/programmatic-structure/activities/${item.id}`;

      await api.delete(endpoint);
      const typeName = type === 'program' ? 'Programme' : type === 'action' ? 'Action' : 'Activite';
      setSnackbar({ open: true, message: `${typeName} supprime(e) avec succes`, severity: 'success' });
      setDeleteDialog({ open: false, type: '', item: null, loading: false, error: null, constraints: null });
      fetchPrograms();
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, 'suppression', type);
      setDeleteDialog(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  };

  const hasConstraints = (type: string, item: any, constraints: any): boolean => {
    if (type === 'program') {
      return (constraints?.actions > 0) || (constraints?.objectives > 0) || (constraints?.indicators > 0) || (item.actions?.length > 0);
    }
    if (type === 'action') {
      return item.activities?.length > 0;
    }
    return false;
  };

  const nomenclatures: NomenclatureItem[] = [
    { path: '/programs', label: 'Programmes', description: 'Structure programmatique des ministeres', icon: <ProgramIcon />, color: '#1976d2' },
    { path: '/objectives', label: 'Objectifs', description: 'Objectifs strategiques par programme', icon: <ObjectiveIcon />, color: '#2e7d32' },
    { path: '/indicators', label: 'Indicateurs', description: 'Indicateurs de performance', icon: <IndicatorIcon />, color: '#ed6c02' },
    { path: '/strategic-axes', label: 'Axes strategiques', description: 'Axes strategiques nationaux', icon: <CategoryIcon />, color: '#9c27b0' },
  ];

  const programsByMinistry = programs.reduce((acc, program) => {
    const ministryId = program.ministry?.id || 'unknown';
    const ministryName = program.ministry?.name || 'Sans ministere';
    if (!acc[ministryId]) {
      acc[ministryId] = { ministry: { id: ministryId, name: ministryName, code: program.ministry?.code || '' }, programs: [] };
    }
    acc[ministryId].programs.push(program);
    return acc;
  }, {} as Record<string, { ministry: { id: string; name: string; code: string }; programs: Program[] }>);

  const renderActionButtons = (type: string, item: any) => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Voir"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleView(type, item); }}><ViewIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Modifier"><IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleEdit(type, item); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(type, item); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
    </Box>
  );

  return (
    <Box>
      <PageHeader title="Nomenclatures" subtitle="Gestion des programmes, actions et activites" icon={<ListIcon />} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Nomenclatures disponibles</Typography>
              <List>
                {nomenclatures.map((item, index) => (
                  <React.Fragment key={item.path}>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => navigate(item.path)}>
                        <ListItemIcon sx={{ color: item.color }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={<Typography fontWeight={500}>{item.label}</Typography>} secondary={item.description} />
                        <ArrowIcon color="action" />
                      </ListItemButton>
                    </ListItem>
                    {index < nomenclatures.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2, bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Structure budgetaire</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Les nomenclatures definissent la structure hierarchique du budget:</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>Programme</strong> - Ensemble coherent d actions</Typography>
                <Typography variant="body2" sx={{ mb: 1, pl: 2 }}><strong>Action</strong> - Regroupement d activites</Typography>
                <Typography variant="body2" sx={{ pl: 4 }}><strong>Activite</strong> - Unite de base</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Arborescence Programmes / Actions / Activites</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/programs')}>Nouveau Programme</Button>
              </Box>

              {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>}
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              {!loading && !error && programs.length === 0 && (
                <Alert severity="info">Aucun programme trouve. Cliquez sur Nouveau Programme pour en creer un.</Alert>
              )}

              {!loading && !error && Object.values(programsByMinistry).map(({ ministry, programs: ministryPrograms }) => (
                <Paper key={ministry.id} variant="outlined" sx={{ mb: 2 }}>
                  <ListItemButton onClick={() => toggleExpand('m-' + ministry.id)} sx={{ bgcolor: 'grey.100' }}>
                    <ListItemIcon><MinistryIcon color="primary" /></ListItemIcon>
                    <ListItemText primary={<Typography fontWeight={600}>{ministry.name}</Typography>} secondary={ministry.code + ' - ' + ministryPrograms.length + ' programme(s)'} />
                    {expanded.has('m-' + ministry.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItemButton>

                  <Collapse in={expanded.has('m-' + ministry.id)}>
                    <List disablePadding>
                      {ministryPrograms.map((program) => (
                        <React.Fragment key={program.id}>
                          <ListItemButton onClick={() => toggleExpand('p-' + program.id)} sx={{ pl: 4 }}>
                            <ListItemIcon><ProgramIcon sx={{ color: '#1976d2' }} /></ListItemIcon>
                            <ListItemText primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography fontWeight={500}>{program.code} - {program.name}</Typography><Chip label={program.isActive ? 'Actif' : 'Inactif'} size="small" color={program.isActive ? 'success' : 'default'} /></Box>} secondary={(program.actions?.length || 0) + ' action(s)'} />
                            {renderActionButtons('program', program)}
                            {expanded.has('p-' + program.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </ListItemButton>

                          <Collapse in={expanded.has('p-' + program.id)}>
                            <List disablePadding>
                              {(program.actions || []).map((action) => (
                                <React.Fragment key={action.id}>
                                  <ListItemButton onClick={() => toggleExpand('a-' + action.id)} sx={{ pl: 8 }}>
                                    <ListItemIcon><ActionIcon sx={{ color: '#2e7d32' }} /></ListItemIcon>
                                    <ListItemText primary={<Typography>{action.code} - {action.name}</Typography>} secondary={(action.activities?.length || 0) + ' activite(s)'} />
                                    {renderActionButtons('action', action)}
                                    {expanded.has('a-' + action.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </ListItemButton>

                                  <Collapse in={expanded.has('a-' + action.id)}>
                                    <List disablePadding>
                                      {(action.activities || []).map((activity) => (
                                        <ListItem key={activity.id} sx={{ pl: 12 }}>
                                          <ListItemIcon><ActivityIcon sx={{ color: '#ed6c02' }} /></ListItemIcon>
                                          <ListItemText primary={activity.code + ' - ' + activity.name} secondary={activity.description || 'Aucune description'} />
                                          {renderActionButtons('activity', activity)}
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Collapse>
                                </React.Fragment>
                              ))}
                            </List>
                          </Collapse>
                        </React.Fragment>
                      ))}
                    </List>
                  </Collapse>
                </Paper>
              ))}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Statistiques</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}><Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}><Typography variant="h4" color="primary">{programs.length}</Typography><Typography variant="body2">Programmes</Typography></Paper></Grid>
                <Grid size={{ xs: 4 }}><Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}><Typography variant="h4" color="success.main">{programs.reduce((sum, p) => sum + (p.actions?.length || 0), 0)}</Typography><Typography variant="body2">Actions</Typography></Paper></Grid>
                <Grid size={{ xs: 4 }}><Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}><Typography variant="h4" color="warning.main">{programs.reduce((sum, p) => sum + (p.actions?.reduce((s, a) => s + (a.activities?.length || 0), 0) || 0), 0)}</Typography><Typography variant="body2">Activites</Typography></Paper></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* View Dialog */}
      <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false, type: '', item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Details - {viewDialog.type === 'program' ? 'Programme' : viewDialog.type === 'action' ? 'Action' : 'Activite'}</DialogTitle>
        <DialogContent dividers>
          {viewDialog.item && (
            <Box>
              <Typography><strong>Code:</strong> {viewDialog.item.code}</Typography>
              <Typography><strong>Nom:</strong> {viewDialog.item.name}</Typography>
              {viewDialog.item.nameEn && <Typography><strong>Nom (EN):</strong> {viewDialog.item.nameEn}</Typography>}
              {viewDialog.item.description && <Typography><strong>Description:</strong> {viewDialog.item.description}</Typography>}
              {viewDialog.item.objective && <Typography><strong>Objectif:</strong> {viewDialog.item.objective}</Typography>}
              <Typography><strong>Statut:</strong> {viewDialog.item.isActive ? 'Actif' : 'Inactif'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setViewDialog({ open: false, type: '', item: null })}>Fermer</Button></DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => !editDialog.loading && setEditDialog({ open: false, type: '', item: null, loading: false, error: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier - {editDialog.type === 'program' ? 'Programme' : editDialog.type === 'action' ? 'Action' : 'Activite'}</DialogTitle>
        <DialogContent>
          {editDialog.error && (
            <Alert severity="error" sx={{ mb: 2 }} icon={<WarningIcon />}>
              {editDialog.error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Code" value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} fullWidth disabled={editDialog.loading} />
            <TextField label="Nom" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} fullWidth disabled={editDialog.loading} />
            <TextField label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} fullWidth multiline rows={3} disabled={editDialog.loading} />
            <FormControlLabel control={<Checkbox checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} disabled={editDialog.loading} />} label="Actif" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, type: '', item: null, loading: false, error: null })} disabled={editDialog.loading}>Annuler</Button>
          <Button onClick={confirmEdit} variant="contained" disabled={editDialog.loading}>{editDialog.loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, type: '', item: null, loading: false, error: null, constraints: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <WarningIcon color="error" />
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          {deleteDialog.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteDialog.error}
            </Alert>
          )}
          <Typography sx={{ mb: 2 }}>
            Etes-vous sur de vouloir supprimer {deleteDialog.type === 'program' ? 'le programme' : deleteDialog.type === 'action' ? "l'action" : "l'activite"} <strong>{deleteDialog.item?.name}</strong> ?
          </Typography>

          {/* Constraints warnings for programs */}
          {deleteDialog.type === 'program' && hasConstraints('program', deleteDialog.item, deleteDialog.constraints) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Suppression impossible - Elements lies:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {(deleteDialog.constraints?.actions > 0 || deleteDialog.item?.actions?.length > 0) && (
                  <li><Typography variant="body2">
                    <strong>{deleteDialog.constraints?.actions || deleteDialog.item?.actions?.length} Action(s)</strong> - Supprimez d'abord les actions
                  </Typography></li>
                )}
                {deleteDialog.constraints?.objectives > 0 && (
                  <li><Typography variant="body2">
                    <strong>{deleteDialog.constraints.objectives} Objectif(s)</strong> - Supprimez d'abord les objectifs dans le menu Objectifs
                  </Typography></li>
                )}
                {deleteDialog.constraints?.indicators > 0 && (
                  <li><Typography variant="body2">
                    <strong>{deleteDialog.constraints.indicators} Indicateur(s)</strong> - Supprimez d'abord les indicateurs dans le menu Indicateurs
                  </Typography></li>
                )}
              </Box>
            </Alert>
          )}

          {/* Constraints warnings for actions */}
          {deleteDialog.type === 'action' && deleteDialog.item?.activities?.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                Suppression impossible - Elements lies:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <li><Typography variant="body2">
                  <strong>{deleteDialog.item.activities.length} Activite(s)</strong> - Supprimez d'abord les activites
                </Typography></li>
              </Box>
            </Alert>
          )}

          {/* Info for items without constraints */}
          {!hasConstraints(deleteDialog.type, deleteDialog.item, deleteDialog.constraints) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Cette action est irreversible. L'element sera definitivement supprime.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, type: '', item: null, loading: false, error: null, constraints: null })} disabled={deleteDialog.loading}>
            Annuler
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteDialog.loading || hasConstraints(deleteDialog.type, deleteDialog.item, deleteDialog.constraints)}
          >
            {deleteDialog.loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Nomenclatures;
