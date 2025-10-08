import { formatDistanceToNow } from 'date-fns';
import { ActivityLog } from '../api/comments';
import {
  FileText,
  MessageSquare,
  Paperclip,
  CheckSquare,
  UserPlus,
  Edit,
  Trash2,
  Link2,
  FolderPlus,
  Activity,
} from 'lucide-react';

interface ActivityItemProps {
  activity: ActivityLog;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = (actionType: string, entityType: string) => {
    const iconClass = 'flex-shrink-0';
    const size = 16;

    if (actionType === 'created') {
      if (entityType === 'task') return <CheckSquare className={iconClass} size={size} />;
      if (entityType === 'comment') return <MessageSquare className={iconClass} size={size} />;
      if (entityType === 'file') return <Paperclip className={iconClass} size={size} />;
      if (entityType === 'project') return <FolderPlus className={iconClass} size={size} />;
      if (entityType === 'dependency') return <Link2 className={iconClass} size={size} />;
      return <FileText className={iconClass} size={size} />;
    }

    if (actionType === 'updated') return <Edit className={iconClass} size={size} />;
    if (actionType === 'deleted') return <Trash2 className={iconClass} size={size} />;
    if (actionType === 'assigned') return <UserPlus className={iconClass} size={size} />;
    if (actionType === 'completed') return <CheckSquare className={iconClass} size={size} />;

    return <Activity className={iconClass} size={size} />;
  };

  const getActivityColor = (actionType: string) => {
    const colors: Record<string, string> = {
      created: 'text-green-600 bg-green-50',
      updated: 'text-blue-600 bg-blue-50',
      deleted: 'text-red-600 bg-red-50',
      assigned: 'text-purple-600 bg-purple-50',
      completed: 'text-green-600 bg-green-50',
      commented: 'text-blue-600 bg-blue-50',
    };
    return colors[actionType] || 'text-gray-600 bg-gray-50';
  };

  const formatActivityMessage = () => {
    const { action_type, entity_type, details, user_name } = activity;

    const userName = <span className="font-medium text-gray-900">{user_name}</span>;

    if (action_type === 'created') {
      if (entity_type === 'task') {
        return (
          <>
            {userName} created task{' '}
            <span className="font-medium text-gray-900">{details?.task_title || 'Untitled'}</span>
          </>
        );
      }
      if (entity_type === 'comment') {
        return <>{userName} commented on a task</>;
      }
      if (entity_type === 'file') {
        return (
          <>
            {userName} uploaded{' '}
            <span className="font-medium text-gray-900">{details?.file_name || 'a file'}</span>
          </>
        );
      }
      if (entity_type === 'project') {
        return (
          <>
            {userName} created project{' '}
            <span className="font-medium text-gray-900">{details?.project_name || 'Untitled'}</span>
          </>
        );
      }
      if (entity_type === 'dependency') {
        return <>{userName} added a task dependency</>;
      }
      if (entity_type === 'member') {
        return (
          <>
            {userName} added{' '}
            <span className="font-medium text-gray-900">{details?.added_user || 'a member'}</span>{' '}
            to the project
          </>
        );
      }
    }

    if (action_type === 'updated') {
      if (entity_type === 'task') {
        if (details?.field === 'status') {
          return (
            <>
              {userName} changed task status to{' '}
              <span className="font-medium text-gray-900">{details?.new_value}</span>
            </>
          );
        }
        if (details?.field === 'progress') {
          return (
            <>
              {userName} updated task progress to{' '}
              <span className="font-medium text-gray-900">{details?.new_value}%</span>
            </>
          );
        }
        return (
          <>
            {userName} updated task{' '}
            <span className="font-medium text-gray-900">{details?.task_title || ''}</span>
          </>
        );
      }
      if (entity_type === 'project') {
        return (
          <>
            {userName} updated project{' '}
            <span className="font-medium text-gray-900">{details?.project_name || ''}</span>
          </>
        );
      }
      if (entity_type === 'comment') {
        return <>{userName} edited a comment</>;
      }
    }

    if (action_type === 'deleted') {
      if (entity_type === 'task') {
        return <>{userName} deleted a task</>;
      }
      if (entity_type === 'file') {
        return (
          <>
            {userName} deleted{' '}
            <span className="font-medium text-gray-900">{details?.file_name || 'a file'}</span>
          </>
        );
      }
      if (entity_type === 'comment') {
        return <>{userName} deleted a comment</>;
      }
      if (entity_type === 'dependency') {
        return <>{userName} removed a task dependency</>;
      }
    }

    if (action_type === 'assigned') {
      return (
        <>
          {userName} assigned task to{' '}
          <span className="font-medium text-gray-900">{details?.assigned_to || 'someone'}</span>
        </>
      );
    }

    if (action_type === 'completed') {
      return (
        <>
          {userName} completed task{' '}
          <span className="font-medium text-gray-900">{details?.task_title || ''}</span>
        </>
      );
    }

    return (
      <>
        {userName} {action_type} {entity_type}
      </>
    );
  };

  return (
    <div className="flex gap-3 py-3">
      <div className={`p-2 rounded-full ${getActivityColor(activity.action_type)}`}>
        {getActivityIcon(activity.action_type, activity.entity_type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{formatActivityMessage()}</p>
        <p className="text-xs text-gray-500 mt-1">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;
