import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to fetch all members of the current firm
 * Returns array of { uid, name, email, role }
 */
export function useFirmMembers() {
  const { user, firmId } = useAuth();

  return useQuery({
    queryKey: ['firmMembers', firmId],
    queryFn: async () => {
      if (!firmId) {
        throw new Error('No firm ID available');
      }
      const response = await apiClient.getFirmMembers(firmId);
      
      // Convert members object to array
      const membersArray = Object.entries(response.members || {}).map(([uid, member]: any) => ({
        uid,
        ...member,
      }));
      
      return membersArray;
    },
    enabled: !!firmId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

