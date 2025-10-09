import { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { commentsApi, Comment } from '../api/comments';
import CommentItem from './CommentItem';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  taskId: number;
  currentUserId: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  taskId,
  currentUserId,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await commentsApi.list(taskId);
      setComments(data);
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await commentsApi.create(taskId, {
        content: newComment.trim(),
      });
      setComments([comment, ...comments]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error: any) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: number, content: string) => {
    try {
      const updatedComment = await commentsApi.update(commentId, { content });
      setComments(comments.map(c => c.id === commentId ? updatedComment : c));
      toast.success('Comment updated');
    } catch (error: any) {
      toast.error('Failed to update comment');
      throw error;
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await commentsApi.delete(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error: any) {
      toast.error('Failed to delete comment');
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        <MessageSquare size={18} />
        <h3 className="font-medium">
          Comments ({comments.length})
        </h3>
      </div>

      {/* New Comment Form */}
      <div className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="input text-sm"
          rows={3}
          placeholder="Add a comment..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleSubmit();
            }
          }}
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !newComment.trim()}
            className="btn btn-primary text-sm py-2 px-4 flex items-center gap-2"
          >
            <Send size={16} />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <MessageSquare size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No comments yet</p>
            <p className="text-xs text-gray-500 mt-1">Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
