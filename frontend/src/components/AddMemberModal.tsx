import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { projectsApi } from '../api/projects';
import toast from 'react-hot-toast';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: number;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'manager' | 'member' | 'viewer'>('member');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await projectsApi.addMember(projectId, email.trim(), role);
      toast.success('Member added successfully');
      onSuccess();
      handleClose();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add member';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('member');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UserPlus size={20} />
            Add Team Member
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="colleague@company.com"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              The user must have an account with this email address
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="input"
            >
              <option value="viewer">Viewer - Read-only access</option>
              <option value="member">Member - Can edit tasks</option>
              <option value="manager">Manager - Can manage members</option>
              <option value="owner">Owner - Full access</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              You can change the role later
            </p>
          </div>

          {/* Role Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Role Permissions:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {role === 'owner' && (
                <>
                  <li>• Full access to project settings</li>
                  <li>• Can manage all members</li>
                  <li>• Can delete project</li>
                  <li>• Can create and edit tasks</li>
                </>
              )}
              {role === 'manager' && (
                <>
                  <li>• Can manage members</li>
                  <li>• Can modify project settings</li>
                  <li>• Can create and edit tasks</li>
                  <li>• Cannot delete project</li>
                </>
              )}
              {role === 'member' && (
                <>
                  <li>• Can create and edit tasks</li>
                  <li>• Can add comments and files</li>
                  <li>• Cannot manage members</li>
                  <li>• Cannot modify project settings</li>
                </>
              )}
              {role === 'viewer' && (
                <>
                  <li>• Read-only access</li>
                  <li>• Can view tasks and comments</li>
                  <li>• Cannot make any changes</li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex-1"
            >
              {isLoading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
