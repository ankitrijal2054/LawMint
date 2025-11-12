import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { ref, onValue, off, set, push } from 'firebase/database';
import { rtdb } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface UseCollaborativeEditorProps {
  documentId: string;
  enabled?: boolean;
}

/**
 * Custom hook for Y.js collaborative editing with Firebase Realtime Database
 * Uses proper Y.js update protocol with incremental syncing
 */
export const useCollaborativeEditor = ({
  documentId,
  enabled = true,
}: UseCollaborativeEditorProps) => {
  const { user } = useAuth();
  const ydoc = useRef<Y.Doc | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !documentId || !user) {
      return;
    }

    let mounted = true;

    const initialize = async () => {
      try {
        // Create Y.js document
        const doc = new Y.Doc();
        ydoc.current = doc;

        const updatesRef = ref(rtdb, `collaboration/${documentId}/updates`);
        const syncedUpdatesRef = ref(rtdb, `collaboration/${documentId}/syncedUpdates`);

        console.log('🔄 Initializing Y.js collaborative editing for document:', documentId);
        console.log('📍 Database instance:', rtdb);
        console.log('📍 Updates path:', `collaboration/${documentId}/updates`);

        // Load all previous updates from Firebase
        const loadInitialState = async () => {
          try {
            const snapshot = await new Promise<any>((resolve) => {
              onValue(syncedUpdatesRef, (snap) => {
                resolve(snap);
              }, { onlyOnce: true });
            });

            if (snapshot.exists()) {
              const updates = snapshot.val();
              const updateArray = Object.values(updates || {}) as any[];
              
              // Apply all updates in order
              updateArray
                .sort((a, b) => a.timestamp - b.timestamp)
                .forEach((update) => {
                  try {
                    const updateData = new Uint8Array(Object.values(update.update));
                    Y.applyUpdate(doc, updateData);
                  } catch (error) {
                    console.error('Error applying update:', error);
                  }
                });

              console.log(`✅ Loaded ${updateArray.length} previous updates`);
            }
          } catch (error) {
            console.error('Error loading initial state:', error);
          }
        };

        await loadInitialState();
        
        if (!mounted) return;
        setIsConnected(true);

        // Listen for new updates from other clients
        const unsubscribe = onValue(updatesRef, (snapshot) => {
          if (!snapshot.exists() || !ydoc.current) return;

          const data = snapshot.val();
          const latestUpdate = data;

          // Only apply updates from other users
          if (latestUpdate && latestUpdate.userId !== user.uid) {
            try {
              const updateData = new Uint8Array(Object.values(latestUpdate.update));
              Y.applyUpdate(ydoc.current, updateData);
              console.log('📥 Applied remote update from user:', latestUpdate.userId.substring(0, 8));
            } catch (error) {
              console.error('Error applying remote update:', error);
            }
          }
        });

        unsubscribeRef.current = () => off(updatesRef);

        // Send local updates to Firebase
        const updateHandler = async (update: Uint8Array, origin: any) => {
          // Don't sync updates that came from Firebase
          if (origin === 'firebase-sync') return;

          setIsSyncing(true);

          try {
            const updateData = {
              update: Array.from(update),
              userId: user.uid,
              timestamp: Date.now(),
            };

            // Write to real-time updates path
            await set(updatesRef, updateData);

            // Also archive in synced updates for persistence
            await push(syncedUpdatesRef, updateData);

            console.log('📤 Sent local update to Firebase');
            console.log('📊 Update size:', update.length, 'bytes');
          } catch (error) {
            console.error('❌ Error sending update:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
          } finally {
            setIsSyncing(false);
          }
        };

        doc.on('update', updateHandler);

        // Cleanup function
        return () => {
          mounted = false;
          doc.off('update', updateHandler);
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
          }
          doc.destroy();
        };
      } catch (error) {
        console.error('❌ Error initializing collaborative editor:', error);
        setIsConnected(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (ydoc.current) {
        ydoc.current.destroy();
        ydoc.current = null;
      }
    };
  }, [enabled, documentId, user]);

  return {
    ydoc: ydoc.current,
    isConnected,
    isSyncing,
  };
};
