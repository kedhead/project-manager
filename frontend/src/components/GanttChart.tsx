import { useEffect, useRef, useState } from 'react';
import { Gantt } from 'wx-react-gantt';
import 'wx-react-gantt/dist/gantt.css';
import { tasksApi, Task, TaskDependency } from '../api/tasks';
import toast from 'react-hot-toast';

interface GanttChartProps {
  projectId: number;
  autoScheduling?: boolean;
  onTaskSelect?: (taskId: number) => void;
  onTaskUpdate?: () => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  projectId,
  autoScheduling = false,
  onTaskSelect,
  onTaskUpdate,
}) => {
  const apiRef = useRef<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Configure columns for the grid
  const columns = [
    {
      id: 'text',
      label: 'Task name',
      width: 250,
      resize: true,
    },
    {
      id: 'start',
      label: 'Start date',
      width: 120,
      resize: true,
    },
    {
      id: 'duration',
      label: 'Duration',
      width: 80,
      align: 'center',
      resize: true,
    },
    {
      id: 'progress',
      label: 'Progress',
      width: 80,
      align: 'center',
      resize: true,
      template: (task: any) => `${Math.round(task.progress || 0)}%`,
    },
    {
      id: 'assigned_user_name',
      label: 'Assigned',
      width: 130,
      resize: true,
      template: (task: any) => task.assigned_user_name || '-',
    },
  ];

  // Configure scales for the timeline
  const scales = [
    { unit: 'month', step: 1, format: 'MMMM yyyy' },
    { unit: 'day', step: 1, format: 'd' },
  ];

  // Load tasks from API
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const apiTasks = await tasksApi.list(projectId);
      console.log('Tasks from API:', apiTasks);

      // Transform tasks to SVAR Gantt format
      const ganttTasks = apiTasks.map((task: Task) => ({
        id: task.id,
        text: task.title,
        start: task.start_date ? new Date(task.start_date) : new Date(),
        end: task.end_date ? new Date(task.end_date) : new Date(),
        duration: task.duration || 1,
        progress: task.progress || 0,
        type: apiTasks.some(t => t.parent_task_id === task.id) ? 'summary' : 'task',
        parent: task.parent_task_id || 0,
        open: true,
        // Custom properties
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to,
        assigned_user_name: task.assigned_user_name,
        assigned_user_email: task.assigned_user_email,
        color: task.color,
      }));

      // Transform dependencies to SVAR Gantt links
      const ganttLinks: any[] = [];
      apiTasks.forEach((task: Task) => {
        if (task.dependencies && task.dependencies.length > 0) {
          task.dependencies.forEach((dep: TaskDependency) => {
            const typeMap: Record<string, string> = {
              finish_to_start: 'e2s',
              start_to_start: 's2s',
              finish_to_finish: 'e2e',
              start_to_finish: 's2e',
            };
            ganttLinks.push({
              id: dep.id,
              source: dep.depends_on_task_id,
              target: task.id,
              type: typeMap[dep.dependency_type] || 'e2s',
            });
          });
        }
      });

      setTasks(ganttTasks);
      setLinks(ganttLinks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize and set up event handlers
  useEffect(() => {
    loadTasks();
  }, [projectId]);

  // Set up API event handlers when API is available
  useEffect(() => {
    if (!apiRef.current) return;

    const api = apiRef.current;

    // Handle add task
    const unsubAdd = api.on('add-task', async (event: any) => {
      try {
        const task = event.task;
        const newTask = await tasksApi.create(projectId, {
          title: task.text || 'New Task',
          startDate: task.start.toISOString().split('T')[0],
          endDate: task.end.toISOString().split('T')[0],
          duration: task.duration || 1,
          status: 'not_started',
          priority: 'medium',
          parentTaskId: task.parent || undefined,
        });

        // Update the task ID in the Gantt
        event.task.id = newTask.id;

        if (onTaskUpdate) onTaskUpdate();
        toast.success('Task created successfully');
      } catch (error) {
        console.error('Failed to create task:', error);
        toast.error('Failed to create task');
        // Reload to revert
        loadTasks();
      }
    });

    // Handle update task
    const unsubUpdate = api.on('update-task', async (event: any) => {
      try {
        const task = event.task;
        const taskId = Number(task.id);

        await tasksApi.update(taskId, {
          title: task.text,
          startDate: task.start.toISOString().split('T')[0],
          endDate: task.end.toISOString().split('T')[0],
          duration: task.duration,
          progress: Math.round(task.progress || 0),
          status: task.status || 'not_started',
          priority: task.priority || 'medium',
          parentTaskId: task.parent || null,
        });

        if (onTaskUpdate) onTaskUpdate();
        toast.success('Task updated successfully');
      } catch (error) {
        console.error('Failed to update task:', error);
        toast.error('Failed to update task');
        // Reload to revert
        loadTasks();
      }
    });

    // Handle delete task
    const unsubDelete = api.on('delete-task', async (event: any) => {
      try {
        const taskId = Number(event.id);
        await tasksApi.delete(taskId);

        if (onTaskUpdate) onTaskUpdate();
        toast.success('Task deleted successfully');
      } catch (error) {
        console.error('Failed to delete task:', error);
        toast.error('Failed to delete task');
        // Reload to revert
        loadTasks();
      }
    });

    // Handle add link
    const unsubAddLink = api.on('add-link', async (event: any) => {
      try {
        const link = event.link;
        const typeMap: Record<string, string> = {
          'e2s': 'finish_to_start',
          's2s': 'start_to_start',
          'e2e': 'finish_to_finish',
          's2e': 'start_to_finish',
        };

        const depType = (typeMap[link.type] || 'finish_to_start') as 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
        await tasksApi.addDependency(
          Number(link.target),
          Number(link.source),
          depType,
          0
        );

        if (onTaskUpdate) onTaskUpdate();
        toast.success('Dependency added successfully');
      } catch (error) {
        console.error('Failed to add dependency:', error);
        toast.error('Failed to add dependency');
        // Reload to revert
        loadTasks();
      }
    });

    // Handle delete link
    const unsubDeleteLink = api.on('delete-link', async (event: any) => {
      try {
        await tasksApi.removeDependency(Number(event.link.target), Number(event.id));

        if (onTaskUpdate) onTaskUpdate();
        toast.success('Dependency removed successfully');
      } catch (error) {
        console.error('Failed to remove dependency:', error);
        toast.error('Failed to remove dependency');
        // Reload to revert
        loadTasks();
      }
    });

    // Handle task selection
    const unsubSelect = api.on('select-task', (event: any) => {
      if (onTaskSelect && event.id) {
        const taskId = Number(event.id);
        if (!isNaN(taskId)) {
          onTaskSelect(taskId);
        }
      }
    });

    // Cleanup subscriptions
    return () => {
      unsubAdd();
      unsubUpdate();
      unsubDelete();
      unsubAddLink();
      unsubDeleteLink();
      unsubSelect();
    };
  }, [apiRef.current, projectId, onTaskSelect, onTaskUpdate]);

  // Add new task function (for button and keyboard shortcut)
  const addNewTask = () => {
    if (!apiRef.current) return;

    const api = apiRef.current;
    const state = api.getState();

    // Get selected task to check if we should create a subtask
    const selectedId = state.selected;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newTask = {
      id: Date.now(), // Temporary ID
      text: 'New Task',
      start: today,
      end: tomorrow,
      duration: 1,
      progress: 0,
      type: 'task',
      parent: selectedId || 0,
    };

    // Use exec to add task through the proper channels
    api.exec('add-task', { task: newTask, mode: 'child' });
  };

  // Manual recalculate dependencies function
  const recalculateDependencies = () => {
    if (autoScheduling) {
      loadTasks();
      toast.success('Tasks reloaded - dependencies recalculated');
    } else {
      toast.error('Auto-scheduling is disabled for this project');
    }
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        addNewTask();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [apiRef.current]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="gantt-container">
      <div
        className="gantt-toolbar"
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #E4E7EB',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          backgroundColor: '#FAFBFC',
        }}
      >
        <button
          onClick={addNewTask}
          className="gantt-btn gantt-btn-primary"
          style={{
            padding: '8px 16px',
            backgroundColor: '#6366F1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title="Add new task (Ctrl+Enter)"
        >
          <span>➕</span> Add Task
        </button>
        <button
          onClick={recalculateDependencies}
          disabled={!autoScheduling}
          className="gantt-btn gantt-btn-secondary"
          style={{
            padding: '8px 16px',
            backgroundColor: autoScheduling ? '#10B981' : '#D1D5DB',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: autoScheduling ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: autoScheduling ? 1 : 0.6,
          }}
          title={autoScheduling ? 'Recalculate all dependencies' : 'Auto-scheduling is disabled'}
        >
          <span>🔄</span> Recalculate
        </button>
        <div style={{ fontSize: '13px', color: '#6B7280', marginLeft: 'auto' }}>
          {autoScheduling && <span style={{ color: '#10B981', fontWeight: '500' }}>● Auto-scheduling enabled</span>}
          {!autoScheduling && <span style={{ color: '#9CA3AF' }}>○ Auto-scheduling disabled</span>}
          <span style={{ marginLeft: '12px', color: '#9CA3AF' }}>• Ctrl+Enter to add task</span>
        </div>
      </div>
      <div style={{ width: '100%', height: 'calc(100vh - 380px)' }}>
        <Gantt
          tasks={tasks}
          links={links}
          columns={columns}
          scales={scales}
          init={(api) => {
            apiRef.current = api;
          }}
        />
      </div>
    </div>
  );
};

export default GanttChart;
