import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
  Button,
  Box,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  MarkEmailRead as MarkEmailReadIcon,
} from '@mui/icons-material';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const NotificationCenter: React.FC = () => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: t('notifications.budgetSubmitted'),
      message: t('notifications.budgetSubmittedMessage'),
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      read: false,
    },
    {
      id: '2',
      type: 'success',
      title: t('notifications.documentApproved'),
      message: t('notifications.documentApprovedMessage'),
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
    },
    {
      id: '3',
      type: 'warning',
      title: t('notifications.deadlineApproaching'),
      message: t('notifications.deadlineApproachingMessage'),
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: true,
    },
    {
      id: '4',
      type: 'error',
      title: t('notifications.validationFailed'),
      message: t('notifications.validationFailedMessage'),
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true,
    },
  ]);

  const open = Boolean(anchorEl);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <InfoIcon sx={{ color: 'info.main' }} />;
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);

    if (seconds < 60) return t('notifications.justNow');
    if (seconds < 3600) return `${Math.floor(seconds / 60)} ${t('notifications.minutesAgo')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${t('notifications.hoursAgo')}`;
    return `${Math.floor(seconds / 86400)} ${t('notifications.daysAgo')}`;
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-label={t('notifications.title')}
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('notifications.title')}
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} ${t('notifications.new')}`}
              size="small"
              color="primary"
            />
          )}
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {t('notifications.noNotifications')}
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ maxHeight: 300, overflow: 'auto', py: 0 }}>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItemButton
                    onClick={() => handleNotificationClick(notification.id)}
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: notification.read ? 'grey.300' : 'background.paper',
                        }}
                      >
                        {getIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: notification.read ? 400 : 600 }}
                        >
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getTimeAgo(notification.timestamp)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                  <Divider />
                </React.Fragment>
              ))}
            </List>

            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                size="small"
                startIcon={<MarkEmailReadIcon />}
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                {t('notifications.markAllAsRead')}
              </Button>
              <Button size="small" onClick={() => window.location.href = '/notifications'}>
                {t('notifications.viewAll')}
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
