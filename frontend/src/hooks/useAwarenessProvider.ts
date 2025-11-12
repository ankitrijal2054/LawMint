import { useEffect, useRef, useMemo } from 'react';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { ref, onValue, off, set } from 'firebase/database';
import { rtdb } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface UseAwarenessProviderProps {
  ydoc: Y.Doc | null;
  documentId: string;
  userName: string;
  userColor: string;
  enabled?: boolean;
}

/**
 * Custom hook to provide Awareness protocol for Y.js over Firebase
 * Tracks user presence and cursor positions
 */
export const useAwarenessProvider = ({
  ydoc,
  documentId,
  userName,
  userColor,
  enabled = true,
}: UseAwarenessProviderProps) => {
  const { user } = useAuth();
  const awarenessRef = useRef<Awareness | null>(null);

  // Create awareness instance synchronously (not in useEffect)
  // This ensures it's available when TipTap editor is created
  const awareness = useMemo(() => {
    if (!enabled || !ydoc || !documentId || !user) {
      return null;
    }

    // Create awareness instance
    const newAwareness = new Awareness(ydoc);
    awarenessRef.current = newAwareness;

    // Set local awareness state
    newAwareness.setLocalState({
      user: {
        name: userName,
        color: userColor,
      },
    });

    return newAwareness;
  }, [enabled, ydoc, documentId, user, userName, userColor]);

  // Handle Firebase sync in useEffect (side effects)
  useEffect(() => {
    if (!awareness || !documentId || !user) {
      return;
    }

    const awarenessDbRef = ref(rtdb, `collaboration/${documentId}/awareness`);

    // Broadcast local awareness changes to Firebase
    const awarenessChangeHandler = () => {
      set(ref(rtdb, `collaboration/${documentId}/awareness/${user.uid}`), {
        clientId: ydoc?.clientID,
        user: {
          name: userName,
          color: userColor,
        },
        timestamp: Date.now(),
      }).catch((error) => {
        console.error('Error updating awareness:', error);
      });
    };

    awareness.on('change', awarenessChangeHandler);

    // Listen for remote awareness changes
    const unsubscribe = onValue(awarenessDbRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const remoteStates = snapshot.val();
      Object.entries(remoteStates || {}).forEach(([userId, state]: [string, any]) => {
        // Don't update our own state
        if (userId === user.uid) return;

        // Update awareness with remote user state (if valid)
        if (state.clientId && ydoc && state.clientId !== ydoc.clientID) {
          // Remote user state update
          console.log('👥 Remote user:', state.user?.name);
        }
      });
    });

    // Heartbeat to keep presence alive
    const heartbeatInterval = setInterval(() => {
      set(ref(rtdb, `collaboration/${documentId}/awareness/${user.uid}`), {
        clientId: ydoc?.clientID,
        user: {
          name: userName,
          color: userColor,
        },
        timestamp: Date.now(),
      }).catch(console.error);
    }, 10000); // Every 10 seconds

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
      awareness.off('change', awarenessChangeHandler);
      off(awarenessDbRef);
      
      // Remove our presence
      set(ref(rtdb, `collaboration/${documentId}/awareness/${user.uid}`), null).catch(console.error);
      
      // Don't destroy awareness here - it's managed by useMemo
    };
  }, [awareness, documentId, user, userName, userColor, ydoc]);

  return awareness;
};
