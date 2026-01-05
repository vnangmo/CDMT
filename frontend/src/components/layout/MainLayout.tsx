import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSelector from '../LanguageSelector';
import NotificationCenter from '../NotificationCenter';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Source as SourceIcon,
  CalendarToday as CalendarIcon,
  ShowChart as ChartIcon,
  Description as DocumentIcon,
  Timeline as TimelineIcon,
  Equalizer as EqualizerIcon,
  CheckCircle as CheckIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  GridOn as GridIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import './MainLayout.css';

const drawerWidth = 240;

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: 'Tableau de Bord', icon: <DashboardIcon />, section: 'main' },

    // Module 1: Gestion du Cadre Macroéconomique et CBMT
    { path: '/macro/frameworks', label: 'Hypothèses Macro', icon: <ChartIcon />, section: 'module1' },
    { path: '/macro/tofe/:id', label: 'TOFE Prévisionnel', icon: <TimelineIcon />, section: 'module1' },
    { path: '/macro/cbmt', label: 'CBMT', icon: <DocumentIcon />, section: 'module1' },

    // Module 2: Élaboration du CDMT Global
    { path: '/trend-budgets', label: 'Budgets Tendanciels', icon: <EqualizerIcon />, section: 'module2' },
    { path: '/cdmt-global', label: 'CDMT Global', icon: <TimelineIcon />, section: 'module2' },
    { path: '/ministerial-ceilings', label: 'Plafonds Ministériels', icon: <MoneyIcon />, section: 'module2' },

    // Module 3: Élaboration des CDMT Sectoriels
    { path: '/programs', label: 'Structure Programmatique', icon: <AssignmentIcon />, section: 'module3' },
    { path: '/action-plans', label: 'Plans d\'Action', icon: <AssignmentIcon />, section: 'module3' },
    { path: '/sectoral-measures', label: 'Mesures Nouvelles', icon: <CheckIcon />, section: 'module3' },

    // Module 4: Gestion des Référentiels
    { path: '/ministries', label: 'Ministères', icon: <BusinessIcon />, section: 'module4' },
    { path: '/strategic-axes', label: 'Axes Stratégiques', icon: <TrendingUpIcon />, section: 'module4' },
    { path: '/economic-natures', label: 'Natures Économiques', icon: <MoneyIcon />, section: 'module4' },
    { path: '/funding-sources', label: 'Sources Financement', icon: <SourceIcon />, section: 'module4' },
    { path: '/fiscal-years', label: 'Années Fiscales', icon: <CalendarIcon />, section: 'module4' },

    // Module 5: Workflow et Validation
    { path: '/sectoral-validation', label: 'Circuit de Validation', icon: <CheckIcon />, section: 'module5' },
    { path: '/roles', label: 'Rôles & Permissions', icon: <SecurityIcon />, section: 'module5' },
    { path: '/access-matrix', label: 'Matrice des Droits', icon: <GridIcon />, section: 'module5' },

    // Module 6: Reporting et Tableaux de Bord
    { path: '/reports', label: 'Rapports', icon: <DocumentIcon />, section: 'module6' },
    { path: '/analytics', label: 'Tableaux de Bord', icon: <EqualizerIcon />, section: 'module6' },
    { path: '/users', label: 'Utilisateurs', icon: <PeopleIcon />, section: 'module6' },
  ];

  const sections = [
    { key: 'main', label: '' },
    { key: 'module1', label: 'CADRE MACRO & CBMT' },
    { key: 'module2', label: 'CDMT GLOBAL' },
    { key: 'module3', label: 'CDMT SECTORIELS' },
    { key: 'module4', label: 'RÉFÉRENTIELS' },
    { key: 'module5', label: 'WORKFLOW & VALIDATION' },
    { key: 'module6', label: 'REPORTING' },
  ];

  const renderMenuItems = () => {
    return sections.map((section) => {
      const items = menuItems.filter((item) => item.section === section.key);
      if (items.length === 0) return null;

      return (
        <React.Fragment key={section.key}>
          {section.label && (
            <ListItem sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  px: 2,
                }}
              >
                {section.label}
              </Typography>
            </ListItem>
          )}
          {items.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <ListItem key={item.path} disablePadding sx={{ px: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isActive}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? 'white' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </React.Fragment>
      );
    });
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
            bgcolor: 'white',
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
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              C
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            CDMT
          </Typography>
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
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                bgcolor: '#f5f5f5',
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
        </Box>

        {/* Menu Items */}
        <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
          {renderMenuItems()}
        </List>
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
              CDMT Djibouti
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                  <ListItemIcon>
                    <PeopleIcon fontSize="small" />
                  </ListItemIcon>
                  Mon Profil
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); navigate('/user-settings'); }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Paramètres Utilisateur
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                  <ListItemIcon>
                    <SecurityIcon fontSize="small" />
                  </ListItemIcon>
                  Paramètres Admin
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Déconnexion
                </MenuItem>
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
