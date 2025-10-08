import { Link } from 'react-router-dom';
import { Calendar, Users, CheckSquare, MoreVertical } from 'lucide-react';
import { Project } from '../api/projects';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: number) => void;
}

const statusColors = {
  planning: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const roleColors = {
  owner: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  member: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const formatDate = (date: string | null) => {
    if (!date) return 'Not set';
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            // TODO: Show dropdown menu
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[project.status]}`}>
          {project.status.replace('_', ' ')}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[project.user_role]}`}>
          {project.user_role}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={16} />
          <span>{formatDate(project.start_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Users size={16} />
          <span>{project.member_count} members</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <CheckSquare size={16} />
          <span>{project.task_count} tasks</span>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
