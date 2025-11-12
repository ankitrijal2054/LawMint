import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDatabase, ref, set, onValue, off, remove } from 'firebase/database';

interface ActiveUser {
  uid: string;
  name: string;
  email: string;
  lastActive: number;
  cursorPosition?: number;
  color: string;
}

interface UseCollaborationProps {
  documentId: string;
  enabled?: boolean;
}

/**
 * Custom hook for managing collaborative editing presence
 * Tracks active users, their cursor positions, and online status
 * Automatically cleans up inactive users after timeout
 */
export const useCollaboration = ({
  documentId,
  enabled = true,
}: UseCollaborationProps) => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isUserActive, setIsUserActive] = useState(true);

  // Generate a consistent color for each user
  const getUserColor = useCallback((uid: string) => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
    ];
    const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  // Join document (user comes online)
  useEffect(() => {
    if (!enabled || !user || !documentId) return;

    const db = getDatabase();
    const userRef = ref(db, `documents/${documentId}/activeUsers/${user.uid}`);

    const activeUser: ActiveUser = {
      uid: user.uid,
      // @ts-ignore
      name: user.displayName || 'Anonymous',
      email: user.email || '',
      lastActive: Date.now(),
      color: getUserColor(user.uid),
    };

    set(userRef, activeUser).catch((error) => {
      console.error('Error joining document:', error);
    });

    // Listen for changes to active users
    const usersRef = ref(db, `documents/${documentId}/activeUsers`);
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const users = snapshot.val();
      if (users) {
        const now = Date.now();
        const activeUsersArray: ActiveUser[] = Object.entries(users)
          .map(([_, userData]: [string, any]) => userData)
          .filter((userData: ActiveUser) => {
            // Filter out users inactive for more than 5 minutes
            return now - userData.lastActive < 5 * 60 * 1000;
          }) as ActiveUser[];

        setActiveUsers(activeUsersArray);
      }
    });

    return () => {
      off(usersRef);
      remove(userRef).catch((error) => {
        console.error('Error leaving document:', error);
      });
    };
  }, [enabled, user, documentId, getUserColor]);

  // Update user's last active timestamp periodically
  useEffect(() => {
    if (!enabled || !user || !documentId || !isUserActive) return;

    const db = getDatabase();
    const userRef = ref(db, `documents/${documentId}/activeUsers/${user.uid}`);

    const updateActive = async () => {
      try {
        const activeUser: ActiveUser = {
          uid: user.uid,
          // @ts-ignore
      name: user.displayName || 'Anonymous',
          email: user.email || '',
          lastActive: Date.now(),
          color: getUserColor(user.uid),
        };
        await set(userRef, activeUser);
      } catch (error) {
        console.error('Error updating active status:', error);
      }
    };

    // Update immediately
    updateActive();

    // Update every 10 seconds
    const interval = setInterval(updateActive, 10000);

    return () => clearInterval(interval);
  }, [enabled, user, documentId, isUserActive, getUserColor]);

  // Track user activity
  useEffect(() => {
    if (!enabled) return;

    let activityTimeout: ReturnType<typeof setTimeout>;

    const handleActivity = () => {
      setIsUserActive(true);
      clearTimeout(activityTimeout);

      // Mark as inactive after 5 minutes of no activity
      activityTimeout = setTimeout(() => {
        setIsUserActive(false);
      }, 5 * 60 * 1000);
    };

    // Listen to various activity events
    const events = ['mousemove', 'keypress', 'scroll', 'click', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Mark as active initially
    handleActivity();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimeout(activityTimeout);
    };
  }, [enabled]);

  // Get other active users (excluding current user)
  const otherActiveUsers = activeUsers.filter((u) => u.uid !== user?.uid);

  // Get activity status string
  const getActivityStatus = () => {
    const otherCount = otherActiveUsers.length;
    if (otherCount === 0) {
      return 'You are editing alone';
    } else if (otherCount === 1) {
      return `${otherActiveUsers[0].name} is editing`;
    } else {
      return `${otherCount} people are editing`;
    }
  };

  return {
    activeUsers,
    otherActiveUsers,
    isUserActive,
    userCount: activeUsers.length,
    getActivityStatus,
    getUserColor,
  };
};

export default useCollaboration;

