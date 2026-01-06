import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Comment as CommentIcon,
  Person as PersonIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import apiClient from '../services/api.service';

interface Comment {
  id: string;
  content: string;
  documentType: string;
  documentId: string;
  documentCode?: string;
  userId: string;
  userName?: string;
  createdAt: string;
  status: string;
}

const Comments: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/comments?limit=100').catch(() => ({ data: { data: [] } }));
      setComments(response.data.data || []);
    } catch (err: any) {
      console.log('Comments endpoint not available');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CBMT: 'CBMT',
      CDMT_GLOBAL: 'CDMT Global',
      CDMT_SECTORAL: 'CDMT Sectoriel',
      ACTION_PLAN: "Plan d'action",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'RESOLVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredComments = filterType === 'all'
    ? comments
    : comments.filter(c => c.documentType === filterType);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Commentaires et Annotations"
        subtitle="Suivi des commentaires sur les documents budgetaires"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Commentaires ({filteredComments.length})
                </Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Type de document</InputLabel>
                  <Select
                    value={filterType}
                    label="Type de document"
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem value="all">Tous</MenuItem>
                    <MenuItem value="CBMT">CBMT</MenuItem>
                    <MenuItem value="CDMT_GLOBAL">CDMT Global</MenuItem>
                    <MenuItem value="CDMT_SECTORAL">CDMT Sectoriel</MenuItem>
                    <MenuItem value="ACTION_PLAN">Plan d'action</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {filteredComments.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  Aucun commentaire disponible
                </Typography>
              ) : (
                <List>
                  {filteredComments.map((comment, index) => (
                    <React.Fragment key={comment.id}>
                      {index > 0 && <Divider />}
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2">
                                {comment.userName || 'Utilisateur'}
                              </Typography>
                              <Chip
                                label={getDocumentTypeLabel(comment.documentType)}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={comment.status}
                                size="small"
                                color={getStatusColor(comment.status) as any}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                                {comment.content}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(comment.createdAt).toLocaleString('fr-FR')}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Nouveau commentaire
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Saisissez votre commentaire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                fullWidth
                startIcon={<SendIcon />}
                disabled={!newComment.trim()}
              >
                Envoyer
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiques
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Total commentaires</Typography>
                  <Typography variant="body2" fontWeight="bold">{comments.length}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">En attente</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {comments.filter(c => c.status === 'PENDING').length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Resolus</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {comments.filter(c => c.status === 'RESOLVED').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Comments;
