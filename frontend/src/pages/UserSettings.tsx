import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import userService from '../services/user.service';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Alert,
  Stack,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Accessibility as AccessibilityIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

interface UserSettingsData {
  language: string;
  theme: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  };
  accessibility: {
    largeText: boolean;
    highContrast: boolean;
    screenReader: boolean;
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showOnlineStatus: boolean;
  };
}

const UserSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettingsData>({
    language: i18n.language,
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      sms: false,
      weeklyReport: true,
      monthlyReport: true,
    },
    accessibility: {
      largeText: false,
      highContrast: false,
      screenReader: false,
    },
    privacy: {
      showEmail: false,
      showPhone: false,
      showOnlineStatus: true,
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
      const userSettings = await userService.getSettings();
      setSettings(userSettings);
      // Apply language from settings
      if (userSettings.language) {
        i18n.changeLanguage(userSettings.language);
      }
    } catch (error: any) {
      setErrorMessage(error.message || t('userSettings.loadError'));
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const newLang = event.target.value;
    setSettings({ ...settings, language: newLang });
    i18n.changeLanguage(newLang);
  };

  const handleThemeChange = (event: SelectChangeEvent) => {
    setSettings({ ...settings, theme: event.target.value });
  };

  const handleNotificationToggle = (key: keyof UserSettingsData['notifications']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: event.target.checked,
      },
    });
  };

  const handleAccessibilityToggle = (key: keyof UserSettingsData['accessibility']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      accessibility: {
        ...settings.accessibility,
        [key]: event.target.checked,
      },
    });
  };

  const handlePrivacyToggle = (key: keyof UserSettingsData['privacy']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: event.target.checked,
      },
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userService.updateSettings(settings);
      setSuccessMessage(t('userSettings.saveSuccess'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || t('userSettings.saveError'));
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
        {t('userSettings.title')}
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
        {/* Language & Theme Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <LanguageIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('userSettings.languageAndAppearance')}
                </Typography>
              </Stack>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t('language.selectLanguage')}</InputLabel>
                <Select
                  value={settings.language}
                  onChange={handleLanguageChange}
                  label={t('language.selectLanguage')}
                >
                  <MenuItem value="fr">🇫🇷 {t('language.french')}</MenuItem>
                  <MenuItem value="en">🇬🇧 {t('language.english')}</MenuItem>
                  <MenuItem value="ar">🇩🇯 {t('language.arabic')}</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>{t('userSettings.theme')}</InputLabel>
                <Select
                  value={settings.theme}
                  onChange={handleThemeChange}
                  label={t('userSettings.theme')}
                >
                  <MenuItem value="light">{t('userSettings.lightTheme')}</MenuItem>
                  <MenuItem value="dark">{t('userSettings.darkTheme')}</MenuItem>
                  <MenuItem value="auto">{t('userSettings.autoTheme')}</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('userSettings.notifications')}
                </Typography>
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.email}
                    onChange={handleNotificationToggle('email')}
                  />
                }
                label={t('userSettings.emailNotifications')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.push}
                    onChange={handleNotificationToggle('push')}
                  />
                }
                label={t('userSettings.pushNotifications')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.sms}
                    onChange={handleNotificationToggle('sms')}
                  />
                }
                label={t('userSettings.smsNotifications')}
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                {t('userSettings.reportNotifications')}
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.weeklyReport}
                    onChange={handleNotificationToggle('weeklyReport')}
                  />
                }
                label={t('userSettings.weeklyReport')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.monthlyReport}
                    onChange={handleNotificationToggle('monthlyReport')}
                  />
                }
                label={t('userSettings.monthlyReport')}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Accessibility Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <AccessibilityIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('userSettings.accessibility')}
                </Typography>
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.accessibility.largeText}
                    onChange={handleAccessibilityToggle('largeText')}
                  />
                }
                label={t('userSettings.largeText')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.accessibility.highContrast}
                    onChange={handleAccessibilityToggle('highContrast')}
                  />
                }
                label={t('userSettings.highContrast')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.accessibility.screenReader}
                    onChange={handleAccessibilityToggle('screenReader')}
                  />
                }
                label={t('userSettings.screenReaderOptimization')}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <PaletteIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('userSettings.privacy')}
                </Typography>
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.showEmail}
                    onChange={handlePrivacyToggle('showEmail')}
                  />
                }
                label={t('userSettings.showEmail')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.showPhone}
                    onChange={handlePrivacyToggle('showPhone')}
                  />
                }
                label={t('userSettings.showPhone')}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.showOnlineStatus}
                    onChange={handlePrivacyToggle('showOnlineStatus')}
                  />
                }
                label={t('userSettings.showOnlineStatus')}
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

export default UserSettings;
