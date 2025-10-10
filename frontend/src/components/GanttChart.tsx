import { useEffect, useRef } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { tasksApi, Task, TaskDependency } from '../api/tasks';
import toast from 'react-hot-toast';

interface GanttChartProps {
  projectId: number;
  onTaskSelect?: (taskId: number) => void;
  onTaskUpdate?: () => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  projectId,
  onTaskSelect,
  onTaskUpdate,
}) => {
  const ganttContainer = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!ganttContainer.current || isInitialized.current) return;

    // Initialize Gantt chart
    gantt.config.date_format = '%Y-%m-%d %H:%i';
    gantt.config.xml_date = '%Y-%m-%d';
    gantt.config.scale_unit = 'day';
    gantt.config.date_scale = '%d %M';
    gantt.config.subscales = [
      { unit: 'month', step: 1, date: '%F %Y' }
    ];
    gantt.config.min_column_width = 50;
    gantt.config.scale_height = 60;
    gantt.config.row_height = 38;
    gantt.config.auto_scheduling = true;
    gantt.config.auto_scheduling_strict = true;
    gantt.config.drag_links = true;
    gantt.config.drag_progress = true;
    gantt.config.drag_resize = true;
    gantt.config.drag_move = true;
    gantt.config.details_on_dblclick = true;
    gantt.config.order_branch = true;
    gantt.config.order_branch_free = true;
    gantt.config.fit_tasks = true; // Auto-fit timeline to tasks

    // Configure columns - Professional PM layout matching reference
    gantt.config.columns = [
      {
        name: 'wbs',
        label: 'WBS',
        width: 50,
        align: 'center',
        resize: true,
        template: (task: any) => {
          return task.$index + 1;
        }
      },
      {
        name: 'text',
        label: 'TASK NAME',
        tree: true,
        width: 240,
        resize: true
      },
      {
        name: 'start_date',
        label: 'PLANNED START DATE',
        align: 'center',
        width: 140,
        resize: true,
        template: (task: any) => {
          return task.start_date ? gantt.date.date_to_str('%m/%d/%Y')(task.start_date) : '';
        }
      },
      {
        name: 'duration',
        label: 'DURATION',
        align: 'center',
        width: 80,
        resize: true,
        template: (task: any) => {
          return task.duration ? `${task.duration} day${task.duration !== 1 ? 's' : ''}` : '';
        }
      },
      {
        name: 'status',
        label: 'STATUS',
        align: 'center',
        width: 110,
        resize: true,
        template: (task: any) => {
          const statusColors: Record<string, string> = {
            not_started: '#6B7280',
            in_progress: '#3B82F6',
            completed: '#10B981',
            blocked: '#EF4444',
            cancelled: '#9CA3AF'
          };
          const statusLabels: Record<string, string> = {
            not_started: 'Not Started',
            in_progress: 'In Progress',
            completed: 'Completed',
            blocked: 'Blocked',
            cancelled: 'Cancelled'
          };
          const color = statusColors[task.status] || '#6B7280';
          const label = statusLabels[task.status] || task.status;
          return `<span style="color: ${color}; font-weight: 500;">${label}</span>`;
        }
      },
      {
        name: 'assigned_user_name',
        label: 'ASSIGNED TO',
        align: 'left',
        width: 150,
        resize: true,
        template: (task: any) => task.assigned_user_name || 'Unassigned'
      }
    ];

    // Configure task templates
    gantt.templates.task_class = (start, end, task) => {
      const statusClasses: Record<string, string> = {
        todo: 'gantt-task-todo',
        in_progress: 'gantt-task-in-progress',
        completed: 'gantt-task-completed',
        blocked: 'gantt-task-blocked',
        cancelled: 'gantt-task-cancelled'
      };
      return statusClasses[task.status] || '';
    };

    // Enhanced timeline bar text - show task name, progress, and assignee
    gantt.templates.task_text = (start, end, task) => {
      const progress = Math.round(task.progress * 100);
      const assignee = task.assigned_user_name || '';
      return `<div style="padding: 0 8px; display: flex; align-items: center; justify-content: space-between; width: 100%; height: 100%;">
        <span style="font-weight: 500;">${task.text}</span>
        <span style="font-weight: 600;">${progress}%</span>
        ${assignee ? `<span style="font-size: 11px; opacity: 0.9;">${assignee}</span>` : ''}
      </div>`;
    };

    gantt.templates.progress_text = (start, end, task) => {
      return ''; // Hide the default progress text as we're showing it in task_text
    };

    gantt.templates.link_class = (link) => {
      const types: Record<number, string> = {
        0: 'finish_to_start',
        1: 'start_to_start',
        2: 'finish_to_finish',
        3: 'start_to_finish'
      };
      return `gantt-link-${types[link.type] || 'finish_to_start'}`;
    };

    // Initialize the Gantt chart
    gantt.init(ganttContainer.current);
    isInitialized.current = true;

    // Load data
    loadTasks();

    // Event handlers
    const onAfterTaskUpdate = async (id: string, task: any) => {
      try {
        // Ensure progress is an integer 0-100
        const progressValue = typeof task.progress === 'number'
          ? Math.round(Math.max(0, Math.min(1, task.progress)) * 100)
          : 0;

        await tasksApi.update(Number(id), {
          title: task.text,
          startDate: gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
          endDate: gantt.date.date_to_str('%Y-%m-%d')(task.end_date),
          duration: task.duration,
          progress: progressValue,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assigned_to ? Number(task.assigned_to) : null,
          parentTaskId: task.parent || null
        });
        if (onTaskUpdate) onTaskUpdate();
        toast.success('Task updated successfully');
      } catch (error) {
        toast.error('Failed to update task');
        loadTasks(); // Reload to revert changes
      }
    };

    const onAfterTaskAdd = async (id: string, task: any) => {
      try {
        const newTask = await tasksApi.create(projectId, {
          title: task.text || 'New Task',
          startDate: gantt.date.date_to_str('%Y-%m-%d')(task.start_date),
          endDate: gantt.date.date_to_str('%Y-%m-%d')(task.end_date),
          duration: task.duration,
          status: 'not_started',
          priority: 'medium',
          parentTaskId: task.parent || undefined
        });
        gantt.changeTaskId(id, newTask.id.toString());
        if (onTaskUpdate) onTaskUpdate();
        toast.success('Task created successfully');
      } catch (error) {
        toast.error('Failed to create task');
        gantt.deleteTask(id);
      }
    };

    const onAfterTaskDelete = async (id: string) => {
      try {
        await tasksApi.delete(Number(id));
        if (onTaskUpdate) onTaskUpdate();
        toast.success('Task deleted successfully');
      } catch (error) {
        toast.error('Failed to delete task');
        loadTasks(); // Reload to restore task
      }
    };

    const onAfterLinkAdd = async (id: string, link: any) => {
      try {
        const types = ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'] as const;
        await tasksApi.addDependency(
          Number(link.target),
          Number(link.source),
          types[link.type] || 'finish_to_start',
          0
        );
        if (onTaskUpdate) onTaskUpdate();
        toast.success('Dependency added successfully');
      } catch (error) {
        toast.error('Failed to add dependency');
        gantt.deleteLink(id);
      }
    };

    const onAfterLinkDelete = async (id: string, link: any) => {
      try {
        await tasksApi.removeDependency(Number(link.target), Number(id));
        if (onTaskUpdate) onTaskUpdate();
        toast.success('Dependency removed successfully');
      } catch (error) {
        toast.error('Failed to remove dependency');
        loadTasks(); // Reload to restore link
      }
    };

    const onTaskSelected = (id: string) => {
      if (onTaskSelect) {
        onTaskSelect(Number(id));
      }
    };

    // Attach event handlers
    gantt.attachEvent('onAfterTaskUpdate', onAfterTaskUpdate);
    gantt.attachEvent('onAfterTaskAdd', onAfterTaskAdd);
    gantt.attachEvent('onAfterTaskDelete', onAfterTaskDelete);
    gantt.attachEvent('onAfterLinkAdd', onAfterLinkAdd);
    gantt.attachEvent('onAfterLinkDelete', onAfterLinkDelete);
    gantt.attachEvent('onTaskSelected', onTaskSelected);

    // Cleanup
    return () => {
      gantt.clearAll();
    };
  }, [projectId]);

  const loadTasks = async () => {
    try {
      const tasks = await tasksApi.list(projectId);

      // Transform tasks to Gantt format
      const ganttTasks = tasks.map((task: Task) => ({
        id: task.id.toString(),
        text: task.title,
        start_date: task.start_date ? gantt.date.parseDate(task.start_date, 'xml_date') : new Date(),
        end_date: task.end_date ? gantt.date.parseDate(task.end_date, 'xml_date') : null,
        duration: task.duration || 1,
        progress: task.progress / 100, // Convert from 0-100 to 0-1 for Gantt
        status: task.status,
        priority: task.priority,
        parent: task.parent_task_id?.toString() || 0,
        assigned_to: task.assigned_to,
        assigned_user_name: task.assigned_user_name,
        assigned_user_email: task.assigned_user_email,
        open: true
      }));

      // Transform dependencies to Gantt links
      const ganttLinks: any[] = [];
      tasks.forEach((task: Task) => {
        if (task.dependencies && task.dependencies.length > 0) {
          task.dependencies.forEach((dep: TaskDependency) => {
            const typeMap: Record<string, number> = {
              finish_to_start: 0,
              start_to_start: 1,
              finish_to_finish: 2,
              start_to_finish: 3
            };
            ganttLinks.push({
              id: dep.id.toString(),
              source: dep.depends_on_task_id.toString(),
              target: task.id.toString(),
              type: typeMap[dep.dependency_type] || 0,
              lag: dep.lag_time || 0
            });
          });
        }
      });

      // Parse data into Gantt
      gantt.parse({
        data: ganttTasks,
        links: ganttLinks
      });

      // Auto-zoom to fit tasks with some padding
      if (ganttTasks.length > 0) {
        const dates = ganttTasks
          .filter(t => t.start_date && t.end_date)
          .flatMap(t => [t.start_date, t.end_date]);

        if (dates.length > 0) {
          const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

          // Add 1 week padding on each side
          minDate.setDate(minDate.getDate() - 7);
          maxDate.setDate(maxDate.getDate() + 7);

          gantt.config.start_date = minDate;
          gantt.config.end_date = maxDate;
          gantt.render();
        }
      }
    } catch (error) {
      toast.error('Failed to load tasks');
    }
  };

  return (
    <div className="gantt-container">
      <div ref={ganttContainer} style={{ width: '100%', height: '600px' }} />
    </div>
  );
};

export default GanttChart;
