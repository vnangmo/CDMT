import api from '../config/api';
import { Comment, CommentCreateInput, CommentUpdateInput } from '../types/comment.types';

class CommentService {
  /**
   * Create a new comment
   */
  async create(data: CommentCreateInput): Promise<Comment> {
    const response = await api.post('/comments', data);
    return response.data.data;
  }

  /**
   * Update a comment
   */
  async update(id: string, data: CommentUpdateInput): Promise<Comment> {
    const response = await api.put(`/comments/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete a comment
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/comments/${id}`);
  }

  /**
   * Get comments for a document
   */
  async getByDocument(
    documentType: string,
    documentId: string,
    options?: {
      includeInternal?: boolean;
      onlyUnresolved?: boolean;
    }
  ): Promise<Comment[]> {
    const params = new URLSearchParams();
    if (options?.includeInternal !== undefined) {
      params.append('includeInternal', options.includeInternal.toString());
    }
    if (options?.onlyUnresolved !== undefined) {
      params.append('onlyUnresolved', options.onlyUnresolved.toString());
    }

    const response = await api.get(
      `/comments/${documentType}/${documentId}?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Mark comment as resolved
   */
  async markResolved(id: string): Promise<Comment> {
    const response = await api.post(`/comments/${id}/resolve`);
    return response.data.data;
  }

  /**
   * Reply to a comment
   */
  async reply(parentId: string, content: string): Promise<Comment> {
    const response = await api.post(`/comments/${parentId}/reply`, { content });
    return response.data.data;
  }

  /**
   * Get comment by ID
   */
  async getById(id: string): Promise<Comment> {
    const response = await api.get(`/comments/${id}`);
    return response.data.data;
  }
}

export default new CommentService();
