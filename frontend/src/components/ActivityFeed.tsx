import { useState, useEffect } from 'react';
import { Activity, Filter } from 'lucide-react';
import { commentsApi, ActivityLog } from '../api/comments';
import ActivityItem from './ActivityItem';
import toast from 'react-hot-toast';

interface ActivityFeedProps {
  projectId?: number;
  taskId?: number;
  limit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  projectId,
  taskId,
  limit = 50,
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadActivities();
  }, [projectId, taskId, limit]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      let data: ActivityLog[];

      if (taskId) {
        data = await commentsApi.getTaskActivity(taskId, limit);
      } else if (projectId) {
        data = await commentsApi.getProjectActivity(projectId, limit);
      } else {
        data = await commentsApi.getUserActivity(limit);
      }

      setActivities(data);
    } catch (error) {
      toast.error('Failed to load activity');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.action === filter;
  });

  const actionTypes = Array.from(new Set(activities.map(a => a.action)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <Activity size={18} />
          <h3 className="font-medium">Activity</h3>
        </div>

        {/* Filter Dropdown */}
        {actionTypes.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Activity</option>
              {actionTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <Activity size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">No activity yet</p>
            <p className="text-xs text-gray-500 mt-1">
              {filter === 'all'
                ? 'Activity will appear here as you work on tasks'
                : `No ${filter} activities found`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      {/* Load More (future enhancement) */}
      {filteredActivities.length >= limit && (
        <div className="text-center">
          <button
            onClick={loadActivities}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Load more activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
