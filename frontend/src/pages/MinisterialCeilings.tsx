import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

const MinisterialCeilings: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data - will be replaced with API calls
  const ceilings = [
    {
      id: '1',
      ministry: 'Ministère de la Santé',
      fiscalYear: '2024',
      ceiling: 45000000,
      allocated: 38000000,
      status: 'VALIDATED',
    },
    {
      id: '2',
      ministry: 'Ministère de l\'Éducation',
      fiscalYear: '2024',
      ceiling: 52000000,
      allocated: 45000000,
      status: 'VALIDATED',
    },
    {
      id: '3',
      ministry: 'Ministère des Infrastructures',
      fiscalYear: '2024',
      ceiling: 38000000,
      allocated: 32000000,
      status: 'DRAFT',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return 'success';
      case 'DRAFT':
        return 'default';
      case 'SUBMITTED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return 'Validé';
      case 'DRAFT':
        return 'Brouillon';
      case 'SUBMITTED':
        return 'Soumis';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DJ', {
      style: 'currency',
      currency: 'DJF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Plafonds Ministériels
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestion des plafonds budgétaires par ministère
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 1.5,
            textTransform: 'none',
            px: 3,
          }}
        >
          Nouveau Plafond
        </Button>
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
        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MoneyIcon sx={{ color: '#2563eb', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Plafond Total
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  135M DJF
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MoneyIcon sx={{ color: '#16a34a', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Alloué
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  115M DJF
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MoneyIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Disponible
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  20M DJF
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MoneyIcon sx={{ color: '#8b5cf6', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Taux d'Allocation
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  85%
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content */}
      <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
        <CardContent>
          {/* Search and Filters */}
          <Box mb={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Rechercher un ministère..."
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
                maxWidth: 400,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                },
              }}
            />
          </Box>

          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      Ministère
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      Année Fiscale
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      Plafond
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      Alloué
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={600}>
                      Statut
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={600}>
                      Actions
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ceilings.map((ceiling) => (
                  <TableRow key={ceiling.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {ceiling.ministry}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ceiling.fiscalYear}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(ceiling.ceiling)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(ceiling.allocated)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(ceiling.status)}
                        color={getStatusColor(ceiling.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary">
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MinisterialCeilings;
