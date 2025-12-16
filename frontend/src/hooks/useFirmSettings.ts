/**
 * useFirmSettings Hook
 * Query hook for firm settings and mutation for setting API key
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to fetch firm settings (admin only)
 */
export function useFirmSettings() {
  const { firmId, user } = useAuth();

  return useQuery({
    queryKey: ['firmSettings', firmId],
    queryFn: async () => {
      if (!firmId) return null;
      const response = await apiClient.getFirmSettings(firmId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch firm settings');
      }
      return response.data;
    },
    enabled: !!firmId && user?.role === 'admin',
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to set/update firm's OpenAI API key (admin only)
 */
export function useSetApiKey() {
  const queryClient = useQueryClient();
  const { firmId } = useAuth();

  return useMutation({
    mutationFn: async ({ apiKey }: { apiKey: string }) => {
      if (!firmId) {
        throw new Error('No firm ID available');
      }
      const response = await apiClient.setFirmApiKey(firmId, apiKey);
      if (!response.success) {
        throw new Error(response.error || 'Failed to save API key');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate firm settings to refetch
      queryClient.invalidateQueries({ queryKey: ['firmSettings', firmId] });
    },
  });
}
