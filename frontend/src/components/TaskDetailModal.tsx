import { useState, useEffect } from 'react';
import { X, Calendar, User, BarChart3, Flag, Link2, Trash2, Plus } from 'lucide-react';
import { tasksApi, Task, CreateTaskData, UpdateTaskData, TaskDependency } from '../api/tasks';
import { projectsApi, ProjectMember } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import CommentSection from './CommentSection';
import FileSection from './FileSection';
import toast from 'react-hot-toast';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: number;
  taskId?: number;
  parentTaskId?: number;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  taskId,
  parentTaskId,
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'blocked' | 'cancelled'>('not_started');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [showAddDependency, setShowAddDependency] = useState(false);
  const [newDependencyTaskId, setNewDependencyTaskId] = useState<string>('');
  const [newDependencyType, setNewDependencyType] = useState<'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'>('finish_to_start');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      loadAvailableTasks();
      if (taskId) {
        loadTask();
      } else {
        resetForm();
      }
    }
  }, [isOpen, taskId, projectId]);

  const loadTask = async () => {
    if (!taskId) return;
    try {
      setIsLoading(true);
      const data = await tasksApi.get(taskId);
      setTask(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setStartDate(data.start_date ? data.start_date.split('T')[0] : '');
      setEndDate(data.end_date ? data.end_date.split('T')[0] : '');
      setDuration(data.duration || 1);
      setProgress(Math.round(data.progress));
      setStatus(data.status);
      setPriority(data.priority);
      setAssignedTo(data.assigned_to);

      const deps = await tasksApi.getDependencies(taskId);
      setDependencies(deps);
    } catch (error) {
      toast.error('Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await projectsApi.getMembers(projectId);
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members');
    }
  };

  const loadAvailableTasks = async () => {
    try {
      const data = await tasksApi.list(projectId);
      setAvailableTasks(data.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to load tasks');
    }
  };

  const resetForm = () => {
    setTask(null);
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setDuration(1);
    setProgress(0);
    setStatus('not_started');
    setPriority('medium');
    setAssignedTo(null);
    setDependencies([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (taskId) {
        // Update existing task
        const updateData: UpdateTaskData = {
          title,
          description: description || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          duration,
          progress: progress / 100,
          status,
          priority,
          assignedTo: assignedTo || null,
        };
        await tasksApi.update(taskId, updateData);
        toast.success('Task updated successfully');
      } else {
        // Create new task
        const createData: CreateTaskData = {
          title,
          description: description || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          duration,
          status,
          priority,
          assignedTo: assignedTo || undefined,
          parentTaskId: parentTaskId || undefined,
        };
        await tasksApi.create(projectId, createData);
        toast.success('Task created successfully');
      }
      onSuccess();
      handleClose();
    } catch (error: any) {
      const message = error.response?.data?.message || `Failed to ${taskId ? 'update' : 'create'} task`;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!taskId || !confirm('Are you sure you want to delete this task?')) return;

    setIsDeleting(true);
    try {
      await tasksApi.delete(taskId);
      toast.success('Task deleted successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddDependency = async () => {
    if (!taskId || !newDependencyTaskId) return;

    try {
      await tasksApi.addDependency(
        taskId,
        Number(newDependencyTaskId),
        newDependencyType,
        0
      );
      toast.success('Dependency added successfully');
      setShowAddDependency(false);
      setNewDependencyTaskId('');
      loadTask();
    } catch (error: any) {
      toast.error('Failed to add dependency');
    }
  };

  const handleRemoveDependency = async (depId: number) => {
    if (!taskId || !confirm('Remove this dependency?')) return;

    try {
      await tasksApi.removeDependency(taskId, depId);
      toast.success('Dependency removed successfully');
      loadTask();
    } catch (error: any) {
      toast.error('Failed to remove dependency');
    }
  };

  const handleClose = () => {
    resetForm();
    setShowAddDependency(false);
    onClose();
  };

  if (!isOpen) return null;

  const statusColors = {
    not_started: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">
            {taskId ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Enter task title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={4}
              placeholder="Add task description..."
            />
          </div>

          {/* Dates and Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="startDate" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Calendar size={16} />
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Calendar size={16} />
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (days)
              </label>
              <input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="input"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Flag size={16} />
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label htmlFor="assignedTo" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <User size={16} />
              Assign To
            </label>
            <select
              id="assignedTo"
              value={assignedTo || ''}
              onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : null)}
              className="input"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.user_name} ({member.user_email})
                </option>
              ))}
            </select>
          </div>

          {/* Progress (only for existing tasks) */}
          {taskId && (
            <div>
              <label htmlFor="progress" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <BarChart3 size={16} />
                Progress: {progress}%
              </label>
              <input
                id="progress"
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Dependencies (only for existing tasks) */}
          {taskId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Link2 size={16} />
                  Dependencies
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddDependency(!showAddDependency)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Dependency
                </button>
              </div>

              {showAddDependency && (
                <div className="bg-gray-50 rounded-lg p-4 mb-3 space-y-3">
                  <select
                    value={newDependencyTaskId}
                    onChange={(e) => setNewDependencyTaskId(e.target.value)}
                    className="input"
                  >
                    <option value="">Select a task...</option>
                    {availableTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newDependencyType}
                    onChange={(e) => setNewDependencyType(e.target.value as any)}
                    className="input"
                  >
                    <option value="finish_to_start">Finish to Start</option>
                    <option value="start_to_start">Start to Start</option>
                    <option value="finish_to_finish">Finish to Finish</option>
                    <option value="start_to_finish">Start to Finish</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddDependency}
                      className="btn btn-primary flex-1"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddDependency(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {dependencies.length === 0 ? (
                  <p className="text-sm text-gray-500">No dependencies</p>
                ) : (
                  dependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {dep.depends_on_title || `Task #${dep.depends_on_task_id}`}
                        </p>
                        <p className="text-xs text-gray-600">
                          {dep.dependency_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(dep.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* File Attachments (only for existing tasks) */}
          {taskId && user && (
            <div className="pt-4 border-t">
              <FileSection taskId={taskId} currentUserId={user.id} />
            </div>
          )}

          {/* Comments (only for existing tasks) */}
          {taskId && user && (
            <div className="pt-4 border-t">
              <CommentSection taskId={taskId} currentUserId={user.id} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {taskId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn btn-danger flex items-center gap-2"
              >
                <Trash2 size={16} />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Saving...' : taskId ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetailModal;
