import { useState } from 'react';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { Comment } from '../api/comments';
import { formatDistanceToNow } from 'date-fns';

interface CommentItemProps {
  comment: Comment;
  currentUserId: number;
  onUpdate: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = comment.user_id === currentUserId;

  const handleUpdate = async () => {
    if (!editContent.trim()) return;

    setIsUpdating(true);
    try {
      await onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (userId: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500',
    ];
    return colors[userId % colors.length];
  };

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getAvatarColor(comment.user_id)} flex items-center justify-center text-white text-xs font-medium`}>
        {getInitials(comment.user_name)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">{comment.user_name}</span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {comment.created_at !== comment.updated_at && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="input text-sm"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={isUpdating || !editContent.trim()}
                className="btn btn-primary text-xs py-1 px-3 flex items-center gap-1"
              >
                <Check size={14} />
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="btn btn-secondary text-xs py-1 px-3 flex items-center gap-1"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{comment.content}</p>
          </div>
        )}

        {/* Actions */}
        {isOwner && !isEditing && (
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-600 hover:text-primary-600 flex items-center gap-1"
            >
              <Edit2 size={12} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-gray-600 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 size={12} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
