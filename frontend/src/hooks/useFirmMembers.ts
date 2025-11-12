import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to fetch all members of the current firm (excluding current user)
 * Returns array of { uid, name, email, role }
 */
export function useFirmMembers() {
  // @ts-ignore
  const { user, firmId } = useAuth();

  return useQuery({
    queryKey: ['firmMembers', firmId, user?.uid],
    queryFn: async () => {
      if (!firmId) {
        throw new Error('No firm ID available');
      }
      try {
        const response = await apiClient.getFirmMembers(firmId);
        
        // Convert members object to array, excluding current user
        // @ts-ignore
        const membersArray = Object.entries(response.members || {})
          .filter(([uid]) => uid !== user?.uid) // Exclude current user
          .map(([uid, member]: any) => ({
            uid,
            ...member,
          }))
          .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '')); // Sort by name
        
        console.log(`[useFirmMembers] Loaded ${membersArray.length} members for firm ${firmId}`);
        return membersArray;
      } catch (error) {
        console.error('[useFirmMembers] Error fetching firm members:', error);
        throw error;
      }
    },
    enabled: !!firmId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

