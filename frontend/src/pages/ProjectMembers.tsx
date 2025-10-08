import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Crown, Shield, User, Eye } from 'lucide-react';
import { projectsApi, Project, ProjectMember } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import AddMemberModal from '../components/AddMemberModal';
import MemberList from '../components/MemberList';
import toast from 'react-hot-toast';

export const ProjectMembers = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadProject();
    loadMembers();
  }, [id]);

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

  const loadMembers = async () => {
    try {
      if (!id) return;
      setIsLoading(true);
      const data = await projectsApi.getMembers(Number(id));
      setMembers(data);
    } catch (error: any) {
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = () => {
    loadMembers();
    setIsAddModalOpen(false);
  };

  const handleUpdateRole = async (memberId: number, newRole: 'owner' | 'manager' | 'member' | 'viewer') => {
    try {
      if (!id) return;
      await projectsApi.updateMemberRole(Number(id), memberId, newRole);
      toast.success('Member role updated');
      loadMembers();
    } catch (error: any) {
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      if (!id) return;
      await projectsApi.removeMember(Number(id), memberId);
      toast.success('Member removed');
      loadMembers();
    } catch (error: any) {
      toast.error('Failed to remove member');
    }
  };

  const canManageMembers = project?.user_role === 'owner' || project?.user_role === 'manager';

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} />;
      case 'manager':
        return <Shield size={16} />;
      case 'member':
        return <User size={16} />;
      case 'viewer':
        return <Eye size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleStats = () => {
    const stats = {
      owner: members.filter(m => m.role === 'owner').length,
      manager: members.filter(m => m.role === 'manager').length,
      member: members.filter(m => m.role === 'member').length,
      viewer: members.filter(m => m.role === 'viewer').length,
    };
    return stats;
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const roleStats = getRoleStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/projects/${id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
                <p className="text-sm text-gray-600 mt-1">{project.name}</p>
              </div>
            </div>
            {canManageMembers && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <UserPlus size={20} />
                Add Member
              </button>
            )}
          </div>

          {/* Role Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Crown size={16} />
                <span className="text-sm font-medium">Owners</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{roleStats.owner}</div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Shield size={16} />
                <span className="text-sm font-medium">Managers</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{roleStats.manager}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <User size={16} />
                <span className="text-sm font-medium">Members</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{roleStats.member}</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Eye size={16} />
                <span className="text-sm font-medium">Viewers</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{roleStats.viewer}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Members ({members.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage team members and their permissions
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <MemberList
              members={members}
              currentUserId={user?.id || 0}
              canManage={canManageMembers}
              onUpdateRole={handleUpdateRole}
              onRemove={handleRemoveMember}
            />
          )}
        </div>

        {/* Role Descriptions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getRoleColor('owner')}`}>
                {getRoleIcon('owner')}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Owner</h4>
                <p className="text-sm text-gray-600">
                  Full access to project. Can manage members, delete project, and modify all settings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getRoleColor('manager')}`}>
                {getRoleIcon('manager')}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Manager</h4>
                <p className="text-sm text-gray-600">
                  Can manage tasks, add/remove members, and modify project settings. Cannot delete project.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getRoleColor('member')}`}>
                {getRoleIcon('member')}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Member</h4>
                <p className="text-sm text-gray-600">
                  Can create and edit tasks, add comments and files. Cannot manage members or project settings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${getRoleColor('viewer')}`}>
                {getRoleIcon('viewer')}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Viewer</h4>
                <p className="text-sm text-gray-600">
                  Read-only access. Can view tasks, comments, and files but cannot make changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddMember}
        projectId={Number(id)}
      />
    </div>
  );
};

export default ProjectMembers;
