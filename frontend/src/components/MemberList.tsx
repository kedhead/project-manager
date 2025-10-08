import { useState } from 'react';
import { Crown, Shield, User, Eye, Trash2 } from 'lucide-react';
import { ProjectMember } from '../api/projects';
import { formatDistanceToNow } from 'date-fns';

interface MemberListProps {
  members: ProjectMember[];
  currentUserId: number;
  canManage: boolean;
  onUpdateRole: (memberId: number, newRole: 'owner' | 'manager' | 'member' | 'viewer') => void;
  onRemove: (memberId: number) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  currentUserId,
  canManage,
  onUpdateRole,
  onRemove,
}) => {
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);

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

  const getInitials = (name: string) => {
    if (!name) return '??';
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

  const handleRoleChange = async (member: ProjectMember, newRole: 'owner' | 'manager' | 'member' | 'viewer') => {
    setUpdatingMemberId(member.id);
    try {
      await onUpdateRole(member.id, newRole);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemove = async (member: ProjectMember) => {
    if (!confirm(`Remove ${member.user_name || 'this user'} from this project?`)) return;

    setRemovingMemberId(member.id);
    try {
      await onRemove(member.id);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const canUpdateMember = (member: ProjectMember) => {
    // Can't update yourself or if you don't have manage permissions
    if (!canManage || member.user_id === currentUserId) return false;
    // Can't demote the only owner
    if (member.role === 'owner') {
      const ownerCount = members.filter(m => m.role === 'owner').length;
      if (ownerCount <= 1) return false;
    }
    return true;
  };

  const canRemoveMember = (member: ProjectMember) => {
    // Can't remove yourself or if you don't have manage permissions
    if (!canManage || member.user_id === currentUserId) return false;
    // Can't remove the only owner
    if (member.role === 'owner') {
      const ownerCount = members.filter(m => m.role === 'owner').length;
      if (ownerCount <= 1) return false;
    }
    return true;
  };

  return (
    <div className="divide-y divide-gray-200">
      {members.map((member) => (
        <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full ${getAvatarColor(member.user_id)} flex items-center justify-center text-white font-medium`}>
                {getInitials(member.user_name)}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{member.user_name || 'Unknown User'}</h3>
                  {member.user_id === currentUserId && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">You</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{member.user_email || 'No email'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Role and Actions */}
            <div className="flex items-center gap-3">
              {canUpdateMember(member) ? (
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member, e.target.value as any)}
                  disabled={updatingMemberId === member.id}
                  className="text-sm border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              ) : (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getRoleColor(member.role)}`}>
                  {getRoleIcon(member.role)}
                  <span className="text-sm font-medium capitalize">{member.role}</span>
                </div>
              )}

              {canRemoveMember(member) && (
                <button
                  onClick={() => handleRemove(member)}
                  disabled={removingMemberId === member.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove member"
                >
                  {removingMemberId === member.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MemberList;
