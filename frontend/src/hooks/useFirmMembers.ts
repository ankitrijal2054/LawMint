import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to fetch all members of the current firm (excluding current user)
 * Returns array of { uid, name, email, role }
 */
export function useFirmMembers() {
  const { user, firmId } = useAuth();

  return useQuery({
    queryKey: ['firmMembers', firmId, user?.uid],
    queryFn: async () => {
      if (!firmId) {
        console.warn('[useFirmMembers] No firmId available');
        return [];
      }

      if (!user?.uid) {
        console.warn('[useFirmMembers] No user available');
        return [];
      }

      try {
        const response = await apiClient.getFirmMembers(firmId);
        
        if (!response.success) {
          console.error('[useFirmMembers] API returned success: false', response.error);
          throw new Error(response.error || 'Failed to fetch firm members');
        }

        // Response structure: { success: true, data: { members: {...} } }
        const membersObject = response.data?.members;
        
        if (!membersObject || typeof membersObject !== 'object') {
          console.warn('[useFirmMembers] No members data in response', { membersObject });
          return [];
        }

        // Convert members object to array, excluding current user
        const membersArray = Object.entries(membersObject)
          .filter(([uid]) => uid !== user.uid) // Exclude current user
          .map(([uid, member]: any) => ({
            uid,
            name: member.name || 'Unknown',
            email: member.email || 'N/A',
            role: member.role || 'member',
            joinedAt: member.joinedAt,
          }))
          .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '')); // Sort by name
        
        console.log(`[useFirmMembers] ✅ Loaded ${membersArray.length} members for firm ${firmId}`);
        return membersArray;
      } catch (error: any) {
        console.error('[useFirmMembers] ❌ Error fetching firm members:', error.message, error);
        throw error;
      }
    },
    enabled: !!firmId && !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

