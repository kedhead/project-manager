import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, UserPlus, UserMinus } from 'lucide-react';
import { groupsApi, Group, CreateGroupData } from '../api/groups';
import { ProjectMember } from '../api/projects';
import toast from 'react-hot-toast';

interface GroupsManagementProps {
  projectId: number;
  members: ProjectMember[];
  onClose: () => void;
}

export const GroupsManagement: React.FC<GroupsManagementProps> = ({
  projectId,
  members,
  onClose,
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [projectId]);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const data = await groupsApi.list(projectId);
      setGroups(data);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (data: CreateGroupData) => {
    try {
      const newGroup = await groupsApi.create(projectId, data);
      setGroups([newGroup, ...groups]);
      setShowCreateModal(false);
      toast.success('Group created successfully');
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const handleUpdateGroup = async (id: number, data: CreateGroupData) => {
    try {
      const updated = await groupsApi.update(id, data);
      setGroups(groups.map(g => g.id === id ? updated : g));
      setShowEditModal(false);
      setSelectedGroup(null);
      toast.success('Group updated successfully');
    } catch (error) {
      toast.error('Failed to update group');
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Are you sure you want to delete this group? Tasks assigned to this group will be unassigned.')) {
      return;
    }

    try {
      await groupsApi.delete(id);
      setGroups(groups.filter(g => g.id !== id));
      toast.success('Group deleted successfully');
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const handleViewMembers = async (group: Group) => {
    try {
      const fullGroup = await groupsApi.get(group.id);
      setSelectedGroup(fullGroup);
      setShowMembersModal(true);
    } catch (error) {
      toast.error('Failed to load group members');
    }
  };

  const handleAddMember = async (userId: number) => {
    if (!selectedGroup) return;

    try {
      await groupsApi.addMember(selectedGroup.id, userId);
      const updated = await groupsApi.get(selectedGroup.id);
      setSelectedGroup(updated);
      setGroups(groups.map(g => g.id === updated.id ? { ...g, member_count: updated.member_count } : g));
      toast.success('Member added successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (membershipId: number) => {
    if (!selectedGroup) return;

    try {
      await groupsApi.removeMember(selectedGroup.id, membershipId);
      const updated = await groupsApi.get(selectedGroup.id);
      setSelectedGroup(updated);
      setGroups(groups.map(g => g.id === updated.id ? { ...g, member_count: updated.member_count } : g));
      toast.success('Member removed successfully');
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-primary-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Groups</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              New Group
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No groups created yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                Create Your First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-primary-600 rounded"
                        title="Edit group"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-2 text-gray-600 hover:text-red-600 rounded"
                        title="Delete group"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                    </span>
                    <button
                      onClick={() => handleViewMembers(group)}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Manage Members
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Group Modal */}
      {(showCreateModal || showEditModal) && (
        <GroupFormModal
          group={showEditModal ? selectedGroup : null}
          onSave={(data) => {
            if (showEditModal && selectedGroup) {
              handleUpdateGroup(selectedGroup.id, data);
            } else {
              handleCreateGroup(data);
            }
          }}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedGroup(null);
          }}
        />
      )}

      {/* Manage Members Modal */}
      {showMembersModal && selectedGroup && (
        <MembersModal
          group={selectedGroup}
          projectMembers={members}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedGroup(null);
          }}
        />
      )}
    </div>
  );
};

// Group Form Modal Component
interface GroupFormModalProps {
  group: Group | null;
  onSave: (data: CreateGroupData) => void;
  onClose: () => void;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({ group, onSave, onClose }) => {
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [color, setColor] = useState(group?.color || '#3B82F6');
  const colors = groupsApi.getDefaultColors();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, color });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {group ? 'Edit Group' : 'Create New Group'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g., Frontend Team"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={3}
              placeholder="Describe the purpose of this group..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    color === c ? 'border-gray-900 scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {group ? 'Update' : 'Create'} Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Members Modal Component
interface MembersModalProps {
  group: Group;
  projectMembers: ProjectMember[];
  onAddMember: (userId: number) => void;
  onRemoveMember: (membershipId: number) => void;
  onClose: () => void;
}

const MembersModal: React.FC<MembersModalProps> = ({
  group,
  projectMembers,
  onAddMember,
  onRemoveMember,
  onClose,
}) => {
  const groupMemberIds = new Set(group.members?.map(m => m.user_id) || []);
  const availableMembers = projectMembers.filter(m => !groupMemberIds.has(m.user_id));

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Manage Members</h3>
            <p className="text-sm text-gray-600 mt-1">{group.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Current Members */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Current Members ({group.members?.length || 0})
            </h4>
            {group.members && group.members.length > 0 ? (
              <div className="space-y-2">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                        {getInitials(member.user_name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.user_name}</p>
                        <p className="text-sm text-gray-600">{member.user_email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      className="p-2 text-gray-600 hover:text-red-600 rounded"
                      title="Remove from group"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No members in this group yet</p>
            )}
          </div>

          {/* Available Members to Add */}
          {availableMembers.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Add Members ({availableMembers.length} available)
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableMembers.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-semibold">
                        {getInitials(member.user_name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.user_name}</p>
                        <p className="text-sm text-gray-600">{member.user_email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onAddMember(member.user_id)}
                      className="p-2 text-primary-600 hover:text-primary-700 rounded"
                      title="Add to group"
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupsManagement;
