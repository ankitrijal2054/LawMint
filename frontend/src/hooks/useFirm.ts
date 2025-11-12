import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to fetch firm data (name, code, etc.)
 * Returns { id, name, firmCode, createdBy, createdAt, updatedAt, memberCount }
 */
export function useFirm() {
  const { user, firmId } = useAuth();

  return useQuery({
    queryKey: ['firm', firmId],
    queryFn: async () => {
      if (!firmId) {
        console.warn('[useFirm] No firmId available');
        return null;
      }

      try {
        const response = await apiClient.getFirm(firmId);

        if (!response.success) {
          console.error('[useFirm] API returned success: false', response.error);
          throw new Error(response.error || 'Failed to fetch firm data');
        }

        const firmData = response.data;

        if (!firmData) {
          console.warn('[useFirm] No firm data in response');
          return null;
        }

        console.log(`[useFirm] ✅ Loaded firm: ${firmData.name} (${firmData.firmCode})`);
        return firmData;
      } catch (error: any) {
        console.error('[useFirm] ❌ Error fetching firm:', error.message, error);
        throw error;
      }
    },
    enabled: !!firmId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

