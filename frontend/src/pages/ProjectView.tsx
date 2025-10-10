import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Calendar, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectsApi, Project, ProjectMember } from '../api/projects';
import { tasksApi, Task } from '../api/tasks';
import GanttChart from '../components/GanttChart';
import TaskDetailModal from '../components/TaskDetailModal';
import ActivityFeed from '../components/ActivityFeed';
import ExportMenu from '../components/ExportMenu';
import GroupsManagement from '../components/GroupsManagement';
import toast from 'react-hot-toast';

export const ProjectView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'gantt' | 'list' | 'activity'>('gantt');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | undefined>(undefined);
  const [parentTaskIdForSubtask, setParentTaskIdForSubtask] = useState<number | undefined>(undefined);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);

  const loadProject = async () => {
    try {
      if (!id) return;
      const data = await projectsApi.get(Number(id));
      setProject(data);
    } catch (error: any) {
      toast.error('Failed to load project');
      navigate('/projects');
    }
  };

  const loadTasks = async () => {
    try {
      if (!id) return;
      setIsLoading(true);
      const data = await tasksApi.list(Number(id));
      setTasks(data);
    } catch (error: any) {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      if (!id) return;
      const data = await projectsApi.getMembers(Number(id));
      setMembers(data);
    } catch (error: any) {
      console.error('Failed to load members');
    }
  };

  useEffect(() => {
    loadProject();
    loadTasks();
    loadMembers();
  }, [id]);

  const handleTaskUpdate = () => {
    loadTasks();
    loadProject(); // Reload to update task counts
  };

  const handleTaskSelect = (taskId: number) => {
    setSelectedTaskId(taskId);
    setEditingTaskId(taskId);
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = () => {
    setEditingTaskId(undefined);
    setParentTaskIdForSubtask(undefined);
    setIsTaskModalOpen(true);
  };

  const handleCreateSubtask = (parentTaskId: number) => {
    setEditingTaskId(undefined);
    setParentTaskIdForSubtask(parentTaskId);
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTaskId(undefined);
    setParentTaskIdForSubtask(undefined);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const calculateProjectProgress = () => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/projects')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                {project.description && (
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ExportMenu projectId={Number(id)} projectName={project.name} />
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(project.user_role)}`}>
                {project.user_role.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <BarChart3 size={16} />
                <span className="text-sm font-medium">Progress</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{calculateProjectProgress()}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${calculateProjectProgress()}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <BarChart3 size={16} />
                <span className="text-sm font-medium">Tasks</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
              <div className="text-sm text-gray-600 mt-1">
                {tasks.filter(t => t.status === 'completed').length} completed
              </div>
            </div>

            <div className="flex gap-4">
              <Link to={`/projects/${id}/members`} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors flex-1">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Users size={16} />
                  <span className="text-sm font-medium">Team Members</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{project.member_count}</div>
                <div className="text-xs text-primary-600 mt-1">View all →</div>
              </Link>

              <button
                onClick={() => setIsGroupsModalOpen(true)}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors flex-1"
              >
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Users size={16} />
                  <span className="text-sm font-medium">Groups</span>
                </div>
                <div className="text-xs text-primary-600 mt-1">Manage →</div>
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar size={16} />
                <span className="text-sm font-medium">Timeline</span>
              </div>
              <div className="text-sm text-gray-900">
                {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
              </div>
              <div className="text-sm text-gray-600">
                to {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('gantt')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'gantt'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Gantt Chart
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('activity')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'activity'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Activity
              </button>
            </div>
            <button
              onClick={handleCreateTask}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              New Task
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={viewMode === 'gantt' ? 'px-4 py-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {viewMode === 'gantt' ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Gantt Chart</h2>
              <p className="text-sm text-gray-600 mt-1">
                Drag tasks to adjust dates, double-click to edit, drag between tasks to create dependencies
              </p>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <GanttChart
                  projectId={Number(id)}
                  onTaskSelect={handleTaskSelect}
                  onTaskUpdate={handleTaskUpdate}
                />
              )}
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Task List</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No tasks yet. Add tasks using the Gantt chart.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleTaskSelect(task.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>
                            Assigned to: {task.assigned_user_name || task.assigned_group_name ? (
                              task.assigned_group_name ? (
                                <span className="inline-flex items-center gap-1">
                                  <span
                                    className="inline-block w-2 h-2 rounded-full"
                                    style={{ backgroundColor: task.assigned_group_color || '#3B82F6' }}
                                  />
                                  {task.assigned_group_name} (Group)
                                </span>
                              ) : (
                                task.assigned_user_name
                              )
                            ) : (
                              'Unassigned'
                            )}
                          </span>
                          <span>•</span>
                          <span>
                            {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'No start date'}
                          </span>
                          <span>→</span>
                          <span>
                            {task.end_date ? new Date(task.end_date).toLocaleDateString() : 'No end date'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="text-sm font-medium text-gray-900">
                          {Math.round(task.progress)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : viewMode === 'activity' ? (
          <ActivityFeed projectId={Number(id)} />
        ) : null}
      </main>

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        onSuccess={handleTaskUpdate}
        projectId={Number(id)}
        taskId={editingTaskId}
        parentTaskId={parentTaskIdForSubtask}
        onCreateSubtask={handleCreateSubtask}
      />

      {/* Groups Management Modal */}
      {isGroupsModalOpen && (
        <GroupsManagement
          projectId={Number(id)}
          members={members}
          onClose={() => setIsGroupsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProjectView;
