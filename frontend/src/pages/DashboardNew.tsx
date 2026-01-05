import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assignment,
  CheckCircle,
  Schedule,
  Warning,
  People,
  Business,
  AttachMoney,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info';
  icon: React.ReactNode;
}

const DashboardNew: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Sample statistics
  const stats: StatCard[] = [
    {
      title: 'Mesures Sectorielles',
      value: 142,
      change: 12,
      changeLabel: 'vs mois dernier',
      icon: <Assignment sx={{ fontSize: 28 }} />,
      color: '#2563eb',
      bgColor: '#dbeafe',
    },
    {
      title: 'En Cours de Validation',
      value: 28,
      change: -5,
      changeLabel: 'vs mois dernier',
      icon: <Schedule sx={{ fontSize: 28 }} />,
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
    {
      title: 'Validées',
      value: 95,
      change: 18,
      changeLabel: 'vs mois dernier',
      icon: <CheckCircle sx={{ fontSize: 28 }} />,
      color: '#16a34a',
      bgColor: '#dcfce7',
    },
    {
      title: 'Budget Total',
      value: '45.2M DJF',
      change: 8.5,
      changeLabel: 'vs année dernière',
      icon: <AttachMoney sx={{ fontSize: 28 }} />,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
    },
  ];

  // Sample recent activities
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      title: 'Nouvelle mesure créée',
      description: 'Mesure MS-2024-001 créée par Ahmed Mohamed',
      timestamp: 'Il y a 2 heures',
      type: 'info',
      icon: <Assignment />,
    },
    {
      id: '2',
      title: 'Validation approuvée',
      description: 'Plan d\'action PA-2024-015 validé',
      timestamp: 'Il y a 4 heures',
      type: 'success',
      icon: <CheckCircle />,
    },
    {
      id: '3',
      title: 'Attention requise',
      description: 'Document CBMT-2024-003 en attente de révision',
      timestamp: 'Il y a 1 jour',
      type: 'warning',
      icon: <Warning />,
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#16a34a';
      case 'warning':
        return '#f59e0b';
      default:
        return '#2563eb';
    }
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Bienvenue, {user?.firstName} !
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Voici un aperçu de vos activités CDMT
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {stats.map((stat, index) => (
          <Card
            key={index}
              elevation={0}
              sx={{
                height: '100%',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: stat.bgColor,
                      color: stat.color,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Box>

                {stat.change !== undefined && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {stat.change > 0 ? (
                      <TrendingUp sx={{ fontSize: 16, color: '#16a34a' }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 16, color: '#dc2626' }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: stat.change > 0 ? '#16a34a' : '#dc2626',
                        fontWeight: 600,
                      }}
                    >
                      {Math.abs(stat.change)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.changeLabel}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '2fr 1fr',
          },
          gap: 3,
        }}
      >
        {/* Recent Activities */}
        <Box>
          <Card elevation={0} sx={{ border: '1px solid #e5e7eb', height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Activités Récentes
                </Typography>
                <Chip label="Aujourd'hui" size="small" color="primary" variant="outlined" />
              </Box>

              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: `${getActivityColor(activity.type)}20`,
                            color: getActivityColor(activity.type),
                          }}
                        >
                          {activity.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {activity.title}
                          </Typography>
                        }
                        secondary={
                          <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                              {activity.description}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {activity.timestamp}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Quick Stats */}
        <Box>
          <Card elevation={0} sx={{ border: '1px solid #e5e7eb', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Progression Mensuelle
              </Typography>

              <Box mt={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Objectif
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    75%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={75}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#16a34a',
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>

              <Box mt={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Documents traités
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    142/200
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={71}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#2563eb',
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Accès Rapides
              </Typography>

              <Box display="flex" flexDirection="column" gap={1.5} mt={2}>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#f9fafb',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f3f4f6' },
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Nouvelle Mesure Sectorielle
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#f9fafb',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f3f4f6' },
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Documents en attente
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#f9fafb',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f3f4f6' },
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Rapports
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardNew;
