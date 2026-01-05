import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment as AssessmentIcon,
  AccountBalance as AccountBalanceIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

const Analytics: React.FC = () => {
  const [fiscalYear, setFiscalYear] = useState('2024');
  const [ministry, setMinistry] = useState('all');

  const kpis = [
    {
      title: 'Taux d\'Exécution Budgétaire',
      value: 78.5,
      target: 85,
      change: 5.2,
      icon: <MoneyIcon sx={{ fontSize: 28 }} />,
      color: '#2563eb',
      bgColor: '#dbeafe',
    },
    {
      title: 'Mesures Validées',
      value: 142,
      total: 180,
      change: 12,
      icon: <CheckIcon sx={{ fontSize: 28 }} />,
      color: '#16a34a',
      bgColor: '#dcfce7',
    },
    {
      title: 'En Attente de Validation',
      value: 28,
      change: -5,
      icon: <ScheduleIcon sx={{ fontSize: 28 }} />,
      color: '#f59e0b',
      bgColor: '#fef3c7',
    },
    {
      title: 'Conformité CDMT',
      value: 92,
      target: 95,
      change: 3,
      icon: <AssessmentIcon sx={{ fontSize: 28 }} />,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
    },
  ];

  const budgetAnalysis = [
    {
      ministry: 'Ministère de la Santé',
      allocated: 45000000,
      executed: 38000000,
      rate: 84.4,
      trend: 'up',
    },
    {
      ministry: 'Ministère de l\'Éducation',
      allocated: 52000000,
      executed: 42000000,
      rate: 80.8,
      trend: 'up',
    },
    {
      ministry: 'Ministère des Infrastructures',
      allocated: 38000000,
      executed: 28000000,
      rate: 73.7,
      trend: 'down',
    },
    {
      ministry: 'Ministère de l\'Agriculture',
      allocated: 22000000,
      executed: 19000000,
      rate: 86.4,
      trend: 'up',
    },
  ];

  const sectoralProgress = [
    { sector: 'Santé', progress: 85, status: 'on-track' },
    { sector: 'Éducation', progress: 78, status: 'on-track' },
    { sector: 'Infrastructures', progress: 65, status: 'at-risk' },
    { sector: 'Agriculture', progress: 92, status: 'ahead' },
    { sector: 'Sécurité', progress: 70, status: 'on-track' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DJ', {
      style: 'currency',
      currency: 'DJF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'ahead':
        return '#16a34a';
      case 'on-track':
        return '#2563eb';
      case 'at-risk':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ahead':
        return 'En avance';
      case 'on-track':
        return 'Dans les temps';
      case 'at-risk':
        return 'À risque';
      default:
        return status;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Tableaux de Bord
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Analyses et indicateurs de performance CDMT
        </Typography>
      </Box>

      {/* Filters */}
      <Card elevation={0} sx={{ border: '1px solid #e5e7eb', mb: 4 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              select
              label="Année Fiscale"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="2024">2024</MenuItem>
              <MenuItem value="2023">2023</MenuItem>
              <MenuItem value="2022">2022</MenuItem>
            </TextField>

            <TextField
              select
              label="Ministère"
              value={ministry}
              onChange={(e) => setMinistry(e.target.value)}
              size="small"
              sx={{ minWidth: 300 }}
            >
              <MenuItem value="all">Tous les ministères</MenuItem>
              <MenuItem value="health">Ministère de la Santé</MenuItem>
              <MenuItem value="education">Ministère de l'Éducation</MenuItem>
              <MenuItem value="infrastructure">Ministère des Infrastructures</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* KPI Cards */}
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
        {kpis.map((kpi, index) => (
          <Card
            key={index}
            elevation={0}
            sx={{
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {kpi.title}
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {kpi.value}{typeof kpi.value === 'number' && kpi.value < 100 ? '%' : ''}
                  </Typography>
                  {kpi.total && (
                    <Typography variant="caption" color="text.secondary">
                      sur {kpi.total}
                    </Typography>
                  )}
                  {kpi.target && (
                    <Typography variant="caption" color="text.secondary">
                      Objectif: {kpi.target}%
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    bgcolor: kpi.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {React.cloneElement(kpi.icon, { sx: { color: kpi.color } })}
                </Box>
              </Box>

              {kpi.change !== undefined && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  {kpi.change > 0 ? (
                    <TrendingUp sx={{ fontSize: 16, color: '#16a34a' }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: '#dc2626' }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: kpi.change > 0 ? '#16a34a' : '#dc2626',
                      fontWeight: 600,
                    }}
                  >
                    {Math.abs(kpi.change)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    vs période précédente
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
            md: 'repeat(2, 1fr)',
          },
          gap: 3,
        }}
      >
        {/* Budget Execution Analysis */}
        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Analyse d'Exécution Budgétaire
            </Typography>
            <Divider sx={{ my: 2 }} />

            {budgetAnalysis.map((item, index) => (
              <Box key={index} mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {item.ministry}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(item.executed)} / {formatCurrency(item.allocated)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {item.trend === 'up' ? (
                      <TrendingUp sx={{ fontSize: 16, color: '#16a34a' }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 16, color: '#dc2626' }} />
                    )}
                    <Typography variant="body2" fontWeight={600}>
                      {item.rate}%
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.rate}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: item.trend === 'up' ? '#16a34a' : '#f59e0b',
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Sectoral Progress */}
        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Progression Sectorielle
            </Typography>
            <Divider sx={{ my: 2 }} />

            {sectoralProgress.map((item, index) => (
              <Box key={index} mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" fontWeight={500}>
                    {item.sector}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={getStatusLabel(item.status)}
                      size="small"
                      sx={{
                        bgcolor: `${getProgressColor(item.status)}20`,
                        color: getProgressColor(item.status),
                        fontWeight: 600,
                      }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {item.progress}%
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.progress}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getProgressColor(item.status),
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Analytics;
