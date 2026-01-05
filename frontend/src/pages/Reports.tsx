import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

const Reports: React.FC = () => {
  const [fiscalYear, setFiscalYear] = useState('2024');
  const [reportType, setReportType] = useState('all');

  const reportCategories = [
    {
      category: 'Cadre Macroéconomique',
      icon: <TrendingUpIcon />,
      color: '#2563eb',
      bgColor: '#dbeafe',
      reports: [
        { name: 'Hypothèses Macroéconomiques', format: 'PDF', size: '2.3 MB' },
        { name: 'TOFE Prévisionnel', format: 'Excel', size: '1.8 MB' },
        { name: 'Document CBMT', format: 'PDF', size: '4.5 MB' },
      ],
    },
    {
      category: 'CDMT Global',
      icon: <AccountBalanceIcon />,
      color: '#16a34a',
      bgColor: '#dcfce7',
      reports: [
        { name: 'Budget Tendanciel', format: 'Excel', size: '3.2 MB' },
        { name: 'Scénarios CDMT Global', format: 'PDF', size: '2.8 MB' },
        { name: 'Plafonds Ministériels', format: 'Excel', size: '1.5 MB' },
      ],
    },
    {
      category: 'CDMT Sectoriels',
      icon: <BusinessIcon />,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      reports: [
        { name: 'Mesures Sectorielles', format: 'Excel', size: '2.1 MB' },
        { name: 'Plans d\'Action', format: 'PDF', size: '3.7 MB' },
        { name: 'Synthèse Sectorielle', format: 'PDF', size: '5.2 MB' },
      ],
    },
    {
      category: 'Rapports Consolidés',
      icon: <AssessmentIcon />,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      reports: [
        { name: 'Rapport Annuel CDMT', format: 'PDF', size: '8.9 MB' },
        { name: 'Tableau de Bord Exécutif', format: 'Excel', size: '2.4 MB' },
        { name: 'Analyse d\'Écarts', format: 'PDF', size: '3.1 MB' },
      ],
    },
  ];

  const getFormatIcon = (format: string) => {
    return format === 'PDF' ? <PdfIcon /> : <ExcelIcon />;
  };

  const getFormatColor = (format: string) => {
    return format === 'PDF' ? '#dc2626' : '#16a34a';
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Rapports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Générer et télécharger les rapports CDMT
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
              label="Type de Rapport"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
            >
              <MenuItem value="all">Tous les rapports</MenuItem>
              <MenuItem value="macro">Cadre Macroéconomique</MenuItem>
              <MenuItem value="global">CDMT Global</MenuItem>
              <MenuItem value="sectoral">CDMT Sectoriels</MenuItem>
              <MenuItem value="consolidated">Rapports Consolidés</MenuItem>
            </TextField>

            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{ ml: 'auto' }}
            >
              Tout Télécharger
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Report Categories */}
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
        {reportCategories.map((category, index) => (
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
              {/* Category Header */}
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    bgcolor: category.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {React.cloneElement(category.icon, {
                    sx: { color: category.color, fontSize: 24 },
                  })}
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  {category.category}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Reports List */}
              <List sx={{ p: 0 }}>
                {category.reports.map((report, reportIndex) => (
                  <ListItem
                    key={reportIndex}
                    sx={{
                      px: 0,
                      py: 1.5,
                      borderBottom:
                        reportIndex < category.reports.length - 1
                          ? '1px solid #f5f5f5'
                          : 'none',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {React.cloneElement(getFormatIcon(report.format), {
                        sx: { color: getFormatColor(report.format), fontSize: 28 },
                      })}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {report.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {report.format} • {report.size}
                        </Typography>
                      }
                    />
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        sx={{ textTransform: 'none' }}
                      >
                        Voir
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        sx={{ textTransform: 'none' }}
                      >
                        Télécharger
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default Reports;
