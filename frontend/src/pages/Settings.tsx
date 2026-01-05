import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import settingsService from '../services/settings.service';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface AppSettingsData {
  general: {
    appName: string;
    appVersion: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requireStrongPassword: boolean;
    twoFactorAuth: boolean;
    ipWhitelisting: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpFrom: string;
    enableEmailNotifications: boolean;
  };
  storage: {
    maxFileSize: number;
    allowedFileTypes: string;
    storageQuota: number;
  };
}

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettingsData>({
    general: {
      appName: 'CDMT Djibouti',
      appVersion: '1.0.0',
      maintenanceMode: false,
      allowRegistration: false,
    },
    security: {
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireStrongPassword: true,
      twoFactorAuth: false,
      ipWhitelisting: false,
    },
    email: {
      smtpHost: 'smtp.finances.dj',
      smtpPort: 587,
      smtpUser: 'noreply@finances.dj',
      smtpFrom: 'CDMT System <noreply@finances.dj>',
      enableEmailNotifications: true,
    },
    storage: {
      maxFileSize: 10,
      allowedFileTypes: '.pdf,.xlsx,.docx',
      storageQuota: 1000,
    },
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const appSettings = await settingsService.getSettings();
      setSettings(appSettings);
    } catch (error: any) {
      setErrorMessage(error.message || t('settings.loadError'));
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralChange = (field: keyof AppSettingsData['general']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      general: {
        ...settings.general,
        [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
      },
    });
  };

  const handleSecurityChange = (field: keyof AppSettingsData['security']) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    let value: any;
    const target = event.target;
    if ('checked' in target && typeof (target as any).checked === 'boolean') {
      value = (target as HTMLInputElement).checked;
    } else if ('type' in target && (target as HTMLInputElement).type === 'number') {
      value = parseInt(target.value);
    } else {
      value = target.value;
    }
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [field]: value,
      },
    });
  };

  const handleEmailChange = (field: keyof AppSettingsData['email']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const target = event.target;
    setSettings({
      ...settings,
      email: {
        ...settings.email,
        [field]: target.type === 'checkbox' ? target.checked :
                 target.type === 'number' ? parseInt(target.value) : target.value,
      },
    });
  };

  const handleStorageChange = (field: keyof AppSettingsData['storage']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const target = event.target;
    setSettings({
      ...settings,
      storage: {
        ...settings.storage,
        [field]: target.type === 'number' ? parseFloat(target.value) : target.value,
      },
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsService.updateSettings(settings);
      setSuccessMessage(t('settings.saveSuccess'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || t('settings.saveError'));
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        {t('settings.title')}
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* General Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <SettingsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('settings.general')}
                </Typography>
              </Stack>

              <TextField
                fullWidth
                label={t('settings.appName')}
                value={settings.general.appName}
                onChange={handleGeneralChange('appName')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label={t('settings.appVersion')}
                value={settings.general.appVersion}
                onChange={handleGeneralChange('appVersion')}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.general.maintenanceMode}
                    onChange={handleGeneralChange('maintenanceMode')}
                  />
                }
                label={t('settings.maintenanceMode')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.general.allowRegistration}
                    onChange={handleGeneralChange('allowRegistration')}
                  />
                }
                label={t('settings.allowRegistration')}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('settings.security')}
                </Typography>
              </Stack>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t('settings.sessionTimeout')}</InputLabel>
                <Select
                  value={settings.security.sessionTimeout.toString()}
                  onChange={handleSecurityChange('sessionTimeout')}
                  label={t('settings.sessionTimeout')}
                >
                  <MenuItem value="15">15 {t('settings.minutes')}</MenuItem>
                  <MenuItem value="30">30 {t('settings.minutes')}</MenuItem>
                  <MenuItem value="60">60 {t('settings.minutes')}</MenuItem>
                  <MenuItem value="120">120 {t('settings.minutes')}</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label={t('settings.passwordMinLength')}
                value={settings.security.passwordMinLength}
                onChange={handleSecurityChange('passwordMinLength')}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.requireStrongPassword}
                    onChange={handleSecurityChange('requireStrongPassword')}
                  />
                }
                label={t('settings.requireStrongPassword')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.twoFactorAuth}
                    onChange={handleSecurityChange('twoFactorAuth')}
                  />
                }
                label={t('settings.twoFactorAuth')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.ipWhitelisting}
                    onChange={handleSecurityChange('ipWhitelisting')}
                  />
                }
                label={t('settings.ipWhitelisting')}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Email Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <EmailIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('settings.email')}
                </Typography>
              </Stack>

              <TextField
                fullWidth
                label={t('settings.smtpHost')}
                value={settings.email.smtpHost}
                onChange={handleEmailChange('smtpHost')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                type="number"
                label={t('settings.smtpPort')}
                value={settings.email.smtpPort}
                onChange={handleEmailChange('smtpPort')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label={t('settings.smtpUser')}
                value={settings.email.smtpUser}
                onChange={handleEmailChange('smtpUser')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label={t('settings.smtpFrom')}
                value={settings.email.smtpFrom}
                onChange={handleEmailChange('smtpFrom')}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.email.enableEmailNotifications}
                    onChange={handleEmailChange('enableEmailNotifications')}
                  />
                }
                label={t('settings.enableEmailNotifications')}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Storage Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <StorageIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('settings.storage')}
                </Typography>
              </Stack>

              <TextField
                fullWidth
                type="number"
                label={t('settings.maxFileSize')}
                value={settings.storage.maxFileSize}
                onChange={handleStorageChange('maxFileSize')}
                helperText={t('settings.maxFileSizeHelp')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label={t('settings.allowedFileTypes')}
                value={settings.storage.allowedFileTypes}
                onChange={handleStorageChange('allowedFileTypes')}
                helperText={t('settings.allowedFileTypesHelp')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                type="number"
                label={t('settings.storageQuota')}
                value={settings.storage.storageQuota}
                onChange={handleStorageChange('storageQuota')}
                helperText={t('settings.storageQuotaHelp')}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </Box>
    </Box>
  );
};

export default Settings;
