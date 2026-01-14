import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../LanguageSelector';
import NotificationCenter from '../NotificationCenter';
import FiscalYearBadge from '../FiscalYearBadge';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem as MuiMenuItem,
  TextField,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as AccountBalanceIcon,
  CalendarToday as CalendarIcon,
  ShowChart as ChartIcon,
  Description as DocumentIcon,
  Timeline as TimelineIcon,
  Equalizer as EqualizerIcon,
  CheckCircle as CheckIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Public as MacroIcon,
  
  ListAlt as ListIcon,
  History as HistoryIcon,
  Comment as CommentIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Download as DownloadIcon,
  Category as CategoryIcon,
  Folder as FolderIcon,
  Calculate as CalculateIcon,
  Tune as TuneIcon,
  Assessment as AssessmentIcon,
  Help as HelpIcon,
  MenuBook as DocumentIcon2,
  VideoLibrary as VideoIcon,
  QuestionAnswer as FaqIcon,
} from '@mui/icons-material';
import './MainLayout.css';

const drawerWidth = 280;

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarModule {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  items: SidebarItem[];
}

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    macro: true,
    cbmt: false,
    cdmtGlobal: false,
    cdmtSectoral: false,
    referentiels: false,
    workflow: false,
    reporting: false,
    admin: false,
    help: false,
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleModuleToggle = (moduleKey: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  // Structure des modules avec sous-menus
  const modules: SidebarModule[] = [
    {
      key: 'macro',
      label: 'Cadre Macroeconomique',
      icon: <MacroIcon />,
      color: '#1976d2',
      items: [
        { path: '/macro/frameworks', label: 'Hypotheses & Indicateurs', icon: <ChartIcon fontSize="small" /> },
        { path: '/macro/projections', label: 'Projections macro', icon: <TrendingUpIcon fontSize="small" /> },
        { path: '/macro/tofe', label: 'TOFE previsionnel', icon: <DocumentIcon fontSize="small" /> },
      ],
    },
    {
      key: 'cbmt',
      label: 'CBMT',
      icon: <AccountBalanceIcon />,
      color: '#0d47a1',
      items: [
        { path: '/cbmt', label: 'Elaboration CBMT', icon: <AccountBalanceIcon fontSize="small" /> },
        { path: '/cbmt/aggregates', label: 'Agregats par nature', icon: <CalculateIcon fontSize="small" /> },
        { path: '/cbmt/tables', label: 'Tableaux CBMT', icon: <DocumentIcon fontSize="small" /> },
      ],
    },
    {
      key: 'cdmtGlobal',
      label: 'CDMT Global',
      icon: <TimelineIcon />,
      color: '#2e7d32',
      items: [
        { path: '/cdmt-global', label: 'Scenarios CDMT', icon: <TimelineIcon fontSize="small" /> },
        { path: '/cdmt-global/policy-measures', label: 'Mesures nouvelles centrales', icon: <TuneIcon fontSize="small" /> },
        { path: '/cdmt-global/fiscal-margin', label: 'Marge de manoeuvre', icon: <EqualizerIcon fontSize="small" /> },
        { path: '/cdmt-global/fiscal-margins', label: 'Parametrage marges', icon: <TuneIcon fontSize="small" /> },
        { path: '/cdmt-global/intersectoral', label: 'Repartition intersectorielle', icon: <PieChartIcon fontSize="small" /> },
        { path: '/ministerial-ceilings', label: 'Plafonds ministeriels', icon: <MoneyIcon fontSize="small" /> },
      ],
    },
    {
      key: 'cdmtSectoral',
      label: 'CDMT Sectoriels',
      icon: <AssignmentIcon />,
      color: '#ed6c02',
      items: [
        { path: '/sectoral/trends', label: 'Tendanciels sectoriels', icon: <TrendingUpIcon fontSize="small" /> },
        { path: '/sectoral/trends-detailed', label: 'Tendanciels detailles', icon: <TrendingUpIcon fontSize="small" /> },
        { path: '/sectoral-measures', label: 'Mesures nouvelles', icon: <CheckIcon fontSize="small" /> },
        { path: '/projects', label: 'Projets PIE/PIP', icon: <FolderIcon fontSize="small" /> },
        { path: '/action-plans', label: 'Plans d action sectoriels', icon: <ListIcon fontSize="small" /> },
        { path: '/cdsmt-synthesis', label: 'Synthese CDMT', icon: <AssessmentIcon fontSize="small" /> },
      ],
    },
    {
      key: 'referentiels',
      label: 'Referentiels',
      icon: <CategoryIcon />,
      color: '#9c27b0',
      items: [
        { path: '/nomenclatures', label: 'Nomenclatures', icon: <ListIcon fontSize="small" /> },
        { path: '/ministries', label: 'Ministeres et institutions', icon: <BusinessIcon fontSize="small" /> },
        { path: '/economic-natures', label: 'Nature des depenses', icon: <MoneyIcon fontSize="small" /> },
        { path: '/funding-sources', label: 'Sources de financement', icon: <AccountBalanceIcon fontSize="small" /> },
        { path: '/fiscal-years', label: 'Annees fiscales', icon: <CalendarIcon fontSize="small" /> },
        { path: '/historical-data', label: 'Donnees historiques', icon: <HistoryIcon fontSize="small" /> },
        { path: '/import-templates', label: "Modeles d'import", icon: <DownloadIcon fontSize="small" /> },
      ],
    },
    {
      key: 'workflow',
      label: 'Workflow & Validation',
      icon: <CheckIcon />,
      color: '#0288d1',
      items: [
        { path: '/workflow/validation', label: 'Circuit de validation', icon: <CheckIcon fontSize="small" /> },
        { path: '/workflow/versions', label: 'Historique des versions', icon: <HistoryIcon fontSize="small" /> },
        { path: '/workflow/comments', label: 'Commentaires', icon: <CommentIcon fontSize="small" /> },
        { path: '/workflow/settings', label: 'Configuration workflow', icon: <SettingsIcon fontSize="small" /> },
      ],
    },
    {
      key: 'reporting',
      label: 'Reporting',
      icon: <BarChartIcon />,
      color: '#d32f2f',
      items: [
        { path: '/analytics', label: 'Tableaux de bord', icon: <EqualizerIcon fontSize="small" /> },
        { path: '/reports', label: 'Rapports reglementaires', icon: <DocumentIcon fontSize="small" /> },
        { path: '/exports', label: 'Exports personnalises', icon: <DownloadIcon fontSize="small" /> },
        { path: '/visualizations', label: 'Visualisations', icon: <PieChartIcon fontSize="small" /> },
      ],
    },
    {
      key: 'admin',
      label: 'Administration',
      icon: <SettingsIcon />,
      color: '#424242',
      items: [
        { path: '/users', label: 'Utilisateurs', icon: <PeopleIcon fontSize="small" /> },
        { path: '/roles', label: 'Roles et permissions', icon: <SecurityIcon fontSize="small" /> },
      ],
    },
    {
      key: 'help',
      label: 'Aide & Support',
      icon: <HelpIcon />,
      color: '#00897b',
      items: [
        { path: '/help', label: 'Centre d aide', icon: <HelpIcon fontSize="small" /> },
        { path: '/help/documentation', label: 'Documentation', icon: <DocumentIcon2 fontSize="small" /> },
        { path: '/help/videos', label: 'Tutoriels video', icon: <VideoIcon fontSize="small" /> },
        { path: '/help/faq', label: 'FAQ', icon: <FaqIcon fontSize="small" /> },
        { path: '/help/glossary', label: 'Glossaire', icon: <DocumentIcon2 fontSize="small" /> },
        { path: '/help/shortcuts', label: 'Raccourcis clavier', icon: <HelpIcon fontSize="small" /> },
        { path: '/help/roles', label: 'Guide par role', icon: <PeopleIcon fontSize="small" /> },
      ],
    },
  ];

  // Vérifier si un sous-menu est actif
  const isSubMenuActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Vérifier si un module contient un item actif
  const isModuleActive = (items: SidebarItem[]) => {
    return items.some((item) => isSubMenuActive(item.path));
  };

  // Filtrer les items selon la recherche
  const filterItems = (items: SidebarItem[]) => {
    if (!searchQuery) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fafafa' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #e0e0e0',
            bgcolor: '#1a1a2e',
          },
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              C
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              CDMT
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Djibouti
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.05)',
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255,255,255,0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255,255,255,0.5)',
              },
            }}
          />
        </Box>

        {/* Dashboard Link */}
        <List sx={{ px: 1.5 }}>
          <ListItemButton
            onClick={() => navigate('/dashboard')}
            selected={location.pathname === '/dashboard'}
            sx={{
              borderRadius: 2,
              mb: 1,
              color: 'rgba(255,255,255,0.8)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
              },
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary="Tableau de Bord"
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItemButton>
        </List>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2, my: 1 }} />

        {/* Modules avec sous-menus */}
        <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 0 }}>
          {modules.map((module) => {
            const filteredItems = filterItems(module.items);
            const moduleActive = isModuleActive(module.items);
            const isOpen = openModules[module.key] || (searchQuery.length > 0 && filteredItems.length > 0);

            if (searchQuery && filteredItems.length === 0) return null;

            return (
              <React.Fragment key={module.key}>
                {/* Header du module */}
                <ListItemButton
                  onClick={() => handleModuleToggle(module.key)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    py: 1,
                    color: moduleActive ? 'white' : 'rgba(255,255,255,0.7)',
                    bgcolor: moduleActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: module.color,
                      minWidth: 40,
                    }}
                  >
                    {module.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={module.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: moduleActive ? 600 : 500,
                    }}
                  />
                  {isOpen ? (
                    <ExpandLess sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  ) : (
                    <ExpandMore sx={{ color: 'rgba(255,255,255,0.5)' }} />
                  )}
                </ListItemButton>

                {/* Sous-menus */}
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 2 }}>
                    {filteredItems.map((item) => {
                      const isActive = isSubMenuActive(item.path);
                      return (
                        <ListItemButton
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          sx={{
                            borderRadius: 1.5,
                            mb: 0.25,
                            py: 0.75,
                            pl: 2,
                            color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                            bgcolor: isActive ? module.color : 'transparent',
                            borderLeft: isActive ? 'none' : '2px solid transparent',
                            '&:hover': {
                              bgcolor: isActive ? module.color : 'rgba(255,255,255,0.05)',
                              borderLeft: isActive ? 'none' : `2px solid ${module.color}`,
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                              minWidth: 32,
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontSize: '0.8rem',
                              fontWeight: isActive ? 500 : 400,
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>

        {/* User info at bottom */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              fontSize: '0.875rem',
            }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: 'white', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
            >
              {user?.role?.name}
            </Typography>
          </Box>
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: 'white',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary', fontWeight: 600 }}>
              CDMT - Republique de Djibouti
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FiscalYearBadge />

              <NotificationCenter />

              <IconButton onClick={() => navigate('/settings')}>
                <SettingsIcon />
              </IconButton>

              <LanguageSelector />

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                }}
                onClick={handleMenuOpen}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: 'primary.main',
                    fontSize: '0.875rem',
                  }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {user?.role?.name}
                  </Typography>
                </Box>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MuiMenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                  <ListItemIcon>
                    <PeopleIcon fontSize="small" />
                  </ListItemIcon>
                  Mon Profil
                </MuiMenuItem>
                <MuiMenuItem onClick={() => { handleMenuClose(); navigate('/user-settings'); }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Parametres Utilisateur
                </MuiMenuItem>
                <Divider />
                <MuiMenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                  <ListItemIcon>
                    <SecurityIcon fontSize="small" />
                  </ListItemIcon>
                  Parametres Admin
                </MuiMenuItem>
                <Divider />
                <MuiMenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Deconnexion
                </MuiMenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            overflow: 'auto',
            bgcolor: '#fafafa',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
