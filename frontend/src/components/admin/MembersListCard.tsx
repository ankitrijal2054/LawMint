/**
 * MembersListCard Component
 * Displays all firm members with role management for the Admin Dashboard
 */

import { Users, Loader2 } from 'lucide-react';
import { useFirmMembers } from '@/hooks/useFirmMembers';
import { useUpdateMemberRole } from '@/hooks/useUpdateMemberRole';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export function MembersListCard() {
  const { user } = useAuth();
  const { data: membersData, isLoading, error } = useFirmMembers();
  const updateRoleMutation = useUpdateMemberRole();

  // Transform members data into array
  const members = membersData?.members
    ? Object.entries(membersData.members).map(([uid, member]) => ({
        uid,
        ...member,
      }))
    : [];

  // Sort: admin first, then alphabetically by name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return a.name.localeCompare(b.name);
  });

  const handleRoleChange = async (targetUid: string, newRole: 'lawyer' | 'paralegal') => {
    try {
      await updateRoleMutation.mutateAsync({ targetUid, newRole });
      toast.success('Role updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'lawyer':
        return 'bg-blue-100 text-blue-700';
      case 'paralegal':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-center text-red-600">
          Failed to load team members. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Team Members</h3>
            <p className="text-sm text-slate-600">
              {isLoading ? 'Loading...' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                </td>
              </tr>
            ) : sortedMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No team members found.
                </td>
              </tr>
            ) : (
              sortedMembers.map((member) => (
                <tr key={member.uid} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">{member.name}</span>
                    {member.uid === user?.uid && (
                      <span className="ml-2 text-xs text-slate-500">(You)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {member.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${getRoleBadgeClasses(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {member.role !== 'admin' && member.uid !== user?.uid ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.uid, e.target.value as 'lawyer' | 'paralegal')
                        }
                        disabled={updateRoleMutation.isPending}
                        className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="lawyer">Lawyer</option>
                        <option value="paralegal">Paralegal</option>
                      </select>
                    ) : member.role === 'admin' ? (
                      <span className="text-xs text-slate-400">Admin role cannot be changed</span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
