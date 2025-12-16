/**
 * useUpdateMemberRole Hook
 * Mutation hook for updating a firm member's role (admin only)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface UpdateMemberRoleParams {
  targetUid: string;
  newRole: 'lawyer' | 'paralegal';
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const { firmId } = useAuth();

  return useMutation({
    mutationFn: async ({ targetUid, newRole }: UpdateMemberRoleParams) => {
      if (!firmId) {
        throw new Error('No firm ID available');
      }
      const response = await apiClient.updateMemberRole(firmId, targetUid, newRole);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update role');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['firmMembers', firmId] });
      queryClient.invalidateQueries({ queryKey: ['firm', firmId] });
    },
  });
}
