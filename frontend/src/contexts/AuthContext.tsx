/**
 * AuthContext
 * Manages authentication state and provides auth methods
 * Used throughout the app via useAuth() hook
 */

import React, { createContext, useEffect, useReducer, useCallback, ReactNode } from 'react';
import {
  User as FirebaseUser,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { apiClient } from '@/services/api';
import toast from 'react-hot-toast';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  firmId: string;
  role: 'admin' | 'lawyer' | 'paralegal';
  createdAt: number;
  updatedAt: number;
}

export interface AuthContextType {
  // State
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Methods
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  createFirm: (firmName: string) => Promise<{ firmId: string; firmCode: string }>;
  joinFirm: (firmCode: string, role: 'lawyer' | 'paralegal') => Promise<{ firmId: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: AuthUser }
  | { type: 'SET_FIREBASE_USER'; payload: FirebaseUser }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

interface AuthState {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// CONTEXT
// ============================================================================

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// REDUCER
// ============================================================================

const initialState: AuthState = {
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };

    case 'SET_FIREBASE_USER':
      return { ...state, firebaseUser: action.payload };

    case 'CLEAR_USER':
      return { ...state, user: null, firebaseUser: null, loading: false };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // =========================================================================
  // AUTH STATE LISTENER
  // =========================================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        if (firebaseUser) {
          dispatch({ type: 'SET_FIREBASE_USER', payload: firebaseUser });

          // Fetch user data from Firestore via auth-service
          const response = await apiClient.getUser(firebaseUser.uid);

          if (response.success && response.data) {
            dispatch({ type: 'SET_USER', payload: response.data as AuthUser });
          } else {
            // User exists in Firebase but not in Firestore
            // This is expected during signup flow - wait for firm creation/join
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          dispatch({ type: 'CLEAR_USER' });
        }
      } catch (error: any) {
        console.error('Auth state change error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    });

    return unsubscribe;
  }, []);

  // =========================================================================
  // AUTH METHODS
  // =========================================================================

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });

        // Create Firebase user
        const userCredential: UserCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const firebaseUser = userCredential.user;

        // Record signup in auth-service
        const response = await apiClient.signup({
          uid: firebaseUser.uid,
          email,
          name,
        });

        if (!response.success) {
          throw new Error(response.error || 'Signup failed');
        }

        dispatch({ type: 'SET_FIREBASE_USER', payload: firebaseUser });
        dispatch({ type: 'SET_LOADING', payload: false });

        toast.success('Signup successful! Please create or join a firm.');
      } catch (error: any) {
        const errorMessage = error.message || 'Signup failed';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        toast.error(errorMessage);
        throw error;
      }
    },
    []
  );

  const login = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Sign in with Firebase
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;

      // Fetch user data from auth-service
      const response = await apiClient.login({ uid: firebaseUser.uid });

      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }

      if (response.data) {
        dispatch({ type: 'SET_USER', payload: response.data as AuthUser });
      }

      toast.success('Login successful!');
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const createFirm = useCallback(
    async (firmName: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });

        if (!state.firebaseUser) {
          throw new Error('No user authenticated');
        }

        const response = await apiClient.createFirm({
          name: firmName,
          userFullName: state.firebaseUser.displayName || state.firebaseUser.email || 'User',
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to create firm');
        }

        // Fetch updated user data
        const userResponse = await apiClient.getUser(state.firebaseUser.uid);

        if (userResponse.success && userResponse.data) {
          dispatch({ type: 'SET_USER', payload: userResponse.data as AuthUser });
        }

        toast.success(`Firm "${firmName}" created successfully!`);
        dispatch({ type: 'SET_LOADING', payload: false });

        return response.data as { firmId: string; firmCode: string };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to create firm';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        toast.error(errorMessage);
        throw error;
      }
    },
    [state.firebaseUser]
  );

  const joinFirm = useCallback(
    async (firmCode: string, role: 'lawyer' | 'paralegal') => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });

        if (!state.firebaseUser) {
          throw new Error('No user authenticated');
        }

        const response = await apiClient.joinFirm({
          firmCode,
          role,
          userFullName: state.firebaseUser.displayName || state.firebaseUser.email || 'User',
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to join firm');
        }

        // Fetch updated user data
        const userResponse = await apiClient.getUser(state.firebaseUser.uid);

        if (userResponse.success && userResponse.data) {
          dispatch({ type: 'SET_USER', payload: userResponse.data as AuthUser });
        }

        toast.success('Successfully joined firm!');
        dispatch({ type: 'SET_LOADING', payload: false });

        return response.data as { firmId: string };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to join firm';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        toast.error(errorMessage);
        throw error;
      }
    },
    [state.firebaseUser]
  );

  const logout = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await signOut(auth);
      dispatch({ type: 'CLEAR_USER' });
      toast.success('Logged out successfully');
    } catch (error: any) {
      const errorMessage = error.message || 'Logout failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================

  const value: AuthContextType = {
    user: state.user,
    firebaseUser: state.firebaseUser,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signup,
    login,
    createFirm,
    joinFirm,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

