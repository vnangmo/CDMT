import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/user.service';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Alert,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';

interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  ministry?: string;
  role?: string;
}

const UserProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [profileData, setProfileData] = useState<UserProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ministry: '',
    role: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await userService.getProfile();
      setFullProfile(profile);
      setProfileData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        ministry: profile.ministry?.name || '',
        role: profile.role?.name || '',
      });
    } catch (error: any) {
      setErrorMessage(error.message || t('userProfile.loadError'));
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        ministry: user.ministry?.name || '',
        role: user.role?.name || '',
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Call API to update user profile
      const updatedProfile = await userService.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
      });

      // Update local profile state
      setFullProfile(updatedProfile);

      setSuccessMessage(t('userProfile.updateSuccess'));
      setIsEditing(false);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || t('userProfile.updateError'));
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfileData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileData({ ...profileData, [field]: event.target.value });
  };

  const getInitials = () => {
    return `${profileData.firstName?.[0] || ''}${profileData.lastName?.[0] || ''}`.toUpperCase();
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
        {t('userProfile.title')}
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
        {/* Profile Picture Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '3rem',
                    bgcolor: 'primary.main',
                    margin: '0 auto',
                  }}
                >
                  {getInitials()}
                </Avatar>
                {isEditing && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                    size="small"
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                )}
              </Box>

              <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
                {profileData.firstName} {profileData.lastName}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {profileData.email}
              </Typography>

              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                <Chip label={profileData.role} color="primary" size="small" />
                {fullProfile?.isActive && (
                  <Chip label={t('common.active')} color="success" size="small" />
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                {t('userProfile.memberSince')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {fullProfile?.createdAt ? new Date(fullProfile.createdAt).toLocaleDateString('fr-FR') : '-'}
              </Typography>

              {fullProfile?.lastLogin && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {t('userProfile.lastLogin')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(fullProfile.lastLogin).toLocaleString('fr-FR')}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Information Card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('userProfile.personalInformation')}
                </Typography>
                {!isEditing ? (
                  <Button
                    startIcon={<EditIcon />}
                    variant="outlined"
                    onClick={handleEdit}
                  >
                    {t('common.edit')}
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button
                      startIcon={<CancelIcon />}
                      variant="outlined"
                      onClick={handleCancel}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? t('common.saving') : t('common.save')}
                    </Button>
                  </Stack>
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('users.firstName')}
                    value={profileData.firstName}
                    onChange={handleChange('firstName')}
                    disabled={!isEditing}
                    variant={isEditing ? 'outlined' : 'filled'}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('users.lastName')}
                    value={profileData.lastName}
                    onChange={handleChange('lastName')}
                    disabled={!isEditing}
                    variant={isEditing ? 'outlined' : 'filled'}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('users.email')}
                    value={profileData.email}
                    disabled
                    variant="filled"
                    helperText={t('userProfile.emailCannotChange')}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('users.phone')}
                    value={profileData.phone}
                    onChange={handleChange('phone')}
                    disabled={!isEditing}
                    variant={isEditing ? 'outlined' : 'filled'}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('users.ministry')}
                    value={profileData.ministry}
                    disabled
                    variant="filled"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('users.role')}
                    value={profileData.role}
                    disabled
                    variant="filled"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {t('userProfile.security')}
              </Typography>

              <Button
                variant="outlined"
                color="primary"
                onClick={() => window.location.href = '/change-password'}
              >
                {t('auth.changePassword')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile;
