import { useEffect, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { getDatabase, ref, set, onValue, off } from 'firebase/database';
import { useAuth } from '@/contexts/AuthContext';

interface UseCollaborativeEditorProps {
  documentId: string;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
}

/**
 * Custom hook for setting up collaborative editing with TipTap + Y.js + Firebase
 * Handles CRDT synchronization for conflict-free real-time editing
 */
export const useCollaborativeEditor = ({
  documentId,
  onContentChange,
  readOnly = false,
}: UseCollaborativeEditorProps) => {
  const { user } = useAuth();
  const ydoc = useRef<Y.Doc | null>(null);
  const provider = useRef<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);

  // Initialize Y.js document with Firebase Realtime Database sync
  useEffect(() => {
    if (!documentId || !user) return;

    try {
      // Create Y.js document
      ydoc.current = new Y.Doc();
      setIsConnected(true);

      // Setup Firebase Realtime Database sync
      const db = getDatabase();
      const docRef = ref(db, `documents/${documentId}/yjs`);

      // Debounce updates (sync every 5 seconds max)
      let updateTimeout: ReturnType<typeof setTimeout>;
      const debounceUpdate = () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          const state = Y.encodeStateAsUpdate(ydoc.current!);
          set(docRef, {
            state: Array.from(state),
            lastUpdate: Date.now(),
            updatedBy: user.uid,
          }).catch((error) => console.error('Firebase sync error:', error));
        }, 5000);
      };

      ydoc.current.on('update', debounceUpdate);

      // Listen for remote updates from Firebase
      const unsubscribe = onValue(docRef, (snapshot) => {
        const data = snapshot.val();
        if (data?.state && data.updatedBy !== user.uid && ydoc.current) {
          try {
            // Merge remote updates into local Y.js document
            const update = new Uint8Array(data.state);
            Y.applyUpdate(ydoc.current, update);
          } catch (error) {
            console.error('Error applying remote Y.js update:', error);
          }
        }
      });

      return () => {
        clearTimeout(updateTimeout);
        off(docRef);
        if (ydoc.current) {
          ydoc.current.off('update', debounceUpdate);
          ydoc.current.destroy();
        }
      };
    } catch (error) {
      console.error('Error initializing collaborative editor:', error);
      setIsConnected(false);
    }
  }, [documentId, user]);

  // Create TipTap editor with collaboration extensions
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Collaboration.configure({
          document: ydoc.current!,
        }),
        CollaborationCursor.configure({
          provider: {
            // Minimal provider object for cursor tracking
            awareness: {
              doc: ydoc.current,
            },
          },
          user: {
            // @ts-ignore
            name: user?.displayName || 'Anonymous',
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          },
        }),
      ],
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        if (onContentChange) {
          onContentChange(editor.getHTML());
        }
      },
    },
    [readOnly]
  );

  // Track active users from Firestore
  useEffect(() => {
    if (!documentId) return;

    const db = getDatabase();
    const activeUsersRef = ref(db, `documents/${documentId}/activeUsers`);

    const unsubscribe = onValue(activeUsersRef, (snapshot) => {
      const users = snapshot.val();
      if (users) {
        // Filter out inactive users (older than 5 minutes)
        const now = Date.now();
        const active = Object.entries(users)
          .filter(([_, userData]: [string, any]) => now - userData.lastActive < 5 * 60 * 1000)
          .map(([userId]) => userId);
        setActiveUsers(active);
      }
    });

    return () => off(activeUsersRef);
  }, [documentId]);

  // Update user's active status periodically
  useEffect(() => {
    if (!documentId || !user) return;

    const db = getDatabase();
    const userActiveRef = ref(db, `documents/${documentId}/activeUsers/${user.uid}`);

    const updateActive = async () => {
      try {
        // Update user's active status in Firebase Realtime DB
        await set(userActiveRef, {
          uid: user.uid,
          // @ts-ignore
          name: user.displayName || 'Anonymous',
          email: user.email || '',
          lastActive: Date.now(),
        });
      } catch (error) {
        console.error('Error updating active status:', error);
      }
    };

    // Update immediately
    updateActive();

    // Update every 10 seconds
    const interval = setInterval(updateActive, 10000);

    return () => {
      clearInterval(interval);
      // Clean up user presence on unmount
      set(userActiveRef, null).catch((error) =>
        console.error('Error cleaning up presence:', error)
      );
    };
  }, [documentId, user]);

  return {
    editor,
    isConnected,
    activeUsers,
    ydoc: ydoc.current,
  };
};

