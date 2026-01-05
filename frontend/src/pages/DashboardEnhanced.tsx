import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Grid,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Badge,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assignment,
  CheckCircle,
  Schedule,
  Warning,
  AttachMoney,
  Refresh,
  ErrorOutline,
  Info,
  NotificationsActive,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import DashboardService, {
  DashboardData,
  DashboardAlert,
} from '../services/dashboard.service';

// Color palette
const COLORS = {
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#0891b2',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#6b7280',
};

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6'];

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color,
  bgColor,
  loading,
}) => (
  <Card
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
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={100}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {value}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: bgColor, color: color, width: 48, height: 48 }}>
              {icon}
            </Avatar>
          </Box>

          {change !== undefined && (
            <Box display="flex" alignItems="center" gap={0.5}>
              {change > 0 ? (
                <TrendingUp sx={{ fontSize: 16, color: COLORS.success }} />
              ) : change < 0 ? (
                <TrendingDown sx={{ fontSize: 16, color: COLORS.danger }} />
              ) : null}
              <Typography
                variant="caption"
                sx={{
                  color: change > 0 ? COLORS.success : change < 0 ? COLORS.danger : COLORS.gray,
                  fontWeight: 600,
                }}
              >
                {change > 0 ? '+' : ''}{change}
              </Typography>
              {changeLabel && (
                <Typography variant="caption" color="text.secondary">
                  {changeLabel}
                </Typography>
              )}
            </Box>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

const DashboardEnhanced: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fiscalYear, setFiscalYear] = useState<number>(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [dashboard, alertsData] = await Promise.all([
        DashboardService.getDashboard(fiscalYear),
        DashboardService.getAlerts({ fiscalYear }),
      ]);
      setDashboardData(dashboard);
      setAlerts(alertsData.alerts);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du tableau de bord');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fiscalYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setFiscalYear(event.target.value as number);
    setLoading(true);
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} Mrd`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)} K`;
    }
    return amount.toFixed(0);
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Assignment />;
      case 'APPROVE':
      case 'VALIDATE':
        return <CheckCircle />;
      case 'SUBMIT':
        return <Schedule />;
      case 'REJECT':
        return <ErrorOutline />;
      default:
        return <Info />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'APPROVE':
      case 'VALIDATE':
        return COLORS.success;
      case 'REJECT':
        return COLORS.danger;
      case 'SUBMIT':
        return COLORS.warning;
      default:
        return COLORS.primary;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return COLORS.danger;
      case 'HIGH':
        return COLORS.warning;
      case 'MEDIUM':
        return COLORS.info;
      default:
        return COLORS.gray;
    }
  };

  // Prepare chart data
  const statusChartData = dashboardData
    ? Object.entries(dashboardData.stats.sectoralMeasures.byStatus).map(([status, count]) => ({
        name: status,
        value: count,
      }))
    : [];

  const trendChartData = dashboardData?.trends || [];

  const ministryChartData = dashboardData?.stats.budget.byMinistry.slice(0, 8).map((m) => ({
    name: m.ministryName.length > 15 ? m.ministryName.substring(0, 15) + '...' : m.ministryName,
    allocated: m.allocated / 1000000,
    executed: m.executed / 1000000,
    rate: m.rate,
  })) || [];

  const alertsChartData = dashboardData
    ? Object.entries(dashboardData.alerts.bySeverity).map(([severity, count]) => ({
        name: severity,
        value: count,
        color: getSeverityColor(severity),
      }))
    : [];

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <AlertTitle>Erreur</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Bienvenue, {user?.firstName} !
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tableau de bord CDMT - Vue d'ensemble
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Année</InputLabel>
            <Select value={fiscalYear} onChange={handleYearChange} label="Année">
              {[2024, 2025, 2026, 2027].map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Actualiser">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <CircularProgress size={24} /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Critical Alerts Banner */}
      {dashboardData && dashboardData.alerts.criticalCount > 0 && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<NotificationsActive />}>
          <AlertTitle>Alertes critiques</AlertTitle>
          {dashboardData.alerts.criticalCount} alerte(s) critique(s) nécessitent votre attention immédiate.
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Mesures Sectorielles"
            value={dashboardData?.stats.sectoralMeasures.total || 0}
            change={dashboardData?.stats.sectoralMeasures.changeFromLastMonth}
            changeLabel="vs mois dernier"
            icon={<Assignment sx={{ fontSize: 28 }} />}
            color={COLORS.primary}
            bgColor="#dbeafe"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="En Attente de Validation"
            value={dashboardData?.stats.pendingValidations.total || 0}
            icon={<Schedule sx={{ fontSize: 28 }} />}
            color={COLORS.warning}
            bgColor="#fef3c7"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Plans d'Action"
            value={dashboardData?.stats.actionPlans.total || 0}
            change={dashboardData?.stats.actionPlans.changeFromLastMonth}
            changeLabel="vs mois dernier"
            icon={<CheckCircle sx={{ fontSize: 28 }} />}
            color={COLORS.success}
            bgColor="#dcfce7"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Budget Total"
            value={dashboardData ? `${formatAmount(dashboardData.stats.budget.totalAllocated)} DJF` : '0'}
            icon={<AttachMoney sx={{ fontSize: 28 }} />}
            color={COLORS.purple}
            bgColor="#ede9fe"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} mb={4}>
        {/* Budget Trends Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={{ border: '1px solid #e5e7eb', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Évolution Budgétaire
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatAmount(v)} />
                    <RechartsTooltip
                      formatter={(value) => formatAmount(Number(value) || 0)}
                      labelFormatter={(label) => `Période: ${label}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="allocated"
                      name="Alloué"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="executed"
                      name="Exécuté"
                      stroke={COLORS.success}
                      fill={COLORS.success}
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Status Pie Chart */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid #e5e7eb', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Statuts des Documents
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} mb={4}>
        {/* Ministry Comparison Bar Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={{ border: '1px solid #e5e7eb', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Comparaison par Ministère (M DJF)
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" py={8}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={ministryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                    <RechartsTooltip
                      formatter={(value) => `${(Number(value) || 0).toFixed(2)} M DJF`}
                    />
                    <Legend />
                    <Bar dataKey="allocated" name="Alloué" fill={COLORS.primary} />
                    <Bar dataKey="executed" name="Exécuté" fill={COLORS.success} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts Summary */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid #e5e7eb', height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Alertes
                </Typography>
                <Badge badgeContent={dashboardData?.alerts.total || 0} color="error">
                  <NotificationsActive />
                </Badge>
              </Box>
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Box mb={3}>
                    {alertsChartData.map((item, index) => (
                      <Box
                        key={item.name}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        py={1}
                        borderBottom={index < alertsChartData.length - 1 ? '1px solid #e5e7eb' : 'none'}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: item.color,
                            }}
                          />
                          <Typography variant="body2">{item.name}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600}>
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Recent Alerts List */}
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Alertes récentes
                  </Typography>
                  <List dense>
                    {alerts.slice(0, 3).map((alert) => (
                      <ListItem key={alert.id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: `${getSeverityColor(alert.severity)}20`,
                              color: getSeverityColor(alert.severity),
                              width: 32,
                              height: 32,
                            }}
                          >
                            <Warning sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {alert.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {alert.message.substring(0, 50)}...
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Activités Récentes
                </Typography>
                <Chip label="Aujourd'hui" size="small" color="primary" variant="outlined" />
              </Box>

              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {dashboardData?.activities.slice(0, 5).map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: `${getActivityColor(activity.action)}20`,
                              color: getActivityColor(activity.action),
                            }}
                          >
                            {getActivityIcon(activity.action)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600}>
                              {activity.description}
                            </Typography>
                          }
                          secondary={
                            <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                Par {activity.userName}
                              </Typography>
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {new Date(activity.timestamp).toLocaleString('fr-FR')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < (dashboardData?.activities.length || 0) - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Execution Rate & Quick Stats */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Grid container spacing={3}>
            {/* Execution Rate */}
            <Grid size={{ xs: 12 }}>
              <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Taux d'Exécution Budgétaire
                  </Typography>
                  {loading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box mt={2}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Exécuté / Alloué
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {Number(dashboardData?.stats.budget.executionRate || 0).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(dashboardData?.stats.budget.executionRate || 0, 100)}
                        sx={{
                          height: 12,
                          borderRadius: 2,
                          bgcolor: '#e5e7eb',
                          '& .MuiLinearProgress-bar': {
                            bgcolor:
                              (dashboardData?.stats.budget.executionRate || 0) > 100
                                ? COLORS.danger
                                : (dashboardData?.stats.budget.executionRate || 0) > 80
                                ? COLORS.success
                                : COLORS.primary,
                            borderRadius: 2,
                          },
                        }}
                      />
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          {formatAmount(dashboardData?.stats.budget.totalExecuted || 0)} DJF exécutés
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatAmount(dashboardData?.stats.budget.totalAllocated || 0)} DJF alloués
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Workflow Stats */}
            <Grid size={{ xs: 12 }}>
              <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Statistiques Workflow
                  </Typography>
                  {loading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={2} mt={1}>
                      <Grid size={{ xs: 6 }}>
                        <Box textAlign="center" p={2} bgcolor="#f9fafb" borderRadius={2}>
                          <Typography variant="h4" fontWeight={700} color={COLORS.success}>
                            {Number(dashboardData?.workflow.validationRate || 0).toFixed(0)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Taux de validation
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box textAlign="center" p={2} bgcolor="#f9fafb" borderRadius={2}>
                          <Typography variant="h4" fontWeight={700} color={COLORS.danger}>
                            {Number(dashboardData?.workflow.rejectionRate || 0).toFixed(0)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Taux de rejet
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Box textAlign="center" p={2} bgcolor="#f9fafb" borderRadius={2}>
                          <Typography variant="h5" fontWeight={700} color={COLORS.warning}>
                            {dashboardData?.stats.pendingValidations.oldestPendingDays || 0} jours
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Plus ancien document en attente
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardEnhanced;
