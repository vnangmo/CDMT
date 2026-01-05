import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Send,
  Edit,
  Delete,
  Reply,
  CheckCircle,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import commentService from '../../services/comment.service';
import { Comment, CommentType, COMMENT_TYPE_CONFIG } from '../../types/comment.types';

interface CommentSectionProps {
  documentType: string;
  documentId: string;
  allowInternal?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  documentType,
  documentId,
  allowInternal = false,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<CommentType>(CommentType.GENERAL);
  const [isInternal, setIsInternal] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadComments();
  }, [documentType, documentId, showResolved]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await commentService.getByDocument(documentType, documentId, {
        includeInternal: true,
        onlyUnresolved: !showResolved,
      });
      setComments(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des commentaires');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await commentService.create({
        documentType,
        documentId,
        content: newComment,
        commentType,
        isInternal,
      });
      setNewComment('');
      setCommentType(CommentType.GENERAL);
      setIsInternal(false);
      loadComments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      await commentService.reply(parentId, replyContent);
      setReplyTo(null);
      setReplyContent('');
      loadComments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout de la réponse');
    }
  };

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;

    try {
      await commentService.update(id, { content: editContent });
      setEditingId(null);
      setEditContent('');
      loadComments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) return;

    try {
      await commentService.delete(id);
      loadComments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await commentService.markResolved(id);
      loadComments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la résolution');
    }
  };

  const toggleThread = (commentId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedThreads(newExpanded);
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingId === comment.id;
    const isReplying = replyTo === comment.id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedThreads.has(comment.id);

    const typeConfig = COMMENT_TYPE_CONFIG[comment.commentType as CommentType];

    return (
      <Box key={comment.id} sx={{ ml: isReply ? 4 : 0, mb: 2 }}>
        <Paper elevation={isReply ? 0 : 1} sx={{ p: 2, bgcolor: isReply ? 'grey.50' : 'white' }}>
          <Box display="flex" alignItems="flex-start" gap={2}>
            <Avatar sx={{ bgcolor: typeConfig.color }}>
              {comment.author?.firstName?.[0] || 'U'}
            </Avatar>

            <Box flex={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {comment.author
                      ? `${comment.author.firstName} ${comment.author.lastName}`
                      : 'Utilisateur inconnu'}
                  </Typography>
                  <Chip
                    label={typeConfig.label}
                    size="small"
                    color={typeConfig.color}
                  />
                  {comment.isInternal && (
                    <Chip label="Interne" size="small" color="warning" variant="outlined" />
                  )}
                  {comment.isResolved && (
                    <Chip label="Résolu" size="small" color="success" variant="outlined" />
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {format(new Date(comment.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                  {comment.isEdited && ' (modifié)'}
                </Typography>
              </Box>

              {isEditing ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Box display="flex" gap={1}>
                    <Button size="small" variant="contained" onClick={() => handleEdit(comment.id)}>
                      Enregistrer
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                    >
                      Annuler
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <Typography variant="body2" paragraph>
                    {comment.content}
                  </Typography>

                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setReplyTo(comment.id);
                        setReplyContent('');
                      }}
                    >
                      <Reply fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(comment.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                    {!comment.isResolved && (
                      <IconButton size="small" onClick={() => handleResolve(comment.id)} color="success">
                        <CheckCircle fontSize="small" />
                      </IconButton>
                    )}
                    {hasReplies && (
                      <IconButton size="small" onClick={() => toggleThread(comment.id)}>
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        <Typography variant="caption" ml={0.5}>
                          {comment.replies!.length}
                        </Typography>
                      </IconButton>
                    )}
                  </Box>
                </>
              )}

              {isReplying && (
                <Box mt={2}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Écrire une réponse..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Send />}
                      onClick={() => handleReply(comment.id)}
                    >
                      Répondre
                    </Button>
                    <Button size="small" onClick={() => setReplyTo(null)}>
                      Annuler
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {hasReplies && (
          <Collapse in={isExpanded}>
            <Box mt={1}>
              {comment.replies!.map((reply) => renderComment(reply, true))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  const topLevelComments = comments.filter((c) => !c.parentId);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Commentaires
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body2" color="text.secondary">
          {topLevelComments.length} commentaire{topLevelComments.length !== 1 ? 's' : ''}
        </Typography>
        <FormControlLabel
          control={<Switch checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />}
          label="Afficher les commentaires résolus"
        />
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Ajouter un commentaire..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={commentType}
              label="Type"
              onChange={(e) => setCommentType(e.target.value as CommentType)}
            >
              {Object.values(CommentType).map((type) => (
                <MenuItem key={type} value={type}>
                  {COMMENT_TYPE_CONFIG[type].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {allowInternal && (
            <FormControlLabel
              control={<Switch checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />}
              label="Commentaire interne"
            />
          )}

          <Box flex={1} />

          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleAddComment}
            disabled={!newComment.trim()}
          >
            Ajouter
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : topLevelComments.length === 0 ? (
        <Alert severity="info">Aucun commentaire pour le moment</Alert>
      ) : (
        topLevelComments.map((comment) => renderComment(comment))
      )}
    </Box>
  );
};

export default CommentSection;
