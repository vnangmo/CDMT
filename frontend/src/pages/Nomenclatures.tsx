import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Divider, IconButton, Collapse, Tooltip, Chip,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Alert, Paper,
} from '@mui/material';
import {
  ListAlt as ListIcon, AccountTree as ProgramIcon, Flag as ObjectiveIcon,
  Speed as IndicatorIcon, Category as CategoryIcon, ArrowForward as ArrowIcon,
  ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
  Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon,
  Assignment as ActionIcon, PlayArrow as ActivityIcon, Business as MinistryIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import api from '../config/api';

interface Ministry { id: string; code: string; name: string; }
interface Activity { id: string; code: string; name: string; nameEn?: string; description?: string; isActive: boolean; }
interface Action { id: string; code: string; name: string; nameEn?: string; description?: string; isActive: boolean; activities: Activity[]; }
interface Program { id: string; code: string; name: string; nameEn?: string; description?: string; objective?: string; isActive: boolean; ministryId: string; ministry?: Ministry; actions: Action[]; }
interface NomenclatureItem { path: string; label: string; description: string; icon: React.ReactNode; color: string; }

const Nomenclatures: React.FC = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [viewDialog, setViewDialog] = useState<{ open: boolean; type: string; item: any }>({ open: false, type: '', item: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; item: any }>({ open: false, type: '', item: null });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/programmatic-structure/programs?include=actions.activities,ministry');
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

  const handleDelete = (type: string, item: any) => {
    setDeleteDialog({ open: true, type, item });
  };

  const confirmDelete = async () => {
    setDeleteDialog({ open: false, type: '', item: null });
    fetchPrograms();
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
      <Tooltip title="Modifier"><IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); navigate('/edit-' + type + '/' + item.id); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
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
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/programs/new')}>Nouveau Programme</Button>
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

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, type: '', item: null })}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Etes-vous sur de vouloir supprimer {deleteDialog.type === 'program' ? 'le programme' : deleteDialog.type === 'action' ? "l'action" : "l'activite"} {deleteDialog.item?.name} ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, type: '', item: null })}>Annuler</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Nomenclatures;
